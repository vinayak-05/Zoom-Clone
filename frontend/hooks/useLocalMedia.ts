"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface LocalMediaOptions {
  initialAudio?: boolean;
  initialVideo?: boolean;
}

export function useLocalMedia(options: LocalMediaOptions = {}) {
  const { initialAudio = true, initialVideo = true } = options;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(!initialAudio);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(!initialVideo);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Initialize media devices
  const startMedia = useCallback(
    async (customOptions?: { audio?: boolean; video?: boolean }) => {
      try {
        setMediaError(null);
        setPermissionDenied(false);

        if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
          setMediaError("Media devices not supported in this browser.");
          return null;
        }

        const audioRequested =
          customOptions?.audio !== undefined ? customOptions.audio : !isAudioMuted;
        const videoRequested =
          customOptions?.video !== undefined ? customOptions.video : !isVideoOff;

        const constraints: MediaStreamConstraints = {
          audio: true,
          video: videoRequested
            ? {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user",
              }
            : false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Apply audio mute state
        stream.getAudioTracks().forEach((track) => {
          track.enabled = audioRequested;
        });

        setIsAudioMuted(!audioRequested);
        setIsVideoOff(!videoRequested);

        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
      } catch (err: unknown) {
        const error = err as Error;
        console.warn("getUserMedia error:", error.name, error.message);
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          setPermissionDenied(true);
          setMediaError("Camera and microphone permission denied. Please allow access in your browser settings.");
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          setMediaError("No camera or microphone found on this device.");
        } else {
          setMediaError(error.message || "Failed to access camera and microphone.");
        }
        return null;
      }
    },
    [isAudioMuted, isVideoOff]
  );

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !audioTracks[0].enabled;
        audioTracks.forEach((t) => (t.enabled = nextState));
        setIsAudioMuted(!nextState);
        return nextState;
      }
    }
    const nextState = isAudioMuted;
    setIsAudioMuted(!nextState);
    return !nextState;
  }, [isAudioMuted]);

  const toggleVideo = useCallback(async () => {
    if (!isVideoOff) {
      // 1. Turning video OFF: Stop all video tracks so browser completely releases webcam hardware and LED turns off!
      if (localStreamRef.current) {
        const videoTracks = localStreamRef.current.getVideoTracks();
        videoTracks.forEach((track) => {
          track.stop();
          localStreamRef.current?.removeTrack(track);
        });
        const currentAudioTracks = localStreamRef.current.getAudioTracks();
        const newStream = new MediaStream(currentAudioTracks);
        localStreamRef.current = newStream;
        setLocalStream(newStream);
      }
      setIsVideoOff(true);
      return false;
    } else {
      // 2. Turning video ON: Request camera device so webcam starts and LED turns on
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        });
        const newVideoTrack = cameraStream.getVideoTracks()[0];
        if (newVideoTrack) {
          const currentAudioTracks = localStreamRef.current
            ? localStreamRef.current.getAudioTracks()
            : [];
          const combinedStream = new MediaStream([...currentAudioTracks, newVideoTrack]);
          localStreamRef.current = combinedStream;
          setLocalStream(combinedStream);
          setIsVideoOff(false);
          return true;
        }
      } catch (err) {
        console.warn("Could not re-enable camera:", err);
      }
      return false;
    }
  }, [isVideoOff]);

  const startScreenShare = useCallback(async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
        alert("Screen sharing is not supported on this browser.");
        return null;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);

      // Handle user stopping share from browser floating toolbar
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      return stream;
    } catch (err) {
      console.warn("Screen share cancelled or failed:", err);
      setIsScreenSharing(false);
      return null;
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setIsScreenSharing(false);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return null;
    } else {
      return await startScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  const stopAllTracks = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    stopScreenShare();
  }, [stopScreenShare]);

  useEffect(() => {
    return () => {
      stopAllTracks();
    };
  }, [stopAllTracks]);

  return {
    localStream,
    screenStream,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    mediaError,
    permissionDenied,
    startMedia,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    stopScreenShare,
    stopAllTracks,
  };
}
