"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getWsBaseUrl } from "../lib/constants";
import type { ChatMessage } from "../lib/types";

interface UseMeetingSocketProps {
  meetingCode: string;
  participantId: number | null;
  onParticipantJoined?: (participantId: number) => void;
  onParticipantReady?: (participantId: number) => void;
  onParticipantLeft?: (participantId: number) => void;
  onMutedByHost?: () => void;
  onParticipantMuted?: (targetId: number, isMuted: boolean) => void;
  onParticipantRemoved?: (targetId: number) => void;
  onMeetingEnded?: () => void;
  onParticipantAudioToggle?: (participantId: number, isMuted: boolean) => void;
  onParticipantVideoToggle?: (participantId: number, isVideoOff: boolean) => void;
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
  onParticipantReady,
  onParticipantLeft,
  onMutedByHost,
  onParticipantMuted,
  onParticipantRemoved,
  onMeetingEnded,
  onParticipantAudioToggle,
  onParticipantVideoToggle,
  onChatMessage,
  onReaction,
  onWebRtcOffer,
  onWebRtcAnswer,
  onWebRtcIceCandidate,
}: UseMeetingSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Store callbacks in ref to prevent stale closures and avoid unnecessary reconnects
  const callbacksRef = useRef<UseMeetingSocketProps>({
    meetingCode,
    participantId,
    onParticipantJoined,
    onParticipantReady,
    onParticipantLeft,
    onMutedByHost,
    onParticipantMuted,
    onParticipantRemoved,
    onMeetingEnded,
    onParticipantAudioToggle,
    onParticipantVideoToggle,
    onChatMessage,
    onReaction,
    onWebRtcOffer,
    onWebRtcAnswer,
    onWebRtcIceCandidate,
  });

  useEffect(() => {
    callbacksRef.current = {
      meetingCode,
      participantId,
      onParticipantJoined,
      onParticipantReady,
      onParticipantLeft,
      onMutedByHost,
      onParticipantMuted,
      onParticipantRemoved,
      onMeetingEnded,
      onParticipantAudioToggle,
      onParticipantVideoToggle,
      onChatMessage,
      onReaction,
      onWebRtcOffer,
      onWebRtcAnswer,
      onWebRtcIceCandidate,
    };
  });

  useEffect(() => {
    if (!meetingCode || !participantId) return;

    let isDisposed = false;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let pingInterval: NodeJS.Timeout | null = null;

    const cleanCode = meetingCode.replace(/\D/g, "") || meetingCode;
    let wsHost = getWsBaseUrl();
    if (typeof window !== "undefined" && wsHost.includes("localhost:8000")) {
      wsHost = "ws://127.0.0.1:8000";
    }
    const wsUrl = `${wsHost}/ws/meeting/${cleanCode}?participant_id=${participantId}`;

    const connect = () => {
      if (isDisposed) return;
      console.log(`[WS] Connecting to ${wsUrl}...`);
      let socket: WebSocket;

      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (isDisposed) {
            socket.close();
            return;
          }
          console.log(`[WS] Connected successfully as participant ${participantId}`);
          setIsConnected(true);

          // Heartbeat keepalive every 20s across tunnel and cellular networks
          if (pingInterval) clearInterval(pingInterval);
          pingInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: "ping" }));
            }
          }, 20000);

          // Announce readiness for WebRTC negotiation
          socket.send(
            JSON.stringify({
              type: "participant_ready",
              participant_id: participantId,
            })
          );
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const type = data.type;
            const cb = callbacksRef.current;

            if (type === "pong") {
              return;
            }

            if (type === "participant_joined") {
              console.log(`[WS] participant_joined: ${data.participant_id}`);
              cb.onParticipantJoined?.(data.participant_id);
            } else if (type === "participant_ready") {
              console.log(`[WS] participant_ready: ${data.participant_id}`);
              cb.onParticipantReady?.(data.participant_id);
            } else if (type === "participant_left") {
              console.log(`[WS] participant_left: ${data.participant_id}`);
              cb.onParticipantLeft?.(data.participant_id);
            } else if (type === "muted_by_host") {
              cb.onMutedByHost?.();
            } else if (type === "participant_muted") {
              cb.onParticipantMuted?.(data.target_participant_id, data.is_muted);
            } else if (type === "participant_removed") {
              cb.onParticipantRemoved?.(data.target_participant_id);
            } else if (type === "meeting_ended") {
              cb.onMeetingEnded?.();
            } else if (type === "audio_toggle") {
              cb.onParticipantAudioToggle?.(data.participant_id, data.is_muted);
            } else if (type === "video_toggle") {
              cb.onParticipantVideoToggle?.(data.participant_id, data.is_video_off);
            } else if (type === "chat_message") {
              cb.onChatMessage?.({
                id: Date.now(),
                meeting_id: 0,
                participant_id: data.participant_id,
                content: data.content,
                created_at: new Date().toISOString(),
                sender_name: data.sender_name || "Participant",
              });
            } else if (type === "reaction") {
              cb.onReaction?.(data.reaction, data.participant_id);
            } else if (type === "webrtc_offer") {
              console.log(`[WS] Received webrtc_offer from ${data.sender_participant_id}`);
              cb.onWebRtcOffer?.(data.sender_participant_id, data.offer);
            } else if (type === "webrtc_answer") {
              console.log(`[WS] Received webrtc_answer from ${data.sender_participant_id}`);
              cb.onWebRtcAnswer?.(data.sender_participant_id, data.answer);
            } else if (type === "webrtc_ice_candidate") {
              cb.onWebRtcIceCandidate?.(data.sender_participant_id, data.candidate);
            }
          } catch (e) {
            console.error("Error parsing WebSocket message:", e);
          }
        };

        socket.onerror = (err) => {
          console.warn(`[WS] Connection error for participant ${participantId}:`, err);
        };

        socket.onclose = () => {
          console.warn(`[WS] Closed for participant ${participantId}`);
          setIsConnected(false);
          if (pingInterval) clearInterval(pingInterval);

          if (!isDisposed) {
            console.log(`[WS] Auto-reconnecting in 1500ms...`);
            reconnectTimeout = setTimeout(connect, 1500);
          }
        };
      } catch (err) {
        console.error("Failed to initialize WebSocket:", err);
        if (!isDisposed) {
          reconnectTimeout = setTimeout(connect, 2000);
        }
      }
    };

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pingInterval) clearInterval(pingInterval);
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

  const sendAudioToggle = useCallback(
    (isMuted: boolean) => {
      sendMessage({
        type: "audio_toggle",
        is_muted: isMuted,
      });
    },
    [sendMessage]
  );

  const sendVideoToggle = useCallback(
    (isVideoOff: boolean) => {
      sendMessage({
        type: "video_toggle",
        is_video_off: isVideoOff,
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
    sendAudioToggle,
    sendVideoToggle,
    sendRemoveParticipant,
    sendMeetingEnded,
    sendReaction,
    sendWebRtcOffer,
    sendWebRtcAnswer,
    sendWebRtcIceCandidate,
  };
}
