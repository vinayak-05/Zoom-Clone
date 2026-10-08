"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Copy,
  Trash2,
  Edit,
  Video,
  Clock,
  Check,
  Shield,
  Users,
} from "lucide-react";
import type { Meeting } from "../../lib/types";
import {
  formatMeetingCode,
  formatTime,
  formatDate,
  formatDuration,
} from "../../lib/utils";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";

interface MeetingListItemProps {
  meeting: Meeting;
  onStart: (meeting: Meeting) => void;
  onDelete?: (id: number) => void;
}

export function MeetingListItem({
  meeting,
  onStart,
  onDelete,
}: MeetingListItemProps) {
  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedCode = formatMeetingCode(meeting.meeting_code);
  const isLive = meeting.status === "live";
  const isEnded = meeting.status === "ended";

  const handleCopyInvitation = async () => {
    const text = `Join Zoom Meeting\n${meeting.invite_link}\n\nMeeting ID: ${formattedCode}${
      meeting.passcode ? `\nPasscode: ${meeting.passcode}` : ""
    }`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast("Invitation copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Failed to copy to clipboard", "error");
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(meeting.meeting_code);
      showToast(`Meeting ID ${formattedCode} copied!`, "success");
    } catch {
      showToast("Failed to copy ID", "error");
    }
  };

  return (
    <div className="bg-white rounded-zoom border border-zoom-border p-4 hover:border-gray-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Time & Information */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          {meeting.scheduled_start ? (
            <span className="text-xs font-bold text-zoom-text flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zoom-muted" />
              {formatDate(meeting.scheduled_start)} • {formatTime(meeting.scheduled_start)}
              {meeting.duration_minutes && (
                <span className="text-zoom-muted font-normal">
                  ({formatDuration(meeting.duration_minutes)})
                </span>
              )}
            </span>
          ) : (
            <span className="text-xs font-semibold text-zoom-muted">
              Personal Meeting Room / Recurring
            </span>
          )}

          {isLive && (
            <span className="bg-green-100 text-green-700 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
              In Progress
            </span>
          )}

          {isEnded && (
            <span className="bg-gray-100 text-gray-600 font-semibold text-[10px] uppercase px-2 py-0.5 rounded-full">
              Ended
            </span>
          )}

          {meeting.passcode && (
            <span className="bg-gray-100 text-zoom-muted text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Passcode
            </span>
          )}
        </div>

        <Link
          href={`/meetings/${meeting.id}`}
          className="text-base font-bold text-zoom-text hover:text-zoom-blue transition-colors line-clamp-1 block"
        >
          {meeting.title}
        </Link>

        {meeting.description && (
          <p className="text-xs text-zoom-muted line-clamp-1 mt-0.5">
            {meeting.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-zoom-muted">
          <button
            onClick={handleCopyId}
            className="font-mono hover:text-zoom-text flex items-center gap-1 transition-colors"
            title="Click to copy Meeting ID"
          >
            <span>Meeting ID: {formattedCode}</span>
            <Copy className="w-3 h-3 text-zoom-muted" />
          </button>

          {meeting.participant_count > 0 && (
            <span className="flex items-center gap-1 text-zoom-muted">
              <Users className="w-3 h-3" />
              {meeting.participant_count} active
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
        {!isEnded && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onStart(meeting)}
            className="font-semibold shadow-none"
          >
            <Video className="w-4 h-4 mr-1.5" />
            <span>{isLive ? "Join" : "Start"}</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyInvitation}
          className="font-medium text-xs"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-600 mr-1" />
          ) : (
            <Copy className="w-3.5 h-3.5 mr-1" />
          )}
          <span>{copied ? "Copied" : "Copy Invitation"}</span>
        </Button>

        {/* Dropdown Options */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 rounded text-zoom-muted hover:text-zoom-text hover:bg-gray-100 transition-colors"
            aria-label="Meeting options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 mt-1 w-44 bg-white rounded-zoom shadow-zoom-card border border-zoom-border py-1 z-30 animate-in fade-in zoom-in-95 duration-150"
              onClick={() => setIsMenuOpen(false)}
            >
              <Link
                href={`/meetings/${meeting.id}`}
                className="w-full text-left px-3 py-1.5 text-xs text-zoom-text hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="w-3.5 h-3.5 text-zoom-muted" />
                View Details
              </Link>
              <button
                onClick={handleCopyInvitation}
                className="w-full text-left px-3 py-1.5 text-xs text-zoom-text hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-zoom-muted" />
                Copy Invitation Link
              </button>
              {onDelete && !isEnded && (
                <button
                  onClick={() => onDelete(meeting.id)}
                  className="w-full text-left px-3 py-1.5 text-xs text-zoom-red hover:bg-red-50 flex items-center gap-2 border-t border-zoom-border mt-1 pt-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-zoom-red" />
                  Cancel Meeting
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
