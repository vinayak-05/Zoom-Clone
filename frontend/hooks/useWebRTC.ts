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

      console.log(`[WebRTC] Initializing RTCPeerConnection for peer ${peerId}`);
      const pc = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 2,
      });

      // Explicitly register both audio and video transceivers with sendrecv
      const audioTransceiver = pc.addTransceiver("audio", { direction: "sendrecv" });
      const videoTransceiver = pc.addTransceiver("video", { direction: "sendrecv" });

      // Attach current local tracks directly to their matching transceiver senders
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0] || null;
        const videoTrack = localStream.getVideoTracks()[0] || null;

        if (audioTrack) {
          audioTransceiver.sender.replaceTrack(audioTrack).catch((err) => {
            console.warn(`[WebRTC] Error attaching audio track to ${peerId}:`, err);
          });
        }
        if (videoTrack) {
          videoTransceiver.sender.replaceTrack(videoTrack).catch((err) => {
            console.warn(`[WebRTC] Error attaching video track to ${peerId}:`, err);
          });
        }
      }

      // Handle incoming remote media tracks and accumulate into MediaStream
      pc.ontrack = (event) => {
        console.log(
          `[WebRTC] ontrack from peer ${peerId}: kind=${event.track.kind}, id=${event.track.id}, readyState=${event.track.readyState}`
        );

        const updateRemoteStream = () => {
          setRemoteStreams((prev) => {
            const current = prev[peerId];
            const stream = current ? new MediaStream(current.getTracks()) : new MediaStream();

            if (event.track && !stream.getTracks().some((t) => t.id === event.track.id)) {
              stream.addTrack(event.track);
            }
            if (event.streams && event.streams[0]) {
              event.streams[0].getTracks().forEach((t) => {
                if (!stream.getTracks().some((existingT) => existingT.id === t.id)) {
                  stream.addTrack(t);
                }
              });
            }

            return {
              ...prev,
              [peerId]: stream,
            };
          });
        };

        if (event.track) {
          updateRemoteStream();

          event.track.onunmute = () => {
            console.log(`[WebRTC] Track unmuted from ${peerId}: kind=${event.track.kind}`);
            updateRemoteStream();
          };

          event.track.onended = () => {
            console.log(`[WebRTC] Track ended from ${peerId}: kind=${event.track.kind}`);
          };
        }
      };

      // Send local ICE candidates to remote peer via WebSocket
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`[WebRTC] Sending ICE candidate to ${peerId}: ${event.candidate.type}`);
          sendWebRtcIceCandidate(peerId, event.candidate.toJSON());
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC] Connection state to ${peerId}: ${pc.connectionState}`);
        if (pc.connectionState === "failed") {
          console.warn(`[WebRTC] Peer ${peerId} connection failed. Triggering ICE restart.`);
          try {
            initiateCall(peerId, true);
          } catch (e) {
            console.warn("[WebRTC] ICE restart error:", e);
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC] ICE connection state to ${peerId}: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === "failed") {
          try {
            initiateCall(peerId, true);
          } catch {}
        }
      };

      peerConnectionsRef.current.set(peerId, pc);
      return pc;
    },
    [localStream, sendWebRtcIceCandidate]
  );

  // Update tracks on all active peer connections when localStream changes
  useEffect(() => {
    const audioTrack = localStream?.getAudioTracks()[0] || null;
    const videoTrack = localStream?.getVideoTracks()[0] || null;

    peerConnectionsRef.current.forEach((pc, peerId) => {
      pc.getTransceivers().forEach((transceiver) => {
        const kind = transceiver.receiver.track.kind;
        if (kind === "audio") {
          transceiver.sender.replaceTrack(audioTrack).catch((err) => {
            console.warn(`[WebRTC] Failed updating audio track for peer ${peerId}:`, err);
          });
        } else if (kind === "video") {
          transceiver.sender.replaceTrack(videoTrack).catch((err) => {
            console.warn(`[WebRTC] Failed updating video track for peer ${peerId}:`, err);
          });
        }
      });
    });
  }, [localStream]);

  // Initiate an offer when a new participant joins or reconnects
  const initiateCall = useCallback(
    async (peerId: number, isIceRestart = false) => {
      try {
        const pc = getOrCreatePeerConnection(peerId);

        if (!isIceRestart) {
          // Avoid duplicate offers if connection is already established or active negotiation in progress
          if (pc.connectionState === "connected" || pc.connectionState === "connecting") {
            console.log(`[WebRTC] Peer ${peerId} already in ${pc.connectionState} state, skipping offer.`);
            return;
          }
          if (isMakingOfferRef.current.get(peerId)) {
            console.log(`[WebRTC] Already making offer to peer ${peerId}, skipping.`);
            return;
          }
          if (pc.signalingState !== "stable") {
            console.log(`[WebRTC] Signaling state for peer ${peerId} is ${pc.signalingState}, waiting.`);
            return;
          }
        }

        console.log(`[WebRTC] Creating offer for peer ${peerId} (iceRestart=${isIceRestart})`);
        isMakingOfferRef.current.set(peerId, true);
        const offer = await pc.createOffer({
          iceRestart: isIceRestart,
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        // Avoid race if remote offer arrived while making offer
        if (pc.signalingState !== "stable" && !isIceRestart) {
          console.warn(`[WebRTC] Signaling state became ${pc.signalingState}, aborting local offer to ${peerId}`);
          return;
        }

        await pc.setLocalDescription(offer);
        console.log(`[WebRTC] Sending offer to peer ${peerId}`);
        sendWebRtcOffer(peerId, offer);
      } catch (err) {
        console.warn(`[WebRTC] Failed to create WebRTC offer to ${peerId}:`, err);
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
        console.log(`[WebRTC] Handling offer from peer ${senderId}`);
        const pc = getOrCreatePeerConnection(senderId);
        const readyForOffer = !isMakingOfferRef.current.get(senderId) && pc.signalingState === "stable";
        const offerCollision = !readyForOffer;

        if (offerCollision) {
          if (!isPolite(senderId)) {
            console.log(`[WebRTC] Impolite peer ignoring colliding offer from ${senderId}`);
            return;
          }
          console.log(`[WebRTC] Polite peer rolling back local offer to accept remote offer from ${senderId}`);
          try {
            await pc.setLocalDescription({ type: "rollback" } as any);
          } catch (e) {
            console.warn("[WebRTC] Rollback failed:", e);
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log(`[WebRTC] Remote offer set successfully for peer ${senderId}`);

        // Drain any pending ICE candidates queued before remoteDescription was set
        const pending = pendingCandidatesRef.current.get(senderId) || [];
        for (const candidate of pending) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn("[WebRTC] Error adding queued ICE candidate:", e);
          }
        }
        pendingCandidatesRef.current.delete(senderId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log(`[WebRTC] Sending answer to peer ${senderId}`);
        sendWebRtcAnswer(senderId, answer);
      } catch (err) {
        console.warn(`[WebRTC] Failed to handle WebRTC offer from ${senderId}:`, err);
      }
    },
    [getOrCreatePeerConnection, isPolite, sendWebRtcAnswer]
  );

  // Handle incoming answer from a peer
  const handleAnswer = useCallback(
    async (senderId: number, answer: RTCSessionDescriptionInit) => {
      try {
        console.log(`[WebRTC] Handling answer from peer ${senderId}`);
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log(`[WebRTC] Remote answer set successfully for peer ${senderId}`);

          // Drain queued candidates
          const pending = pendingCandidatesRef.current.get(senderId) || [];
          for (const candidate of pending) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn("[WebRTC] Error adding queued ICE candidate:", e);
            }
          }
          pendingCandidatesRef.current.delete(senderId);
        } else {
          console.warn(`[WebRTC] Received answer from ${senderId} in unexpected signalingState: ${pc?.signalingState}`);
        }
      } catch (err) {
        console.warn(`[WebRTC] Failed to set WebRTC answer from ${senderId}:`, err);
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
        console.warn(`[WebRTC] Failed to add ICE candidate from ${senderId}:`, err);
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
