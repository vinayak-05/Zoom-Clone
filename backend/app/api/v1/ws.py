"""WebSocket endpoint for real-time presence, host controls, chat, and WebRTC signaling."""

import re
import json
import logging
from typing import Dict, Set, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

logger = logging.getLogger("zoom.ws")
router = APIRouter(tags=["WebSocket"])


def clean_meeting_code(code: str) -> str:
    """Normalize meeting code to digits only for uniform room matching."""
    digits = re.sub(r"\D", "", code)
    return digits if digits else code.strip()


class MeetingConnectionManager:
    """Manages active WebSocket connections and buffered signaling per meeting room."""

    def __init__(self) -> None:
        # room_code -> dict of participant_id -> WebSocket
        self.rooms: Dict[str, Dict[int, WebSocket]] = {}
        # room_code -> dict of participant_id -> list of buffered signaling messages
        self.message_buffer: Dict[str, Dict[int, List[dict]]] = {}

    async def connect(self, raw_code: str, participant_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        room_code = clean_meeting_code(raw_code)
        if room_code not in self.rooms:
            self.rooms[room_code] = {}
        self.rooms[room_code][participant_id] = websocket

        # Flush any buffered WebRTC signaling messages waiting for this participant
        if room_code in self.message_buffer and participant_id in self.message_buffer[room_code]:
            buffered = self.message_buffer[room_code].pop(participant_id, [])
            for msg in buffered:
                try:
                    await websocket.send_text(json.dumps(msg))
                except Exception as e:
                    logger.warning(f"Failed delivering buffered message to {participant_id}: {e}")

        # Broadcast participant-joined event to others in room
        await self.broadcast(
            room_code,
            {
                "type": "participant_joined",
                "participant_id": participant_id,
            },
            exclude_participant_id=participant_id,
        )

    def disconnect(self, raw_code: str, participant_id: int) -> None:
        room_code = clean_meeting_code(raw_code)
        if room_code in self.rooms:
            self.rooms[room_code].pop(participant_id, None)
            if not self.rooms[room_code]:
                self.rooms.pop(room_code, None)
        if room_code in self.message_buffer:
            self.message_buffer[room_code].pop(participant_id, None)
            if not self.message_buffer[room_code]:
                self.message_buffer.pop(room_code, None)

    async def broadcast(
        self,
        raw_code: str,
        message: dict,
        exclude_participant_id: int | None = None,
    ) -> None:
        room_code = clean_meeting_code(raw_code)
        if room_code not in self.rooms:
            return

        dead_connections: Set[int] = set()
        msg_text = json.dumps(message)

        for pid, ws in list(self.rooms[room_code].items()):
            if exclude_participant_id is not None and pid == exclude_participant_id:
                continue
            try:
                await ws.send_text(msg_text)
            except Exception as e:
                logger.warning(f"Failed to send to participant {pid}: {e}")
                dead_connections.add(pid)

        for pid in dead_connections:
            self.disconnect(room_code, pid)

    async def send_to_participant(
        self,
        raw_code: str,
        target_participant_id: int,
        message: dict,
    ) -> bool:
        room_code = clean_meeting_code(raw_code)
        if room_code in self.rooms and target_participant_id in self.rooms[room_code]:
            try:
                ws = self.rooms[room_code][target_participant_id]
                await ws.send_text(json.dumps(message))
                return True
            except Exception as e:
                logger.warning(f"Failed sending direct message to {target_participant_id}: {e}")
                self.disconnect(room_code, target_participant_id)

        # If recipient has not connected yet, buffer crucial WebRTC signaling messages
        if message.get("type") in ("webrtc_offer", "webrtc_answer", "webrtc_ice_candidate"):
            if room_code not in self.message_buffer:
                self.message_buffer[room_code] = {}
            if target_participant_id not in self.message_buffer[room_code]:
                self.message_buffer[room_code][target_participant_id] = []
            # Keep at most 20 buffered messages per participant to prevent memory leak
            if len(self.message_buffer[room_code][target_participant_id]) < 20:
                self.message_buffer[room_code][target_participant_id].append(message)
            return True

        return False


manager = MeetingConnectionManager()


@router.websocket("/ws/meeting/{code}")
async def meeting_websocket_endpoint(
    websocket: WebSocket,
    code: str,
    participant_id: int = Query(...),
) -> None:
    """Real-time bi-directional channel for presence, signaling, chat, and controls."""
    room_code = clean_meeting_code(code)
    await manager.connect(room_code, participant_id, websocket)
    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                data = json.loads(data_text)
            except json.JSONDecodeError:
                continue

            msg_type = data.get("type")

            # 1. WebRTC Signaling: offer, answer, ice-candidate
            if msg_type in ("webrtc_offer", "webrtc_answer", "webrtc_ice_candidate"):
                target_pid = data.get("target_participant_id")
                data["sender_participant_id"] = participant_id
                if target_pid:
                    delivered = await manager.send_to_participant(room_code, int(target_pid), data)
                    logger.info(f"[WS Signaling] {msg_type} from {participant_id} -> {target_pid} (delivered={delivered})")
                else:
                    await manager.broadcast(room_code, data, exclude_participant_id=participant_id)
                    logger.info(f"[WS Signaling] {msg_type} broadcast from {participant_id}")

            # 2. Participant ready for signaling handshake
            elif msg_type == "participant_ready":
                data["participant_id"] = participant_id
                logger.info(f"[WS Presence] participant_ready from {participant_id} in room {room_code}")
                await manager.broadcast(room_code, data, exclude_participant_id=participant_id)

            # 3. Host controls (mute-all, mute-participant, remove-participant)
            elif msg_type == "mute_all":
                await manager.broadcast(room_code, {
                    "type": "muted_by_host",
                    "muted_by": participant_id,
                }, exclude_participant_id=participant_id)

            elif msg_type == "participant_muted":
                await manager.broadcast(room_code, {
                    "type": "participant_muted",
                    "target_participant_id": data.get("target_participant_id"),
                    "is_muted": data.get("is_muted", True),
                })

            elif msg_type == "participant_removed":
                await manager.broadcast(room_code, {
                    "type": "participant_removed",
                    "target_participant_id": data.get("target_participant_id"),
                })

            # 4. Meeting ended by host
            elif msg_type == "meeting_ended":
                await manager.broadcast(room_code, {
                    "type": "meeting_ended",
                })

            # 5. State toggles (video, audio, hand raise)
            elif msg_type in ("video_toggle", "audio_toggle", "hand_raise"):
                data["participant_id"] = participant_id
                await manager.broadcast(room_code, data, exclude_participant_id=participant_id)

            # 6. Real-time Chat
            elif msg_type == "chat_message":
                data["participant_id"] = participant_id
                await manager.broadcast(room_code, data, exclude_participant_id=participant_id)

            # 7. Reactions
            elif msg_type == "reaction":
                data["participant_id"] = participant_id
                await manager.broadcast(room_code, data)

            # 8. Heartbeat keepalive ping
            elif msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        manager.disconnect(room_code, participant_id)
        await manager.broadcast(room_code, {
            "type": "participant_left",
            "participant_id": participant_id,
        })
    except Exception as e:
        logger.error(f"WebSocket unexpected error: {e}")
        manager.disconnect(room_code, participant_id)
        await manager.broadcast(room_code, {
            "type": "participant_left",
            "participant_id": participant_id,
        })


@router.get("/ws/debug")
async def ws_debug_endpoint():
    """Debug active WebSocket rooms and participant connections."""
    return {
        "rooms": {room: list(conns.keys()) for room, conns in manager.rooms.items()},
        "buffered": {room: list(buf.keys()) for room, buf in manager.message_buffer.items()},
    }

