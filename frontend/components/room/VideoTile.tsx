"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { MicOff, Hand, Pin } from "lucide-react";
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

  // If incoming video stopped by user preference, treat remote videos as video-off
  const isVideoSuppressed = !isLocal && isIncomingVideoStopped;

  // Determine if video track is live and enabled
  const hasLiveVideoTrack = Boolean(
    stream &&
      stream.getVideoTracks().length > 0 &&
      stream.getVideoTracks().some((t) => t.readyState === "live" && t.enabled)
  );

  const hasLiveVideo = Boolean(!isVideoSuppressed && !isVideoOff && hasLiveVideoTrack);

  // Bind and play video stream
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (stream) {
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
      videoEl.play().catch((err) => {
        // Autoplay may require user gesture on mobile
        const unlock = () => {
          videoEl.play().catch(() => {});
          window.removeEventListener("touchstart", unlock);
          window.removeEventListener("click", unlock);
        };
        window.addEventListener("touchstart", unlock, { once: true });
        window.addEventListener("click", unlock, { once: true });
      });
    } else {
      videoEl.srcObject = null;
    }
  }, [stream]);

  // Dedicated audio playback for remote participants to guarantee audio is heard even if video is off
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || isLocal) return;

    if (stream && stream.getAudioTracks().length > 0) {
      if (audioEl.srcObject !== stream) {
        audioEl.srcObject = stream;
      }
      audioEl.play().catch((err) => {
        const unlock = () => {
          audioEl.play().catch(() => {});
          window.removeEventListener("touchstart", unlock);
          window.removeEventListener("click", unlock);
        };
        window.addEventListener("touchstart", unlock, { once: true });
        window.addEventListener("click", unlock, { once: true });
      });
    } else {
      audioEl.srcObject = null;
    }
  }, [stream, isLocal]);

  const initialLetter = (displayName || "V").trim().charAt(0).toUpperCase();
  const avatarHexColor = getAvatarHexColor(displayName || "Vinayak");

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-[#18181D] flex items-center justify-center select-none group transition-all duration-150 w-full h-full",
        isSpeaking && "ring-2 ring-green-500",
        className
      )}
    >
      {/* Video Stream Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Always mute local element to avoid acoustic feedback
        className={cn(
          "w-full h-full object-cover",
          isLocal && "transform -scale-x-100",
          !hasLiveVideo ? "hidden" : "block"
        )}
      />

      {/* Dedicated Remote Audio Element (Never hidden to ensure continuous audio playback) */}
      {!isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
        />
      )}

      {/* Video Off Exact Zoom Avatar State (Burnt Orange / Distinct Square with Bold Letter) */}
      {!hasLiveVideo && (
        <div className="flex flex-col items-center justify-center p-4">
          <div
            style={{ backgroundColor: avatarHexColor }}
            className="w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center text-5xl sm:text-6xl font-bold text-white shadow-xl select-none transition-transform hover:scale-102"
          >
            {initialLetter}
          </div>
        </div>
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
