"""WebSocket endpoint for real-time presence, host controls, chat, and WebRTC signaling."""

import json
import logging
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

logger = logging.getLogger("zoom.ws")
router = APIRouter(tags=["WebSocket"])


class MeetingConnectionManager:
    """Manages active WebSocket connections per meeting room."""

    def __init__(self) -> None:
        # room_code -> dict of participant_id -> WebSocket
        self.rooms: Dict[str, Dict[int, WebSocket]] = {}

    async def connect(self, room_code: str, participant_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        if room_code not in self.rooms:
            self.rooms[room_code] = {}
        self.rooms[room_code][participant_id] = websocket

        # Broadcast participant-joined event to others in room
        await self.broadcast(
            room_code,
            {
                "type": "participant_joined",
                "participant_id": participant_id,
            },
            exclude_participant_id=participant_id,
        )

    def disconnect(self, room_code: str, participant_id: int) -> None:
        if room_code in self.rooms:
            self.rooms[room_code].pop(participant_id, None)
            if not self.rooms[room_code]:
                self.rooms.pop(room_code, None)

    async def broadcast(
        self,
        room_code: str,
        message: dict,
        exclude_participant_id: int | None = None,
    ) -> None:
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
        room_code: str,
        target_participant_id: int,
        message: dict,
    ) -> bool:
        if room_code in self.rooms and target_participant_id in self.rooms[room_code]:
            try:
                ws = self.rooms[room_code][target_participant_id]
                await ws.send_text(json.dumps(message))
                return True
            except Exception as e:
                logger.warning(f"Failed sending direct message to {target_participant_id}: {e}")
                self.disconnect(room_code, target_participant_id)
        return False


manager = MeetingConnectionManager()


@router.websocket("/ws/meeting/{code}")
async def meeting_websocket_endpoint(
    websocket: WebSocket,
    code: str,
    participant_id: int = Query(...),
) -> None:
    """Real-time bi-directional channel for presence, signaling, chat, and controls."""
    await manager.connect(code, participant_id, websocket)
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
                    await manager.send_to_participant(code, int(target_pid), data)
                else:
                    await manager.broadcast(code, data, exclude_participant_id=participant_id)

            # 2. Host controls (mute-all, mute-participant, remove-participant)
            elif msg_type == "mute_all":
                await manager.broadcast(code, {
                    "type": "muted_by_host",
                    "muted_by": participant_id,
                }, exclude_participant_id=participant_id)

            elif msg_type == "participant_muted":
                await manager.broadcast(code, {
                    "type": "participant_muted",
                    "target_participant_id": data.get("target_participant_id"),
                    "is_muted": data.get("is_muted", True),
                })

            elif msg_type == "participant_removed":
                await manager.broadcast(code, {
                    "type": "participant_removed",
                    "target_participant_id": data.get("target_participant_id"),
                })

            # 3. Meeting ended by host
            elif msg_type == "meeting_ended":
                await manager.broadcast(code, {
                    "type": "meeting_ended",
                })

            # 4. State toggles (video, hand raise)
            elif msg_type in ("video_toggle", "audio_toggle", "hand_raise"):
                data["participant_id"] = participant_id
                await manager.broadcast(code, data, exclude_participant_id=participant_id)

            # 5. Real-time Chat
            elif msg_type == "chat_message":
                data["participant_id"] = participant_id
                await manager.broadcast(code, data)

            # 6. Reactions
            elif msg_type == "reaction":
                data["participant_id"] = participant_id
                await manager.broadcast(code, data)

    except WebSocketDisconnect:
        manager.disconnect(code, participant_id)
        await manager.broadcast(code, {
            "type": "participant_left",
            "participant_id": participant_id,
        })
    except Exception as e:
        logger.error(f"WebSocket unexpected error: {e}")
        manager.disconnect(code, participant_id)
        await manager.broadcast(code, {
            "type": "participant_left",
            "participant_id": participant_id,
        })
