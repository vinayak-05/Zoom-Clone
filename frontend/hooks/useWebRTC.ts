"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ICE_SERVERS } from "../lib/constants";

interface UseWebRTCProps {
  currentParticipantId: number | null;
  localStream: MediaStream | null;
  sendWebRtcOffer: (targetId: number, offer: RTCSessionDescriptionInit) => void;
  sendWebRtcAnswer: (targetId: number, answer: RTCSessionDescriptionInit) => void;
  sendWebRtcIceCandidate: (targetId: number, candidate: RTCIceCandidateInit) => void;
}

export function useWebRTC({
  currentParticipantId,
  localStream,
  sendWebRtcOffer,
  sendWebRtcAnswer,
  sendWebRtcIceCandidate,
}: UseWebRTCProps) {
  // Map of participantId -> RTCPeerConnection
  const peerConnectionsRef = useRef<Map<number, RTCPeerConnection>>(new Map());
  // Map of participantId -> remote MediaStream
  const [remoteStreams, setRemoteStreams] = useState<Record<number, MediaStream>>({});

  // Helper to get or create peer connection for a participant
  const getOrCreatePeerConnection = useCallback(
    (peerId: number): RTCPeerConnection => {
      const existing = peerConnectionsRef.current.get(peerId);
      if (existing && existing.connectionState !== "closed") {
        return existing;
      }

      const pc = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
      });

      // Add local media tracks to the peer connection
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      // Handle incoming remote media tracks
      pc.ontrack = (event) => {
        const stream = event.streams[0] || new MediaStream([event.track]);
        setRemoteStreams((prev) => ({
          ...prev,
          [peerId]: stream,
        }));
      };

      // Send local ICE candidates to remote peer via WebSocket
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendWebRtcIceCandidate(peerId, event.candidate.toJSON());
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
          peerConnectionsRef.current.delete(peerId);
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[peerId];
            return next;
          });
        }
      };

      peerConnectionsRef.current.set(peerId, pc);
      return pc;
    },
    [localStream, sendWebRtcIceCandidate]
  );

  // Update tracks on all active peer connections when localStream changes (e.g. video toggled, screen shared)
  useEffect(() => {
    if (!localStream) return;
    peerConnectionsRef.current.forEach((pc) => {
      const senders = pc.getSenders();
      localStream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track).catch((err) => console.warn("replaceTrack error:", err));
        } else {
          try {
            pc.addTrack(track, localStream);
          } catch {}
        }
      });
    });
  }, [localStream]);

  // Initiate an offer when a new participant joins
  const initiateCall = useCallback(
    async (peerId: number) => {
      try {
        const pc = getOrCreatePeerConnection(peerId);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        sendWebRtcOffer(peerId, offer);
      } catch (err) {
        console.warn(`Failed to create WebRTC offer to ${peerId}:`, err);
      }
    },
    [getOrCreatePeerConnection, sendWebRtcOffer]
  );

  // Handle incoming offer from a peer
  const handleOffer = useCallback(
    async (senderId: number, offer: RTCSessionDescriptionInit) => {
      try {
        const pc = getOrCreatePeerConnection(senderId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendWebRtcAnswer(senderId, answer);
      } catch (err) {
        console.warn(`Failed to handle WebRTC offer from ${senderId}:`, err);
      }
    },
    [getOrCreatePeerConnection, sendWebRtcAnswer]
  );

  // Handle incoming answer from a peer
  const handleAnswer = useCallback(
    async (senderId: number, answer: RTCSessionDescriptionInit) => {
      try {
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc && pc.signalingState !== "stable") {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.warn(`Failed to set WebRTC answer from ${senderId}:`, err);
      }
    },
    []
  );

  // Handle incoming ICE candidate from a peer
  const handleIceCandidate = useCallback(
    async (senderId: number, candidate: RTCIceCandidateInit) => {
      try {
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.warn(`Failed to add ICE candidate from ${senderId}:`, err);
      }
    },
    []
  );

  // Clean up peer when they leave
  const removePeer = useCallback((peerId: number) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, []);

  return {
    remoteStreams,
    initiateCall,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    removePeer,
  };
}
