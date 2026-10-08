"use client";

import React from "react";
import Link from "next/link";
import { Calendar, History, Plus } from "lucide-react";
import type { Meeting } from "../../lib/types";
import { MeetingListItem } from "./MeetingListItem";
import { Button } from "../ui/Button";

interface MeetingListProps {
  meetings: Meeting[];
  filter: "upcoming" | "recent" | "all";
  onFilterChange: (filter: "upcoming" | "recent") => void;
  loading: boolean;
  onStartMeeting: (meeting: Meeting) => void;
  onDeleteMeeting?: (id: number) => void;
}

export function MeetingList({
  meetings,
  filter,
  onFilterChange,
  loading,
  onStartMeeting,
  onDeleteMeeting,
}: MeetingListProps) {
  return (
    <div className="bg-white rounded-zoom border border-zoom-border shadow-zoom overflow-hidden">
      {/* Tabs Header */}
      <div className="px-6 pt-4 border-b border-zoom-border flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => onFilterChange("upcoming")}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              filter === "upcoming"
                ? "border-zoom-blue text-zoom-blue"
                : "border-transparent text-zoom-muted hover:text-zoom-text"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Upcoming</span>
          </button>
          <button
            onClick={() => onFilterChange("recent")}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              filter === "recent"
                ? "border-zoom-blue text-zoom-blue"
                : "border-transparent text-zoom-muted hover:text-zoom-text"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Previous</span>
          </button>
        </div>

        <Link href="/meetings/schedule">
          <Button variant="outline" size="sm" className="hidden sm:flex mb-2 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Schedule a Meeting
          </Button>
        </Link>
      </div>

      {/* List / Content Area */}
      <div className="p-4 sm:p-6 space-y-3">
        {loading ? (
          // Skeleton loading
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="border border-zoom-border rounded-zoom p-4 animate-pulse space-y-3"
            >
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-5 w-72 bg-gray-200 rounded" />
              <div className="h-3 w-36 bg-gray-200 rounded" />
            </div>
          ))
        ) : meetings.length === 0 ? (
          // Empty State
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-zoom-blue mx-auto flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-zoom-text">
              {filter === "upcoming"
                ? "No upcoming meetings scheduled"
                : "No previous meetings found"}
            </h3>
            <p className="text-xs text-zoom-muted mt-1 max-w-sm mx-auto">
              {filter === "upcoming"
                ? "Schedule new meetings or start an instant meeting to collaborate with your team."
                : "Meetings you host or participate in will appear here once ended."}
            </p>
            {filter === "upcoming" && (
              <div className="mt-5">
                <Link href="/meetings/schedule">
                  <Button variant="primary" size="sm">
                    Schedule a Meeting
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          meetings.map((meeting) => (
            <MeetingListItem
              key={meeting.id}
              meeting={meeting}
              onStart={onStartMeeting}
              onDelete={onDeleteMeeting}
            />
          ))
        )}
      </div>
    </div>
  );
}
