"use client";

import React, { useState } from "react";
import { VideoTile } from "./VideoTile";
import { SpeakerView, type ParticipantTileData } from "./SpeakerView";

interface VideoGridProps {
  participants: ParticipantTileData[];
  viewMode: "gallery" | "speaker";
  onSelectSpeaker?: (id: string | number) => void;
}

export function VideoGrid({
  participants,
  viewMode,
  onSelectSpeaker,
}: VideoGridProps) {
  const [pinnedId, setPinnedId] = useState<string | number | null>(null);

  if (viewMode === "speaker") {
    const speakerId = pinnedId || participants[0]?.id || 0;
    return (
      <SpeakerView
        participants={participants}
        activeSpeakerId={speakerId}
        onSelectSpeaker={(id) => {
          setPinnedId(id);
          onSelectSpeaker?.(id);
        }}
      />
    );
  }

  // Gallery View Dynamic Grid Configuration
  const count = participants.length;
  let gridColsClass = "grid-cols-1";

  if (count === 2) {
    gridColsClass = "grid-cols-1 sm:grid-cols-2";
  } else if (count >= 3 && count <= 4) {
    gridColsClass = "grid-cols-2";
  } else if (count >= 5 && count <= 6) {
    gridColsClass = "grid-cols-2 sm:grid-cols-3";
  } else if (count >= 7) {
    gridColsClass = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
  }

  return (
    <div className="flex-1 w-full h-full p-2 sm:p-4 overflow-y-auto flex items-center justify-center">
      <div
        className={`grid ${gridColsClass} gap-2.5 sm:gap-4 w-full h-full max-h-[calc(100vh-8.5rem)] auto-rows-fr`}
      >
        {participants.map((p) => (
          <VideoTile
            key={p.id}
            {...p}
            className="w-full h-full min-h-[160px] sm:min-h-[220px]"
            onPin={() => setPinnedId(pinnedId === p.id ? null : p.id)}
            isPinned={pinnedId === p.id}
          />
        ))}
      </div>
    </div>
  );
}
