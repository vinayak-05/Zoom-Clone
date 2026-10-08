"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, Video, Plus, ExternalLink } from "lucide-react";
import { api } from "../../lib/api";
import { formatMeetingCode, formatTime, formatDate } from "../../lib/utils";
import type { Meeting } from "../../lib/types";

interface UpcomingMeetingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMeeting?: (code: string) => void;
}

export function UpcomingMeetingsModal({
  isOpen,
  onClose,
  onSelectMeeting,
}: UpcomingMeetingsModalProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.getMeetings("upcoming")
      .then((data: Meeting[]) => setMeetings(data))
      .catch((err: unknown) => console.warn("Failed to load meetings:", err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col text-gray-800">
        <div className="bg-[#1C1C28] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm">Upcoming Meetings</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3 text-xs">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading meetings...</div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No upcoming scheduled meetings.
            </div>
          ) : (
            meetings.map((m) => (
              <div
                key={m.id}
                className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-400 transition-colors flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{m.title}</h4>
                  <p className="text-gray-500 mt-0.5">
                    ID: {formatMeetingCode(m.meeting_code)} • {m.scheduled_start ? formatDate(m.scheduled_start) : "Instant Meeting"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onSelectMeeting?.(m.meeting_code);
                  }}
                  className="px-3 py-1.5 bg-[#0B5CFF] hover:bg-[#0845BF] text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
