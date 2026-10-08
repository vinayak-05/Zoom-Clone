"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Shield, Video, AlertCircle } from "lucide-react";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { api } from "../../../lib/api";
import { formatMeetingCode } from "../../../lib/utils";
import { DEFAULT_USER } from "../../../lib/constants";
import type { MeetingValidationResponse } from "../../../lib/types";

function JoinByLinkContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const codeParam = String(params.code || "");
  const queryPwd = searchParams.get("pwd") || "";

  const [validation, setValidation] = useState<MeetingValidationResponse | null>(null);
  const [displayName, setDisplayName] = useState(DEFAULT_USER.name);
  const [passcode, setPasscode] = useState(queryPwd);
  const [noAudio, setNoAudio] = useState(false);
  const [noVideo, setNoVideo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function validate() {
      if (!codeParam) return;
      try {
        setLoading(true);
        setError(null);
        const data = await api.validateMeetingCode(codeParam);
        setValidation(data);
        if (data.passcode && !queryPwd) {
          setPasscode(data.passcode);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Meeting link is invalid or expired.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    validate();
  }, [codeParam, queryPwd]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Please enter your display name.");
      return;
    }

    if (validation?.has_passcode && !passcode.trim()) {
      setError("This meeting requires a passcode.");
      return;
    }

    setSubmitting(true);

    if (typeof window !== "undefined") {
      sessionStorage.setItem("zoom_displayName", displayName.trim());
      sessionStorage.setItem("zoom_noAudio", noAudio ? "1" : "0");
      sessionStorage.setItem("zoom_noVideo", noVideo ? "1" : "0");
      if (passcode.trim()) {
        sessionStorage.setItem("zoom_passcode", passcode.trim());
      }
    }

    router.push(`/meeting/${codeParam}`);
  };

  return (
    <div className="min-h-screen bg-zoom-bg flex flex-col justify-between p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between max-w-md mx-auto w-full">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-zoom-muted hover:text-zoom-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <span className="text-xl font-black text-zoom-blue">zoom</span>
      </div>

      {/* Main Join Card */}
      <div className="max-w-md w-full mx-auto my-8 bg-white rounded-2xl border border-zoom-border shadow-zoom-card p-6 sm:p-8">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded mx-auto" />
            <div className="h-4 w-32 bg-gray-200 rounded mx-auto" />
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
          </div>
        ) : error ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-zoom-red mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zoom-text">Unable to Join</h2>
              <p className="text-xs text-zoom-muted mt-1.5">{error}</p>
            </div>
            <Link href="/" className="inline-block mt-4">
              <Button variant="primary" size="sm">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="space-y-5">
            <div className="text-center pb-2 border-b border-zoom-border">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zoom-blue bg-blue-50 px-2 py-0.5 rounded">
                Join Meeting
              </span>
              <h1 className="text-lg font-bold text-zoom-text mt-2 line-clamp-1">
                {validation?.title}
              </h1>
              <p className="text-xs text-zoom-muted font-mono mt-0.5">
                Meeting ID: {formatMeetingCode(codeParam)}
              </p>
            </div>

            <Input
              label="Your Display Name"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setError(null);
              }}
              required
              autoFocus
            />

            {validation?.has_passcode && (
              <Input
                label="Meeting Passcode"
                type="password"
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setError(null);
                }}
                required
              />
            )}

            <div className="space-y-2 pt-1 border-t border-zoom-border">
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

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 text-sm font-bold shadow-md"
              isLoading={submitting}
              disabled={submitting || !displayName.trim()}
            >
              Join Meeting
            </Button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-zoom-muted">
        Zoom Clone Web App • End-to-End Encrypted Communication
      </div>
    </div>
  );
}

export default function JoinByLinkPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-zoom-bg" />}>
      <JoinByLinkContent />
    </React.Suspense>
  );
}
