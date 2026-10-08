/**
 * WebRTC mesh peer connection helpers.
 */

import { ICE_SERVERS } from "./constants";

export function createPeerConnection(
  onTrack: (remoteStream: MediaStream) => void,
  onIceCandidate: (candidate: RTCIceCandidate) => void
): RTCPeerConnection {
  const pc = new RTCPeerConnection({
    iceServers: ICE_SERVERS,
  });

  const remoteStream = new MediaStream();

  pc.ontrack = (event) => {
    event.streams[0]?.getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
    onTrack(remoteStream);
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate(event.candidate);
    }
  };

  return pc;
}
