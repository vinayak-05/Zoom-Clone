"use client";

import React, { useState } from "react";
import { ChevronDown, Video, Plus, Calendar, ArrowUpSquare } from "lucide-react";
import { cn } from "../../lib/utils";

interface ActionTileProps {
  type: "new-meeting" | "join" | "schedule" | "share-screen";
  onClick: () => void;
  onOptionSelect?: (option: string) => void;
}

export function ActionTile({ type, onClick, onOptionSelect }: ActionTileProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const config = {
    "new-meeting": {
      label: "New Meeting",
      icon: Video,
      bgColor: "bg-zoom-orange hover:bg-zoom-orange-hover",
      hasDropdown: true,
    },
    join: {
      label: "Join",
      icon: Plus,
      bgColor: "bg-zoom-blue hover:bg-zoom-blue-hover",
      hasDropdown: false,
    },
    schedule: {
      label: "Schedule",
      icon: Calendar,
      bgColor: "bg-zoom-blue hover:bg-zoom-blue-hover",
      hasDropdown: false,
    },
    "share-screen": {
      label: "Share screen",
      icon: ArrowUpSquare,
      bgColor: "bg-zoom-blue hover:bg-zoom-blue-hover",
      hasDropdown: false,
    },
  }[type];

  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className="relative group">
        <button
          onClick={onClick}
          className={cn(
            "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white shadow-zoom-card transition-all duration-200 transform group-hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-200",
            config.bgColor
          )}
          aria-label={config.label}
        >
          <Icon className="w-8 h-8 sm:w-9 sm:h-9" />
        </button>

        {config.hasDropdown && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white text-zoom-text border border-zoom-border shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label="New meeting options"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isDropdownOpen && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 bg-white rounded-zoom shadow-zoom-card border border-zoom-border py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setIsDropdownOpen(false)}
              >
                <button
                  onClick={() => onOptionSelect?.("video-on")}
                  className="w-full text-left px-4 py-2 text-xs text-zoom-text hover:bg-gray-50 flex items-center gap-2"
                >
                  <Video className="w-4 h-4 text-zoom-orange" />
                  Start with video on
                </button>
                <button
                  onClick={() => onOptionSelect?.("video-off")}
                  className="w-full text-left px-4 py-2 text-xs text-zoom-text hover:bg-gray-50 flex items-center gap-2"
                >
                  <Video className="w-4 h-4 text-zoom-muted" />
                  Start with video off
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <span className="text-xs sm:text-sm font-semibold text-zoom-text group-hover:text-zoom-blue transition-colors text-center">
        {config.label}
      </span>
    </div>
  );
}
