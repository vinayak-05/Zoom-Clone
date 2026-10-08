"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../components/layout/Navbar";
import { Sidebar } from "../components/layout/Sidebar";
import { ActionTile } from "../components/dashboard/ActionTile";
import { ClockCard } from "../components/dashboard/ClockCard";
import { MeetingList } from "../components/dashboard/MeetingList";
import { JoinMeetingModal } from "../components/modals/JoinMeetingModal";
import { useMeetings } from "../hooks/useMeetings";
import { useToast } from "../components/ui/Toast";
import { getStoredUser } from "../lib/auth";
import type { Meeting } from "../lib/types";

export default function HomePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const {
    meetings,
    loading,
    filter,
    setFilter,
    createInstant,
    cancel,
  } = useMeetings("upcoming");

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreatingInstant, setIsCreatingInstant] = useState(false);

  // Next upcoming meeting for ClockCard preview
  const nextMeeting = meetings.length > 0 && filter === "upcoming" ? meetings[0] : null;

  const handleStartInstantMeeting = async (videoOption: string = "video-on") => {
    try {
      setIsCreatingInstant(true);
      const isVideoDefault = videoOption === "video-on";
      const res = await createInstant({
        title: "Instant Meeting",
        host_video_default: isVideoDefault,
        participant_video_default: true,
      });

      // Save preference for immediate room access
      if (typeof window !== "undefined") {
        const currentUser = getStoredUser();
        sessionStorage.setItem("zoom_displayName", currentUser?.name || "Guest");
        sessionStorage.setItem("zoom_noVideo", isVideoDefault ? "0" : "1");
        sessionStorage.setItem("zoom_noAudio", "0");
      }

      showToast("Starting instant meeting...", "success");
      router.push(`/meeting/${res.meeting.meeting_code}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start meeting.";
      showToast(msg, "error");
    } finally {
      setIsCreatingInstant(false);
    }
  };

  const handleStartMeeting = (meeting: Meeting) => {
    router.push(`/meeting/${meeting.meeting_code}`);
  };

  const handleDeleteMeeting = async (id: number) => {
    if (confirm("Are you sure you want to cancel this meeting?")) {
      try {
        await cancel(id);
        showToast("Meeting cancelled successfully.", "info");
      } catch (err) {
        showToast("Failed to cancel meeting.", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-zoom-bg flex flex-col">
      {/* Top Navigation */}
      <Navbar
        onOpenJoinModal={() => setIsJoinModalOpen(true)}
        onStartInstantMeeting={() => handleStartInstantMeeting("video-on")}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Dashboard Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-6 pb-20 md:pb-8">
          {/* Top Row: Action Tiles + Clock Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* 4 Action Tiles (7 cols on lg) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-zoom-border p-6 shadow-zoom flex items-center justify-around sm:justify-between gap-2 sm:gap-4">
              <ActionTile
                type="new-meeting"
                onClick={() => handleStartInstantMeeting("video-on")}
                onOptionSelect={(opt) => handleStartInstantMeeting(opt)}
              />
              <ActionTile
                type="join"
                onClick={() => setIsJoinModalOpen(true)}
              />
              <ActionTile
                type="schedule"
                onClick={() => router.push("/meetings/schedule")}
              />
              <ActionTile
                type="share-screen"
                onClick={() => {
                  showToast("Starting screen share session...", "info");
                  handleStartInstantMeeting("video-off");
                }}
              />
            </div>

            {/* Live Clock Card (5 cols on lg) */}
            <div className="lg:col-span-5">
              <ClockCard
                upcomingMeeting={nextMeeting}
                onStartMeeting={(code) => router.push(`/meeting/${code}`)}
              />
            </div>
          </div>

          {/* Bottom Section: Meeting List Tabs (Upcoming & Previous) */}
          <div>
            <MeetingList
              meetings={meetings}
              filter={filter as "upcoming" | "recent"}
              onFilterChange={(f) => setFilter(f)}
              loading={loading}
              onStartMeeting={handleStartMeeting}
              onDeleteMeeting={handleDeleteMeeting}
            />
          </div>
        </main>
      </div>

      {/* Join Meeting Dialog */}
      <JoinMeetingModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  );
}
