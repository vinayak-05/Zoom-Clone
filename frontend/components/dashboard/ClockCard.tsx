"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Play, Calendar } from "lucide-react";
import type { Meeting } from "../../lib/types";
import { formatTime, formatMeetingCode } from "../../lib/utils";

interface ClockCardProps {
  upcomingMeeting?: Meeting | null;
  onStartMeeting?: (code: string) => void;
}

export function ClockCard({ upcomingMeeting, onStartMeeting }: ClockCardProps) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return (
      <div className="h-44 sm:h-52 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-zoom-card flex flex-col justify-between animate-pulse">
        <div className="h-10 w-36 bg-white/20 rounded" />
        <div className="h-6 w-48 bg-white/20 rounded" />
      </div>
    );
  }

  const hours = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const dateString = time.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="h-auto min-h-[12rem] bg-gradient-to-br from-[#0B5CFF] via-[#0845BF] to-[#042B82] rounded-2xl p-6 text-white shadow-zoom-card flex flex-col justify-between relative overflow-hidden select-none">
      {/* Decorative background circle */}
      <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute right-14 -top-10 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

      {/* Clock & Date */}
      <div>
        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {hours}
        </div>
        <p className="text-xs sm:text-sm font-medium text-blue-100 mt-1">
          {dateString}
        </p>
      </div>

      {/* Next Upcoming Meeting Preview */}
      <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
        {upcomingMeeting ? (
          <div className="flex-1 min-w-0 mr-3">
            <div className="flex items-center gap-1.5 text-[11px] text-blue-200 uppercase font-bold tracking-wider">
              <Clock className="w-3 h-3" />
              <span>Next Meeting • {formatTime(upcomingMeeting.scheduled_start)}</span>
            </div>
            <p className="text-sm font-bold truncate text-white mt-0.5">
              {upcomingMeeting.title}
            </p>
            <p className="text-xs text-blue-200/80 font-mono">
              ID: {formatMeetingCode(upcomingMeeting.meeting_code)}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-blue-100">
            <Calendar className="w-4 h-4 text-blue-200" />
            <span>No upcoming meetings scheduled for today.</span>
          </div>
        )}

        {upcomingMeeting && (
          <button
            onClick={() => onStartMeeting?.(upcomingMeeting.meeting_code)}
            className="flex-shrink-0 bg-white text-zoom-blue hover:bg-blue-50 font-bold text-xs px-3.5 py-2 rounded-zoom shadow transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start</span>
          </button>
        )}
      </div>
    </div>
  );
}
