"use client";

import React, { useState } from "react";
import {
  X,
  Search,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MoreVertical,
  UserX,
  VolumeX,
  Hand,
} from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import type { ParticipantTileData } from "./SpeakerView";

interface ParticipantsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  participants: ParticipantTileData[];
  isHost: boolean;
  onMuteAll?: () => void;
  onMuteParticipant?: (participantId: number | string, isMuted: boolean) => void;
  onRemoveParticipant?: (participantId: number | string) => void;
}

export function ParticipantsPanel({
  isOpen,
  onClose,
  participants,
  isHost,
  onMuteAll,
  onMuteParticipant,
  onRemoveParticipant,
}: ParticipantsPanelProps) {
  const [search, setSearch] = useState("");
  const [selectedPid, setSelectedPid] = useState<string | number | null>(null);

  if (!isOpen) return null;

  const filtered = participants.filter((p) =>
    p.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-80 sm:w-88 bg-white border-l border-zoom-border flex flex-col h-full z-40 select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-zoom-border flex items-center justify-between">
        <h3 className="font-bold text-sm text-zoom-text">
          Participants ({participants.length})
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-zoom-muted hover:text-zoom-text rounded hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-zoom-border">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zoom-muted" />
          <input
            type="text"
            placeholder="Search participants"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded border border-zoom-border text-xs focus:outline-none focus:border-zoom-blue"
          />
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-2.5 rounded hover:bg-gray-50 transition-colors group relative"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={p.displayName} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zoom-text truncate">
                  {p.displayName}
                  {p.isLocal && " (Me)"}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {p.isHost && (
                    <span className="text-[10px] text-zoom-blue font-bold">
                      Host
                    </span>
                  )}
                  {p.isHandRaised && (
                    <span className="text-[10px] text-yellow-600 font-bold flex items-center gap-0.5">
                      <Hand className="w-3 h-3 fill-current" />
                      Raised Hand
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Media States & Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {p.isMuted ? (
                <MicOff className="w-4 h-4 text-zoom-red" />
              ) : (
                <Mic className="w-4 h-4 text-zoom-muted" />
              )}
              {p.isVideoOff ? (
                <VideoOff className="w-4 h-4 text-zoom-red" />
              ) : (
                <Video className="w-4 h-4 text-zoom-muted" />
              )}

              {/* Host Control Actions */}
              {isHost && !p.isLocal && (
                <div className="relative ml-1">
                  <button
                    onClick={() =>
                      setSelectedPid(selectedPid === p.id ? null : p.id)
                    }
                    className="p-1 hover:bg-gray-200 rounded text-zoom-muted hover:text-zoom-text"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {selectedPid === p.id && (
                    <div
                      className="absolute right-0 top-full mt-1 w-36 bg-white border border-zoom-border rounded-zoom shadow-zoom-card py-1 z-50 text-xs animate-in fade-in"
                      onClick={() => setSelectedPid(null)}
                    >
                      <button
                        onClick={() => onMuteParticipant?.(p.id, !p.isMuted)}
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>{p.isMuted ? "Unmute" : "Mute"}</span>
                      </button>
                      <button
                        onClick={() => onRemoveParticipant?.(p.id)}
                        className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-zoom-red flex items-center gap-2 border-t border-gray-100"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Host Footer: Mute All */}
      {isHost && (
        <div className="p-3 border-t border-zoom-border bg-gray-50 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onMuteAll}
            className="w-full text-xs font-semibold"
          >
            <VolumeX className="w-3.5 h-3.5 mr-1.5" />
            Mute All Participants
          </Button>
        </div>
      )}
    </div>
  );
}
