"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mic, MicOff, Video, VideoOff, Settings, ArrowLeft, Shield } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Avatar } from "../ui/Avatar";
import { formatMeetingCode } from "../../lib/utils";

interface PreJoinScreenProps {
  meetingTitle: string;
  meetingCode: string;
  hostName: string;
  initialDisplayName: string;
  hasPasscode: boolean;
  onJoin: (settings: {
    displayName: string;
    isMuted: boolean;
    isVideoOff: boolean;
    passcode?: string;
  }) => void;
  isLoading?: boolean;
}

export function PreJoinScreen({
  meetingTitle,
  meetingCode,
  hostName,
  initialDisplayName,
  hasPasscode,
  onJoin,
  isLoading = false,
}: PreJoinScreenProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [passcode, setPasscode] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize preview stream & restore sessionStorage settings
  useEffect(() => {
    let initialNoAudio = false;
    let initialNoVideo = false;

    if (typeof window !== "undefined") {
      const storedName = sessionStorage.getItem("zoom_displayName");
      if (storedName) setDisplayName(storedName);
      const storedPasscode = sessionStorage.getItem("zoom_passcode");
      if (storedPasscode) setPasscode(storedPasscode);
      initialNoAudio = sessionStorage.getItem("zoom_noAudio") === "1";
      initialNoVideo = sessionStorage.getItem("zoom_noVideo") === "1";
      if (initialNoAudio) setIsMuted(true);
      if (initialNoVideo) setIsVideoOff(true);
    }

    let activeStream: MediaStream | null = null;
    async function initCamera() {
      try {
        const constraints: MediaStreamConstraints = {
          audio: true,
          video: initialNoVideo
            ? false
            : { width: { ideal: 1280 }, height: { ideal: 720 } },
        };
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (initialNoAudio) {
          activeStream.getAudioTracks().forEach((t) => (t.enabled = false));
        }
        mediaStreamRef.current = activeStream;
        setMediaStream(activeStream);
        if (videoRef.current && !initialNoVideo) {
          videoRef.current.srcObject = activeStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn("Could not start preview camera:", err);
        setIsVideoOff(true);
      }
    }
    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Keep preview video element synced with stream whenever video is enabled
  useEffect(() => {
    if (videoRef.current && mediaStream && !isVideoOff) {
      if (videoRef.current.srcObject !== mediaStream) {
        videoRef.current.srcObject = mediaStream;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [mediaStream, isVideoOff]);

  // Update track states when toggled
  const handleToggleAudio = () => {
    const nextState = !isMuted;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !nextState));
    }
    setIsMuted(nextState);
  };

  const handleToggleVideo = async () => {
    if (!isVideoOff) {
      // Turn video OFF: stop physical tracks so camera LED turns OFF completely
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach((t) => {
          t.stop();
          mediaStreamRef.current?.removeTrack(t);
        });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsVideoOff(true);
    } else {
      // Turn video ON: request camera stream and attach
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        const track = videoStream.getVideoTracks()[0];
        if (track) {
          let updatedStream: MediaStream;
          if (mediaStreamRef.current) {
            mediaStreamRef.current.addTrack(track);
            updatedStream = new MediaStream([
              ...mediaStreamRef.current.getAudioTracks(),
              track,
            ]);
          } else {
            updatedStream = new MediaStream([track]);
          }
          mediaStreamRef.current = updatedStream;
          setMediaStream(updatedStream);
          if (videoRef.current) {
            videoRef.current.srcObject = updatedStream;
            videoRef.current.play().catch(() => {});
          }
        }
        setIsVideoOff(false);
      } catch (err) {
        console.warn("Could not start preview video:", err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    // Stop preview stream completely before entering room to release camera hardware
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }

    onJoin({
      displayName: displayName.trim(),
      isMuted,
      isVideoOff,
      passcode: passcode.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-zoom-bg flex flex-col justify-between p-4 sm:p-6">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-zoom-muted hover:text-zoom-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-1.5 font-black text-xl text-zoom-blue">
          zoom
        </div>
      </div>

      {/* Main Pre-join Card */}
      <div className="max-w-3xl w-full mx-auto my-6 bg-white rounded-2xl border border-zoom-border shadow-zoom-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left: Camera Preview (7 cols) */}
          <div className="md:col-span-7 bg-[#1C1C1C] p-6 flex flex-col justify-between relative min-h-[320px] sm:min-h-[380px]">
            {/* Video or Avatar */}
            <div className="relative flex-1 rounded-zoom overflow-hidden flex items-center justify-center bg-[#2E2E38]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${
                  isVideoOff ? "hidden" : "block"
                }`}
              />

              {isVideoOff && (
                <div className="flex flex-col items-center gap-2 animate-in fade-in">
                  <Avatar name={displayName || "?"} size="xl" />
                  <span className="text-white text-xs font-medium">
                    Camera is turned off
                  </span>
                </div>
              )}

              {/* Status overlay badge */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] text-white font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Preview Mode
              </div>
            </div>

            {/* In-Preview Media Controls */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                type="button"
                onClick={handleToggleAudio}
                className={`p-3 rounded-full text-white transition-colors flex items-center gap-2 text-xs font-semibold ${
                  isMuted
                    ? "bg-zoom-red hover:bg-zoom-red-hover"
                    : "bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isMuted ? "Unmute" : "Mute"}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleVideo}
                className={`p-3 rounded-full text-white transition-colors flex items-center gap-2 text-xs font-semibold ${
                  isVideoOff
                    ? "bg-zoom-red hover:bg-zoom-red-hover"
                    : "bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                }`}
              >
                {isVideoOff ? (
                  <VideoOff className="w-4 h-4" />
                ) : (
                  <Video className="w-4 h-4" />
                )}
                <span>{isVideoOff ? "Start Video" : "Stop Video"}</span>
              </button>
            </div>
          </div>

          {/* Right: Join Form (5 cols) */}
          <div className="md:col-span-5 p-6 flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <span className="text-[11px] uppercase tracking-wider font-bold text-zoom-blue bg-blue-50 px-2 py-0.5 rounded">
                  Ready to join
                </span>
                <h1 className="text-xl font-bold text-zoom-text mt-1.5 line-clamp-2">
                  {meetingTitle}
                </h1>
                <p className="text-xs text-zoom-muted mt-1 font-mono">
                  ID: {formatMeetingCode(meetingCode)}
                </p>
                {hostName && (
                  <p className="text-xs text-zoom-muted mt-0.5">
                    Host: <span className="text-zoom-text font-medium">{hostName}</span>
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Your Name"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />

                {hasPasscode && (
                  <Input
                    label="Meeting Passcode"
                    type="password"
                    placeholder="Enter passcode"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    required
                  />
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full h-11 text-sm font-bold shadow-md"
                    isLoading={isLoading}
                    disabled={isLoading || !displayName.trim()}
                  >
                    Join Meeting
                  </Button>
                </div>
              </form>
            </div>

            <div className="pt-4 border-t border-zoom-border text-center">
              <p className="text-[11px] text-zoom-muted">
                By joining, you agree to the Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-zoom-muted">
        Zoom Clone Web App • End-to-End Encrypted Communication
      </div>
    </div>
  );
}
