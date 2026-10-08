"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Video,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";
import { Navbar } from "../../components/layout/Navbar";
import { Sidebar } from "../../components/layout/Sidebar";
import { Button } from "../../components/ui/Button";
import { MeetingListItem } from "../../components/dashboard/MeetingListItem";
import { JoinMeetingModal } from "../../components/modals/JoinMeetingModal";
import { useMeetings } from "../../hooks/useMeetings";
import { useToast } from "../../components/ui/Toast";
import { DEFAULT_USER } from "../../lib/constants";
import { formatMeetingCode } from "../../lib/utils";
import { getStoredUser, AuthUser } from "../../lib/auth";
import type { Meeting } from "../../lib/types";

type MeetingsTab = "upcoming" | "previous" | "personal" | "templates";

export default function MeetingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<AuthUser>(DEFAULT_USER as AuthUser);
  const [activeTab, setActiveTab] = useState<MeetingsTab>("upcoming");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [copiedPmi, setCopiedPmi] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setCurrentUser(stored);
    }
  }, []);

  const {
    meetings,
    loading,
    setFilter,
    cancel,
  } = useMeetings("upcoming");

  const handleTabChange = (tab: MeetingsTab) => {
    setActiveTab(tab);
    if (tab === "upcoming") setFilter("upcoming");
    if (tab === "previous") setFilter("recent");
  };

  const handleStartMeeting = (meeting: Meeting) => {
    router.push(`/meeting/${meeting.meeting_code}`);
  };

  const handleStartPersonalRoom = () => {
    router.push(`/meeting/${currentUser.personal_meeting_id}`);
  };

  const handleCopyPersonalInvitation = async () => {
    const text = `Join ${currentUser.name}'s Personal Meeting Room\nhttp://localhost:3000/join/${currentUser.personal_meeting_id}\n\nMeeting ID: ${formatMeetingCode(
      currentUser.personal_meeting_id
    )}\nPasscode: 2026PMI`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPmi(true);
      showToast("Personal Room invitation copied!", "success");
      setTimeout(() => setCopiedPmi(false), 2000);
    } catch {
      showToast("Failed to copy invitation", "error");
    }
  };

  return (
    <div className="min-h-screen bg-zoom-bg flex flex-col">
      <Navbar onOpenJoinModal={() => setIsJoinModalOpen(true)} />

      {/* Zoomtopia Banner matching screenshot */}
      <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2 flex items-center justify-between text-xs text-emerald-900 select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold">Zoomtopia 2026: Big ideas for small teams</span>
          <span className="hidden sm:inline">
            Join sessions on how AI can simplify work and fuel growth.
          </span>
          <button
            onClick={() => showToast("Zoomtopia registration open", "info")}
            className="text-zoom-blue font-semibold hover:underline"
          >
            Register now
          </button>
        </div>
        <span className="text-emerald-700/60 font-semibold cursor-pointer">✕</span>
      </div>

      <div className="flex-1 flex">
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full pb-20 md:pb-8">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-zoom-text tracking-tight">
              Meetings
            </h1>

            <div className="flex items-center gap-2">
              <Link href="/meetings/schedule">
                <Button variant="primary" size="md" className="font-bold text-xs sm:text-sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>Schedule a Meeting</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Sub Navigation Tabs matching screenshot */}
          <div className="border-b border-zoom-border flex items-center gap-1 sm:gap-4 overflow-x-auto text-sm font-semibold select-none mb-6">
            <button
              onClick={() => handleTabChange("upcoming")}
              className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-1 ${
                activeTab === "upcoming"
                  ? "border-zoom-blue text-zoom-blue"
                  : "border-transparent text-zoom-muted hover:text-zoom-text"
              }`}
            >
              <span>Upcoming</span>
            </button>

            <button
              onClick={() => handleTabChange("previous")}
              className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-1 ${
                activeTab === "previous"
                  ? "border-zoom-blue text-zoom-blue"
                  : "border-transparent text-zoom-muted hover:text-zoom-text"
              }`}
            >
              <span>Previous</span>
            </button>

            <button
              onClick={() => showToast("Attachments coming soon", "info")}
              className="pb-3 px-2 border-b-2 border-transparent text-zoom-muted hover:text-zoom-text transition-colors"
            >
              Attachments
            </button>

            <button
              onClick={() => handleTabChange("personal")}
              className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-1 ${
                activeTab === "personal"
                  ? "border-zoom-blue text-zoom-blue"
                  : "border-transparent text-zoom-muted hover:text-zoom-text"
              }`}
            >
              <span>Personal Room</span>
            </button>

            <button
              onClick={() => showToast("Meeting Templates coming soon", "info")}
              className="pb-3 px-2 border-b-2 border-transparent text-zoom-muted hover:text-zoom-text transition-colors hidden sm:block"
            >
              Meeting Templates
            </button>
          </div>

          {/* Tab 1 & 2: Upcoming or Previous Meetings List */}
          {(activeTab === "upcoming" || activeTab === "previous") && (
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border border-zoom-border rounded-zoom p-4 animate-pulse space-y-3"
                  >
                    <div className="h-4 w-48 bg-gray-200 rounded" />
                    <div className="h-5 w-72 bg-gray-200 rounded" />
                    <div className="h-3 w-36 bg-gray-200 rounded" />
                  </div>
                ))
              ) : meetings.length === 0 ? (
                /* Welcome Banner matching screenshot when list is empty */
                <div className="bg-white rounded-zoom border border-zoom-border p-12 text-center max-w-2xl mx-auto shadow-zoom">
                  <h2 className="text-2xl font-extrabold text-zoom-text mb-2">
                    Welcome to Zoom Meetings!
                  </h2>
                  <p className="text-xs sm:text-sm text-zoom-muted max-w-md mx-auto mb-6">
                    Schedule new and manage existing meetings all in one place. You are
                    currently on the host demo account.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Link href="/meetings/schedule">
                      <Button variant="primary" size="md" className="font-bold">
                        Schedule a Meeting
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => showToast("Account is already upgraded", "info")}
                    >
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {meetings.map((meeting) => (
                    <MeetingListItem
                      key={meeting.id}
                      meeting={meeting}
                      onStart={handleStartMeeting}
                      onDelete={async (id) => {
                        if (confirm("Cancel this meeting?")) {
                          await cancel(id);
                          showToast("Meeting cancelled.", "info");
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Personal Meeting Room */}
          {activeTab === "personal" && (
            <div className="bg-white rounded-zoom border border-zoom-border p-6 shadow-zoom space-y-6">
              <div className="border-b border-zoom-border pb-4">
                <h2 className="text-xl font-bold text-zoom-text">
                  {currentUser.name}&apos;s Personal Meeting Room
                </h2>
                <p className="text-xs text-zoom-muted mt-1">
                  Your Personal Meeting Room is a permanently reserved meeting room with a
                  fixed Meeting ID.
                </p>
              </div>

              <div className="space-y-4 text-sm divide-y divide-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2">
                  <span className="text-zoom-muted font-medium">Meeting ID</span>
                  <span className="font-mono font-bold text-base text-zoom-text">
                    {formatMeetingCode(currentUser.personal_meeting_id)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2">
                  <span className="text-zoom-muted font-medium">Security</span>
                  <span className="font-mono font-semibold text-zoom-text flex items-center gap-2">
                    <Shield className="w-4 h-4 text-zoom-muted" />
                    Passcode: 2026PMI • Waiting Room Enabled
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2">
                  <span className="text-zoom-muted font-medium">Invite Link</span>
                  <span className="text-zoom-blue truncate font-medium">
                    http://localhost:3000/join/{currentUser.personal_meeting_id}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2">
                  <span className="text-zoom-muted font-medium">Host Video</span>
                  <span className="font-medium text-zoom-text">On by default</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2">
                  <span className="text-zoom-muted font-medium">Participant Video</span>
                  <span className="font-medium text-zoom-text">On by default</span>
                </div>
              </div>

              <div className="pt-4 border-t border-zoom-border flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStartPersonalRoom}
                  className="font-bold"
                >
                  <Video className="w-4 h-4 mr-1.5" />
                  <span>Start Meeting</span>
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={handleCopyPersonalInvitation}
                >
                  {copiedPmi ? (
                    <Check className="w-4 h-4 text-green-600 mr-1.5" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1.5" />
                  )}
                  <span>{copiedPmi ? "Copied" : "Copy Invitation"}</span>
                </Button>
              </div>
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
