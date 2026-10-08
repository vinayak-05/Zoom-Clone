"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { parseMeetingCode } from "../../lib/utils";
import { api } from "../../lib/api";
import { DEFAULT_USER } from "../../lib/constants";

interface JoinMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export function JoinMeetingModal({
  isOpen,
  onClose,
  initialCode = "",
}: JoinMeetingModalProps) {
  const router = useRouter();
  const [meetingInput, setMeetingInput] = useState(initialCode);
  const [displayName, setDisplayName] = useState(DEFAULT_USER.name);
  const [passcode, setPasscode] = useState("");
  const [noAudio, setNoAudio] = useState(false);
  const [noVideo, setNoVideo] = useState(false);
  const [requiresPasscode, setRequiresPasscode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedCode = parseMeetingCode(meetingInput);
  const isValid = Boolean(parsedCode && displayName.trim().length > 0);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedCode) {
      setError("Please enter a valid 10 or 11-digit meeting ID or link.");
      return;
    }
    if (!displayName.trim()) {
      setError("Please enter your display name.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate meeting code against backend
      const validation = await api.validateMeetingCode(parsedCode);

      if (validation.has_passcode && !passcode) {
        setRequiresPasscode(true);
        setError("This meeting requires a passcode.");
        setLoading(false);
        return;
      }

      // Store pre-join preferences in sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem("zoom_displayName", displayName.trim());
        sessionStorage.setItem("zoom_noAudio", noAudio ? "1" : "0");
        sessionStorage.setItem("zoom_noVideo", noVideo ? "1" : "0");
        if (passcode) {
          sessionStorage.setItem("zoom_passcode", passcode);
        }
      }

      onClose();
      // Redirect to meeting room
      router.push(`/meeting/${parsedCode}`);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Invalid meeting ID or link.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Join Meeting"
      maxWidth="md"
    >
      <form onSubmit={handleJoin} className="space-y-4">
        <Input
          label="Meeting ID or Personal Link Name"
          placeholder="Enter Meeting ID (e.g. 123 4567 8901) or URL"
          value={meetingInput}
          onChange={(e) => {
            setMeetingInput(e.target.value);
            setError(null);
          }}
          error={error || undefined}
          autoFocus
        />

        <Input
          label="Your Name"
          placeholder="Enter your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        {requiresPasscode && (
          <Input
            label="Meeting Passcode"
            type="password"
            placeholder="Enter passcode"
            value={passcode}
            onChange={(e) => {
              setPasscode(e.target.value);
              setError(null);
            }}
          />
        )}

        <div className="pt-2 space-y-2 border-t border-zoom-border">
          <p className="text-xs font-bold text-zoom-muted uppercase tracking-wider">
            Join options
          </p>

          <label className="flex items-center gap-2.5 text-xs text-zoom-text cursor-pointer select-none">
            <input
              type="checkbox"
              checked={noAudio}
              onChange={(e) => setNoAudio(e.target.checked)}
              className="rounded border-gray-300 text-zoom-blue focus:ring-zoom-blue h-4 w-4"
            />
            <span>Don&apos;t connect to audio</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-zoom-text cursor-pointer select-none">
            <input
              type="checkbox"
              checked={noVideo}
              onChange={(e) => setNoVideo(e.target.checked)}
              className="rounded border-gray-300 text-zoom-blue focus:ring-zoom-blue h-4 w-4"
            />
            <span>Turn off my video</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zoom-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!isValid || loading}
            isLoading={loading}
          >
            Join
          </Button>
        </div>
      </form>
    </Modal>
  );
}
