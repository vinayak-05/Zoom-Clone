"use client";

import React from "react";
import { VideoTile } from "./VideoTile";

export interface ParticipantTileData {
  id: number | string;
  displayName: string;
  stream?: MediaStream | null;
  isVideoOff: boolean;
  isMuted: boolean;
  isHandRaised?: boolean;
  isHost?: boolean;
  isLocal?: boolean;
  isSpeaking?: boolean;
  reaction?: string | null;
}

interface SpeakerViewProps {
  participants: ParticipantTileData[];
  activeSpeakerId: string | number;
  onSelectSpeaker: (id: string | number) => void;
}

export function SpeakerView({
  participants,
  activeSpeakerId,
  onSelectSpeaker,
}: SpeakerViewProps) {
  const activeParticipant =
    participants.find((p) => p.id === activeSpeakerId) || participants[0];

  const otherParticipants = participants.filter(
    (p) => p.id !== activeParticipant?.id
  );

  if (!activeParticipant) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col h-full w-full p-2 sm:p-4 gap-3 overflow-hidden">
      {/* Top Strip of Thumbnail Tiles */}
      {otherParticipants.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-h-36 flex-shrink-0">
          {otherParticipants.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelectSpeaker(p.id)}
              className="w-40 h-24 sm:w-48 sm:h-28 flex-shrink-0 cursor-pointer"
            >
              <VideoTile
                {...p}
                className="w-full h-full hover:ring-2 hover:ring-zoom-blue"
              />
            </div>
          ))}
        </div>
      )}

      {/* Main Large Speaker Stage */}
      <div className="flex-1 w-full h-full min-h-0">
        <VideoTile
          {...activeParticipant}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
