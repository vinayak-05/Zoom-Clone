"use client";

import React, { useEffect, useRef, useState } from "react";
import { MicOff, Hand, Pin, Volume2 } from "lucide-react";
import { cn, getAvatarHexColor } from "../../lib/utils";

export interface VideoTileProps {
  id: string | number;
  displayName: string;
  stream?: MediaStream | null;
  isVideoOff: boolean;
  isMuted: boolean;
  isHandRaised?: boolean;
  isHost?: boolean;
  isLocal?: boolean;
  isSpeaking?: boolean;
  isIncomingVideoStopped?: boolean;
  reaction?: string | null;
  className?: string;
  onPin?: () => void;
  isPinned?: boolean;
}

export function VideoTile({
  id,
  displayName,
  stream,
  isVideoOff,
  isMuted,
  isHandRaised = false,
  isHost = false,
  isLocal = false,
  isSpeaking = false,
  isIncomingVideoStopped = false,
  reaction = null,
  className,
  onPin,
  isPinned = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasLiveVideoTrack, setHasLiveVideoTrack] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);

  // If incoming video stopped by user preference, treat remote videos as video-off
  const isVideoSuppressed = !isLocal && isIncomingVideoStopped;

  // Reactively track whether the media stream has an active, enabled video track
  useEffect(() => {
    if (!stream) {
      setHasLiveVideoTrack(false);
      return;
    }

    const evaluateVideoTracks = () => {
      const vTracks = stream.getVideoTracks();
      const live =
        vTracks.length > 0 &&
        vTracks.some((t) => t.readyState === "live" && t.enabled && !t.muted);
      setHasLiveVideoTrack(live);
    };

    evaluateVideoTracks();

    // Periodic check ensures state stays synchronized even if browser events miss a transition
    const interval = setInterval(evaluateVideoTracks, 800);

    stream.addEventListener("addtrack", evaluateVideoTracks);
    stream.addEventListener("removetrack", evaluateVideoTracks);

    const tracks = stream.getTracks();
    tracks.forEach((t) => {
      t.addEventListener("mute", evaluateVideoTracks);
      t.addEventListener("unmute", evaluateVideoTracks);
      t.addEventListener("ended", evaluateVideoTracks);
    });

    return () => {
      clearInterval(interval);
      stream.removeEventListener("addtrack", evaluateVideoTracks);
      stream.removeEventListener("removetrack", evaluateVideoTracks);
      tracks.forEach((t) => {
        t.removeEventListener("mute", evaluateVideoTracks);
        t.removeEventListener("unmute", evaluateVideoTracks);
        t.removeEventListener("ended", evaluateVideoTracks);
      });
    };
  }, [stream]);

  const hasLiveVideo = Boolean(!isVideoSuppressed && !isVideoOff && hasLiveVideoTrack);

  // Bind and play video and audio streams
  useEffect(() => {
    const videoEl = videoRef.current;
    const audioEl = audioRef.current;

    if (stream) {
      // 1. Video playback (always muted to guarantee 100% autoplay across all mobile/desktop devices)
      if (videoEl) {
        if (videoEl.srcObject !== stream) {
          videoEl.srcObject = stream;
        }
        videoEl.play().catch((err) => {
          console.warn(`[VideoTile] Video play error for ${displayName}:`, err);
        });
      }

      // 2. Dedicated remote audio playback
      if (!isLocal && audioEl) {
        if (audioEl.srcObject !== stream) {
          audioEl.srcObject = stream;
        }
        audioEl
          .play()
          .then(() => {
            setAutoplayBlocked(false);
          })
          .catch((err) => {
            console.warn(`[VideoTile] Audio autoplay blocked for ${displayName}:`, err);
            setAutoplayBlocked(true);
          });
      }
    } else {
      if (videoEl) videoEl.srcObject = null;
      if (audioEl) audioEl.srcObject = null;
      setAutoplayBlocked(false);
    }
  }, [stream, displayName, isLocal]);

  const handleTileClick = () => {
    if (!isLocal) {
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current
          .play()
          .then(() => setAutoplayBlocked(false))
          .catch(() => {});
      }
    }
  };

  const initialLetter = (displayName || "V").trim().charAt(0).toUpperCase();
  const avatarHexColor = getAvatarHexColor(displayName || "Vinayak");

  return (
    <div
      onClick={handleTileClick}
      className={cn(
        "relative rounded-xl overflow-hidden bg-[#18181D] flex items-center justify-center select-none group transition-all duration-150 w-full h-full cursor-pointer",
        isSpeaking && "ring-2 ring-green-500",
        className
      )}
    >
      {/* Video Element: ALWAYS muted={true} so browsers NEVER block autoplay on mobile/desktop */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={true}
        className={cn(
          "w-full h-full object-cover",
          isLocal && "transform -scale-x-100"
        )}
      />

      {/* Dedicated Remote Audio Element: Plays audio smoothly with zero interference to video */}
      {!isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
        />
      )}

      {/* Video Off Exact Zoom Avatar State (Rendered as overlay so audio continues playing) */}
      {!hasLiveVideo && (
        <div className="absolute inset-0 bg-[#18181D] flex flex-col items-center justify-center p-4 z-10 pointer-events-none">
          <div
            style={{ backgroundColor: avatarHexColor }}
            className="w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center text-5xl sm:text-6xl font-bold text-white shadow-xl select-none transition-transform hover:scale-102"
          >
            {initialLetter}
          </div>
        </div>
      )}

      {/* Mobile Audio Autoplay Tap-to-Unmute Prompt */}
      {autoplayBlocked && !isLocal && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (audioRef.current) {
              audioRef.current
                .play()
                .then(() => setAutoplayBlocked(false))
                .catch(() => {});
            }
          }}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Tap to unmute {displayName}</span>
        </button>
      )}

      {/* Floating Reaction Animation */}
      {reaction && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <span className="text-6xl animate-bounce drop-shadow-lg">
            {reaction}
          </span>
        </div>
      )}

      {/* Hand Raised Badge (Top Left) */}
      {isHandRaised && (
        <div className="absolute top-3 left-3 bg-yellow-500 text-black px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md z-10 animate-pulse">
          <Hand className="w-3.5 h-3.5 fill-current" />
          <span>Hand Raised</span>
        </div>
      )}

      {/* Pin Tile Action (Top Right Hover) */}
      {onPin && (
        <button
          onClick={onPin}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          title={isPinned ? "Unpin video" : "Pin video"}
        >
          <Pin className={cn("w-4 h-4", isPinned && "fill-current text-white")} />
        </button>
      )}

      {/* Bottom Name Label + Status Indicators */}
      <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-white text-xs max-w-[85%] truncate">
        {isMuted && (
          <MicOff className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
        )}
        <span className="truncate font-medium">
          {displayName}
          {isLocal && " (Me)"}
          {isHost && " (Host)"}
        </span>
      </div>
    </div>
  );
}
