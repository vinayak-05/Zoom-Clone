"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WS_BASE_URL, getWsBaseUrl } from "../lib/constants";
import type { Participant, ChatMessage } from "../lib/types";

interface UseMeetingSocketProps {
  meetingCode: string;
  participantId: number | null;
  onParticipantJoined?: (participantId: number) => void;
  onParticipantLeft?: (participantId: number) => void;
  onMutedByHost?: () => void;
  onParticipantMuted?: (targetId: number, isMuted: boolean) => void;
  onParticipantRemoved?: (targetId: number) => void;
  onMeetingEnded?: () => void;
  onChatMessage?: (message: ChatMessage) => void;
  onReaction?: (reaction: string, senderId: number) => void;
  onWebRtcOffer?: (senderId: number, offer: RTCSessionDescriptionInit) => void;
  onWebRtcAnswer?: (senderId: number, answer: RTCSessionDescriptionInit) => void;
  onWebRtcIceCandidate?: (senderId: number, candidate: RTCIceCandidateInit) => void;
}

export function useMeetingSocket({
  meetingCode,
  participantId,
  onParticipantJoined,
  onParticipantLeft,
  onMutedByHost,
  onParticipantMuted,
  onParticipantRemoved,
  onMeetingEnded,
  onChatMessage,
  onReaction,
  onWebRtcOffer,
  onWebRtcAnswer,
  onWebRtcIceCandidate,
}: UseMeetingSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!meetingCode || !participantId) return;

    let wsHost = getWsBaseUrl();
    if (typeof window !== "undefined" && wsHost.includes("localhost:8000")) {
      wsHost = "ws://127.0.0.1:8000";
    }
    const wsUrl = `${wsHost}/ws/meeting/${meetingCode}?participant_id=${participantId}`;
    let socket: WebSocket;

    try {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type;

          if (type === "participant_joined") {
            onParticipantJoined?.(data.participant_id);
          } else if (type === "participant_left") {
            onParticipantLeft?.(data.participant_id);
          } else if (type === "muted_by_host") {
            onMutedByHost?.();
          } else if (type === "participant_muted") {
            onParticipantMuted?.(data.target_participant_id, data.is_muted);
          } else if (type === "participant_removed") {
            onParticipantRemoved?.(data.target_participant_id);
          } else if (type === "meeting_ended") {
            onMeetingEnded?.();
          } else if (type === "chat_message") {
            onChatMessage?.({
              id: Date.now(),
              meeting_id: 0,
              participant_id: data.participant_id,
              content: data.content,
              created_at: new Date().toISOString(),
              sender_name: data.sender_name || "Participant",
            });
          } else if (type === "reaction") {
            onReaction?.(data.reaction, data.participant_id);
          } else if (type === "webrtc_offer") {
            onWebRtcOffer?.(data.sender_participant_id, data.offer);
          } else if (type === "webrtc_answer") {
            onWebRtcAnswer?.(data.sender_participant_id, data.answer);
          } else if (type === "webrtc_ice_candidate") {
            onWebRtcIceCandidate?.(data.sender_participant_id, data.candidate);
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      socket.onerror = (err) => {
        console.warn("WebSocket connection error:", err);
      };

      socket.onclose = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.error("Failed to initialize WebSocket:", err);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [meetingCode, participantId]);

  const sendMessage = useCallback((payload: Record<string, unknown>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const sendChatMessage = useCallback(
    (content: string, senderName: string) => {
      sendMessage({
        type: "chat_message",
        content,
        sender_name: senderName,
      });
    },
    [sendMessage]
  );

  const sendMuteAll = useCallback(() => {
    sendMessage({ type: "mute_all" });
  }, [sendMessage]);

  const sendMuteParticipant = useCallback(
    (targetParticipantId: number, isMuted: boolean) => {
      sendMessage({
        type: "participant_muted",
        target_participant_id: targetParticipantId,
        is_muted: isMuted,
      });
    },
    [sendMessage]
  );

  const sendRemoveParticipant = useCallback(
    (targetParticipantId: number) => {
      sendMessage({
        type: "participant_removed",
        target_participant_id: targetParticipantId,
      });
    },
    [sendMessage]
  );

  const sendMeetingEnded = useCallback(() => {
    sendMessage({ type: "meeting_ended" });
  }, [sendMessage]);

  const sendReaction = useCallback(
    (reaction: string) => {
      sendMessage({ type: "reaction", reaction });
    },
    [sendMessage]
  );

  const sendWebRtcOffer = useCallback(
    (targetParticipantId: number, offer: RTCSessionDescriptionInit) => {
      sendMessage({
        type: "webrtc_offer",
        target_participant_id: targetParticipantId,
        offer,
      });
    },
    [sendMessage]
  );

  const sendWebRtcAnswer = useCallback(
    (targetParticipantId: number, answer: RTCSessionDescriptionInit) => {
      sendMessage({
        type: "webrtc_answer",
        target_participant_id: targetParticipantId,
        answer,
      });
    },
    [sendMessage]
  );

  const sendWebRtcIceCandidate = useCallback(
    (targetParticipantId: number, candidate: RTCIceCandidateInit) => {
      sendMessage({
        type: "webrtc_ice_candidate",
        target_participant_id: targetParticipantId,
        candidate,
      });
    },
    [sendMessage]
  );

  return {
    isConnected,
    sendMessage,
    sendChatMessage,
    sendMuteAll,
    sendMuteParticipant,
    sendRemoveParticipant,
    sendMeetingEnded,
    sendReaction,
    sendWebRtcOffer,
    sendWebRtcAnswer,
    sendWebRtcIceCandidate,
  };
}
