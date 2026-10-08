"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Shield,
  Video,
  Copy,
  Check,
  Trash2,
  Share2,
} from "lucide-react";
import { Navbar } from "../../../components/layout/Navbar";
import { Sidebar } from "../../../components/layout/Sidebar";
import { Button } from "../../../components/ui/Button";
import { InviteModal } from "../../../components/modals/InviteModal";
import { JoinMeetingModal } from "../../../components/modals/JoinMeetingModal";
import { api } from "../../../lib/api";
import { formatMeetingCode, formatDate, formatTime, formatDuration } from "../../../lib/utils";
import { useToast } from "../../../components/ui/Toast";
import type { Meeting } from "../../../lib/types";

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const meetingId = Number(params.id);

  useEffect(() => {
    async function loadMeeting() {
      if (!meetingId) return;
      try {
        setLoading(true);
        const data = await api.getMeetingById(meetingId);
        setMeeting(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load meeting.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadMeeting();
  }, [meetingId]);

  const handleCopyLink = async () => {
    if (!meeting) return;
    try {
      await navigator.clipboard.writeText(meeting.invite_link);
      setCopiedLink(true);
      showToast("Invite link copied to clipboard!", "success");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      showToast("Failed to copy link", "error");
    }
  };

  const handleDelete = async () => {
    if (!meeting) return;
    if (confirm("Are you sure you want to cancel this meeting?")) {
      try {
        await api.cancelMeeting(meeting.id);
        showToast("Meeting cancelled.", "info");
        router.push("/meetings");
      } catch (err) {
        showToast("Failed to cancel meeting.", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-zoom-bg flex flex-col">
      <Navbar onOpenJoinModal={() => setIsJoinModalOpen(true)} />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full pb-20 md:pb-8">
          <Link
            href="/meetings"
            className="text-xs text-zoom-muted hover:text-zoom-blue flex items-center gap-1.5 mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Meetings</span>
          </Link>

          {loading ? (
            <div className="bg-white rounded-zoom border border-zoom-border p-8 animate-pulse space-y-4">
              <div className="h-6 w-60 bg-gray-200 rounded" />
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-20 bg-gray-100 rounded" />
            </div>
          ) : error || !meeting ? (
            <div className="bg-white rounded-zoom border border-red-200 p-8 text-center">
              <p className="text-zoom-red font-medium mb-3">{error || "Meeting not found."}</p>
              <Link href="/meetings">
                <Button variant="outline" size="sm">
                  Return to Meetings
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-zoom border border-zoom-border shadow-zoom p-6 sm:p-8 space-y-6">
              {/* Header Title */}
              <div className="border-b border-zoom-border pb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zoom-blue bg-blue-50 px-2 py-0.5 rounded">
                  {meeting.type} Meeting
                </span>
                <h1 className="text-2xl font-black text-zoom-text mt-2">
                  {meeting.title}
                </h1>
                {meeting.description && (
                  <p className="text-sm text-zoom-muted mt-1">{meeting.description}</p>
                )}
              </div>

              {/* Information Grid */}
              <div className="space-y-4 text-sm divide-y divide-gray-100">
                {meeting.scheduled_start && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2">
                    <span className="text-zoom-muted font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-zoom-muted" />
                      When
                    </span>
                    <span className="font-semibold text-zoom-text">
                      {formatDate(meeting.scheduled_start)} • {formatTime(meeting.scheduled_start)}{" "}
                      {meeting.duration_minutes && (
                        <span className="text-zoom-muted font-normal">
                          ({formatDuration(meeting.duration_minutes)})
                        </span>
                      )}
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2">
                  <span className="text-zoom-muted font-medium">Meeting ID</span>
                  <span className="font-mono font-bold text-base text-zoom-text">
                    {formatMeetingCode(meeting.meeting_code)}
                  </span>
                </div>

                {meeting.passcode && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2">
                    <span className="text-zoom-muted font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4 text-zoom-muted" />
                      Passcode
                    </span>
                    <span className="font-mono font-semibold text-zoom-text">
                      {meeting.passcode}
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-2">
                  <span className="text-zoom-muted font-medium">Invite Link</span>
                  <div className="flex items-center gap-2 max-w-md">
                    <span className="text-zoom-blue truncate font-medium text-xs sm:text-sm">
                      {meeting.invite_link}
                    </span>
                    <button
                      onClick={handleCopyLink}
                      className="p-1.5 hover:bg-gray-100 rounded text-zoom-muted hover:text-zoom-text flex-shrink-0"
                      title="Copy link"
                    >
                      {copiedLink ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2">
                  <span className="text-zoom-muted font-medium">Security Options</span>
                  <span className="font-medium text-zoom-text text-xs sm:text-sm">
                    {meeting.waiting_room ? "Waiting Room Enabled" : "Waiting Room Disabled"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-zoom-border flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => router.push(`/meeting/${meeting.meeting_code}`)}
                    className="font-bold shadow"
                  >
                    <Video className="w-4 h-4 mr-1.5" />
                    <span>Start this Meeting</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setIsInviteModalOpen(true)}
                  >
                    <Share2 className="w-4 h-4 mr-1.5" />
                    <span>Copy Invitation</span>
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-zoom-red hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  <span>Delete</span>
                </Button>
              </div>

              {/* Invitation Modal */}
              <InviteModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                title={meeting.title}
                meetingCode={meeting.meeting_code}
                passcode={meeting.passcode}
                inviteLink={meeting.invite_link}
              />
            </div>
          )}
        </main>
      </div>

      <JoinMeetingModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  );
}
