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
  // Map of participantId -> queued ICE candidates waiting for remoteDescription
  const pendingCandidatesRef = useRef<Map<number, RTCIceCandidateInit[]>>(new Map());
  // Tracks in-progress offer creation to avoid glare
  const isMakingOfferRef = useRef<Map<number, boolean>>(new Map());
  // Map of participantId -> remote MediaStream
  const [remoteStreams, setRemoteStreams] = useState<Record<number, MediaStream>>({});

  // Deterministic tie-breaker: peer with higher ID is polite (rolls back on offer collision)
  const isPolite = useCallback(
    (peerId: number): boolean => {
      if (!currentParticipantId) return true;
      return currentParticipantId > peerId;
    },
    [currentParticipantId]
  );

  // Helper to get or create peer connection for a participant
  const getOrCreatePeerConnection = useCallback(
    (peerId: number): RTCPeerConnection => {
      const existing = peerConnectionsRef.current.get(peerId);
      if (existing && existing.connectionState !== "closed") {
        return existing;
      }

      const pc = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 2,
      });

      // Ensure both audio and video transceivers exist with sendrecv direction
      try {
        pc.addTransceiver("audio", { direction: "sendrecv" });
      } catch {}

      try {
        pc.addTransceiver("video", { direction: "sendrecv" });
      } catch {}

      // Attach current local tracks if available
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0] || null;
        const videoTrack = localStream.getVideoTracks()[0] || null;

        pc.getSenders().forEach((sender) => {
          if (sender.track?.kind === "audio" || (sender.track === null && audioTrack)) {
            if (audioTrack) sender.replaceTrack(audioTrack).catch(() => {});
          }
          if (sender.track?.kind === "video" || (sender.track === null && videoTrack)) {
            if (videoTrack) sender.replaceTrack(videoTrack).catch(() => {});
          }
        });
      }

      // Handle incoming remote media tracks and accumulate into MediaStream
      pc.ontrack = (event) => {
        setRemoteStreams((prev) => {
          const prevStream = prev[peerId];
          const stream = prevStream ? new MediaStream(prevStream.getTracks()) : new MediaStream();

          if (event.track && !stream.getTracks().some((t) => t.id === event.track.id)) {
            stream.addTrack(event.track);
          }
          if (event.streams && event.streams[0]) {
            event.streams[0].getTracks().forEach((track) => {
              if (!stream.getTracks().some((t) => t.id === track.id)) {
                stream.addTrack(track);
              }
            });
          }

          return {
            ...prev,
            [peerId]: stream,
          };
        });
      };

      // Send local ICE candidates to remote peer via WebSocket
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendWebRtcIceCandidate(peerId, event.candidate.toJSON());
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          if (pc.connectionState === "failed") {
            try {
              pc.restartIce();
            } catch {}
          }
        }
      };

      peerConnectionsRef.current.set(peerId, pc);
      return pc;
    },
    [localStream, sendWebRtcIceCandidate]
  );

  // Update tracks on all active peer connections when localStream changes (e.g. video toggled, screen shared)
  useEffect(() => {
    peerConnectionsRef.current.forEach((pc) => {
      const audioTrack = localStream?.getAudioTracks()[0] || null;
      const videoTrack = localStream?.getVideoTracks()[0] || null;

      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === "audio" || (sender.track === null && audioTrack)) {
          sender.replaceTrack(audioTrack).catch((err) => console.warn("audio replaceTrack error:", err));
        }
        if (sender.track?.kind === "video" || (sender.track === null && videoTrack)) {
          sender.replaceTrack(videoTrack).catch((err) => console.warn("video replaceTrack error:", err));
        }
      });
    });
  }, [localStream]);

  // Initiate an offer when a new participant joins
  const initiateCall = useCallback(
    async (peerId: number) => {
      try {
        const pc = getOrCreatePeerConnection(peerId);
        // Avoid sending offer if already connected
        if (pc.connectionState === "connected") {
          return;
        }

        isMakingOfferRef.current.set(peerId, true);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        // Avoid race if remote offer arrived while making offer
        if (pc.signalingState !== "stable") {
          return;
        }

        await pc.setLocalDescription(offer);
        sendWebRtcOffer(peerId, offer);
      } catch (err) {
        console.warn(`Failed to create WebRTC offer to ${peerId}:`, err);
      } finally {
        isMakingOfferRef.current.set(peerId, false);
      }
    },
    [getOrCreatePeerConnection, sendWebRtcOffer]
  );

  // Handle incoming offer from a peer (with Polite Peer collision handling)
  const handleOffer = useCallback(
    async (senderId: number, offer: RTCSessionDescriptionInit) => {
      try {
        const pc = getOrCreatePeerConnection(senderId);
        const readyForOffer = !isMakingOfferRef.current.get(senderId) && pc.signalingState === "stable";
        const offerCollision = !readyForOffer;

        if (offerCollision) {
          if (!isPolite(senderId)) {
            // Impolite peer ignores colliding offer
            return;
          }
          // Polite peer rolls back local description to accept remote offer
          try {
            await pc.setLocalDescription({ type: "rollback" } as any);
          } catch {}
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Drain any pending ICE candidates queued before remoteDescription was set
        const pending = pendingCandidatesRef.current.get(senderId) || [];
        for (const candidate of pending) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn("Error adding queued ICE candidate:", e);
          }
        }
        pendingCandidatesRef.current.delete(senderId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendWebRtcAnswer(senderId, answer);
      } catch (err) {
        console.warn(`Failed to handle WebRTC offer from ${senderId}:`, err);
      }
    },
    [getOrCreatePeerConnection, isPolite, sendWebRtcAnswer]
  );

  // Handle incoming answer from a peer
  const handleAnswer = useCallback(
    async (senderId: number, answer: RTCSessionDescriptionInit) => {
      try {
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc && pc.signalingState !== "stable") {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));

          // Drain queued candidates
          const pending = pendingCandidatesRef.current.get(senderId) || [];
          for (const candidate of pending) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn("Error adding queued ICE candidate:", e);
            }
          }
          pendingCandidatesRef.current.delete(senderId);
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
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          // Queue candidate until remoteDescription is set
          if (!pendingCandidatesRef.current.has(senderId)) {
            pendingCandidatesRef.current.set(senderId, []);
          }
          pendingCandidatesRef.current.get(senderId)!.push(candidate);
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
    pendingCandidatesRef.current.delete(peerId);
    isMakingOfferRef.current.delete(peerId);
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
      pendingCandidatesRef.current.clear();
      isMakingOfferRef.current.clear();
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
