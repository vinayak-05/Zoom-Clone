"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "../../../components/layout/Navbar";
import { Sidebar } from "../../../components/layout/Sidebar";
import { ScheduleForm } from "../../../components/modals/ScheduleForm";
import { JoinMeetingModal } from "../../../components/modals/JoinMeetingModal";

export default function ScheduleMeetingPage() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zoom-bg flex flex-col">
      <Navbar onOpenJoinModal={() => setIsJoinModalOpen(true)} />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full pb-20 md:pb-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Link
                href="/meetings"
                className="text-xs text-zoom-muted hover:text-zoom-blue flex items-center gap-1.5 mb-2 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Meetings</span>
              </Link>
              <h1 className="text-2xl font-black text-zoom-text tracking-tight">
                Schedule a Meeting
              </h1>
            </div>
          </div>

          <ScheduleForm />
        </main>
      </div>

      <JoinMeetingModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  );
}
