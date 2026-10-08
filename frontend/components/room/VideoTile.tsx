"use client";

import React, { useEffect, useRef } from "react";
import { MicOff, Hand, Pin } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { cn } from "../../lib/utils";

interface VideoTileProps {
  id: string | number;
  displayName: string;
  stream?: MediaStream | null;
  isVideoOff: boolean;
  isMuted: boolean;
  isHandRaised?: boolean;
  isHost?: boolean;
  isLocal?: boolean;
  isSpeaking?: boolean;
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
  reaction = null,
  className,
  onPin,
  isPinned = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  return (
    <div
      className={cn(
        "relative rounded-zoom overflow-hidden bg-[#2E2E38] flex items-center justify-center select-none group transition-all duration-150",
        isSpeaking && "ring-2 ring-green-500",
        className
      )}
    >
      {/* Video Stream Element */}
      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Always mute local element to avoid acoustic feedback
          className={cn(
            "w-full h-full object-cover",
            isLocal && "transform -scale-x-100"
          )}
        />
      ) : (
        /* Video Off Avatar State */
        <div className="flex flex-col items-center justify-center p-4">
          <Avatar name={displayName} size="xl" />
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
          <Hand className="w-3.5 h-3.5" />
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
          <Pin className={cn("w-3.5 h-3.5", isPinned && "fill-current text-white")} />
        </button>
      )}

      {/* Bottom Information Overlay */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-xs text-white font-medium flex items-center gap-1.5 max-w-[85%] truncate">
          {isMuted && (
            <MicOff className="w-3 h-3 text-zoom-red flex-shrink-0" />
          )}
          <span className="truncate">
            {displayName}
            {isLocal && " (Me)"}
            {isHost && " (Host)"}
          </span>
        </div>
      </div>
    </div>
  );
}
