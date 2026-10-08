"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Shield, Video, Users, Check } from "lucide-react";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Toggle } from "../ui/Toggle";
import { Button } from "../ui/Button";
import { api } from "../../lib/api";
import { COMMON_TIMEZONES, DEFAULT_USER } from "../../lib/constants";
import { useToast } from "../ui/Toast";

interface ScheduleFormProps {
  onSuccess?: (meetingId: number) => void;
  onCancel?: () => void;
}

export function ScheduleForm({ onSuccess, onCancel }: ScheduleFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  // Form State
  const [topic, setTopic] = useState(`${DEFAULT_USER.name}'s Zoom Meeting`);
  const [description, setDescription] = useState("");

  // Default to tomorrow 10:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("10:00");

  const [durationHours, setDurationHours] = useState("0");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [timezone, setTimezone] = useState(DEFAULT_USER.timezone);

  // Security
  const [hasPasscode, setHasPasscode] = useState(true);
  const [passcode, setPasscode] = useState(
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );
  const [waitingRoom, setWaitingRoom] = useState(true);

  // Video Settings
  const [hostVideo, setHostVideo] = useState(true);
  const [participantVideo, setParticipantVideo] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please provide a topic for the meeting.");
      return;
    }

    const totalDuration = parseInt(durationHours, 10) * 60 + parseInt(durationMinutes, 10);
    if (totalDuration <= 0) {
      setError("Duration must be greater than 0 minutes.");
      return;
    }

    // Combine date and time to ISO
    const combinedDate = new Date(`${startDate}T${startTime}:00`);
    if (isNaN(combinedDate.getTime())) {
      setError("Invalid date or time specified.");
      return;
    }

    if (combinedDate.getTime() <= Date.now() - 60000) {
      setError("Meeting start time must be in the future.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.createScheduledMeeting({
        title: topic.trim(),
        description: description.trim() || undefined,
        scheduled_start: combinedDate.toISOString(),
        duration_minutes: totalDuration,
        timezone,
        passcode: hasPasscode && passcode.trim() ? passcode.trim() : undefined,
        waiting_room: waitingRoom,
        host_video_default: hostVideo,
        participant_video_default: participantVideo,
      });

      showToast("Meeting scheduled successfully!", "success");

      if (onSuccess) {
        onSuccess(response.meeting.id);
      } else {
        router.push(`/meetings/${response.meeting.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to schedule meeting.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const hourOptions = Array.from({ length: 25 }, (_, i) => ({
    value: i.toString(),
    label: `${i} hr${i === 1 ? "" : "s"}`,
  }));

  const minuteOptions = [
    { value: "0", label: "0 mins" },
    { value: "15", label: "15 mins" },
    { value: "30", label: "30 mins" },
    { value: "45", label: "45 mins" },
  ];

  const tzOptions = COMMON_TIMEZONES.map((tz) => ({
    value: tz,
    label: tz,
  }));

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-zoom border border-zoom-border p-6 shadow-zoom space-y-6 max-w-3xl">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-zoom text-zoom-red text-sm font-medium">
          {error}
        </div>
      )}

      {/* 1. Basic Information */}
      <div className="space-y-4">
        <Input
          label="Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="My Meeting"
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-zoom-text">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Enter a brief agenda or description for attendees"
            className="w-full p-3 rounded-zoom border border-zoom-border text-sm text-zoom-text focus:outline-none focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/20 placeholder:text-zoom-muted resize-none"
          />
        </div>
      </div>

      {/* 2. When & Duration */}
      <div className="border-t border-zoom-border pt-5 space-y-4">
        <h3 className="text-sm font-bold text-zoom-text uppercase tracking-wide flex items-center gap-2 text-zoom-muted">
          <Calendar className="w-4 h-4" />
          Schedule Date & Time
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={startDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />

          <Input
            label="Time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Duration (Hours)"
            options={hourOptions}
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
          />

          <Select
            label="Duration (Minutes)"
            options={minuteOptions}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />

          <Select
            label="Time Zone"
            options={tzOptions}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          />
        </div>
      </div>

      {/* 3. Security */}
      <div className="border-t border-zoom-border pt-5 space-y-4">
        <h3 className="text-sm font-bold text-zoom-text uppercase tracking-wide flex items-center gap-2 text-zoom-muted">
          <Shield className="w-4 h-4" />
          Security
        </h3>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-zoom border border-zoom-border">
            <div>
              <p className="text-sm font-medium text-zoom-text">Passcode</p>
              <p className="text-xs text-zoom-muted">
                Only users who have the passcode or invite link can join.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={hasPasscode}
                onChange={(e) => setHasPasscode(e.target.checked)}
                className="rounded border-gray-300 text-zoom-blue focus:ring-zoom-blue h-4 w-4"
              />
              {hasPasscode && (
                <input
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-28 h-8 px-2.5 rounded border border-zoom-border text-xs font-mono uppercase bg-white focus:outline-none focus:border-zoom-blue"
                  maxLength={10}
                />
              )}
            </div>
          </div>

          <Toggle
            checked={waitingRoom}
            onChange={setWaitingRoom}
            label="Waiting Room"
            description="Only users admitted by the host can join the meeting."
          />
        </div>
      </div>

      {/* 4. Video Defaults */}
      <div className="border-t border-zoom-border pt-5 space-y-4">
        <h3 className="text-sm font-bold text-zoom-text uppercase tracking-wide flex items-center gap-2 text-zoom-muted">
          <Video className="w-4 h-4" />
          Video
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Toggle
            checked={hostVideo}
            onChange={setHostVideo}
            label="Host Video"
            description="Start meeting with host camera on."
          />

          <Toggle
            checked={participantVideo}
            onChange={setParticipantVideo}
            label="Participants Video"
            description="Allow participants cameras on upon joining."
          />
        </div>
      </div>

      {/* 5. Footer Buttons */}
      <div className="border-t border-zoom-border pt-5 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel || (() => router.push("/meetings"))}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          disabled={loading}
        >
          Save Meeting
        </Button>
      </div>
    </form>
  );
}
