"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Shield,
  LayoutGrid,
  Maximize2,
  Copy,
  Check,
  Clock,
  ChevronDown,
  Info,
  LogOut,
} from "lucide-react";
import { PreJoinScreen } from "../../../components/room/PreJoinScreen";
import { VideoGrid } from "../../../components/room/VideoGrid";
import { ControlBar } from "../../../components/room/ControlBar";
import { ParticipantsPanel } from "../../../components/room/ParticipantsPanel";
import { ChatPanel } from "../../../components/room/ChatPanel";
import { useLocalMedia } from "../../../hooks/useLocalMedia";
import { useMeetingSocket } from "../../../hooks/useMeetingSocket";
import { api } from "../../../lib/api";
import { formatMeetingCode, formatTime } from "../../../lib/utils";
import { DEFAULT_USER } from "../../../lib/constants";
import { useToast } from "../../../components/ui/Toast";
import type {
  MeetingValidationResponse,
  Participant,
  ChatMessage,
  ParticipantJoinResponse,
} from "../../../lib/types";
import type { ParticipantTileData } from "../../../components/room/SpeakerView";

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const codeParam = String(params.code || "");

  // Meeting & Join States
  const [validation, setValidation] = useState<MeetingValidationResponse | null>(null);
  const [meetingError, setMeetingError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinData, setJoinData] = useState<ParticipantJoinResponse | null>(null);

  // UI Panels & Layout States
  const [viewMode, setViewMode] = useState<"gallery" | "speaker">("gallery");
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [copiedInfo, setCopiedInfo] = useState(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);

  // In-Meeting Real-time States
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Meeting Elapsed Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Local Media Hook
  const {
    localStream,
    screenStream,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    startMedia,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    stopAllTracks,
  } = useLocalMedia({
    initialAudio: true,
    initialVideo: true,
  });

  // Intercept browser back button & page unload while inside meeting room
  useEffect(() => {
    if (!hasJoined) return;

    // Push initial history state so pressing back triggers popstate instead of instantly exiting
    window.history.pushState({ inMeeting: true }, "", window.location.href);

    const handlePopState = () => {
      // Re-push history state to prevent exiting without confirmation
      window.history.pushState({ inMeeting: true }, "", window.location.href);
      setShowLeaveConfirmModal(true);
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      stopAllTracks();
      if (joinData?.participant?.id) {
        navigator.sendBeacon?.(
          `http://localhost:8000/api/v1/meetings/code/${codeParam}/leave?participant_id=${joinData.participant.id}`
        );
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasJoined, joinData?.participant?.id, codeParam, stopAllTracks]);

  // 1. Initial Validation on Mount
  useEffect(() => {
    async function validateRoom() {
      if (!codeParam) return;
      try {
        const val = await api.validateMeetingCode(codeParam);
        setValidation(val);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Meeting not accessible.";
        setMeetingError(msg);
      }
    }
    validateRoom();
  }, [codeParam]);

  // 2. Elapsed Timer
  useEffect(() => {
    if (!hasJoined) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [hasJoined]);

  const formatElapsed = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(s)}`;
    return `${pad(mins)}:${pad(s)}`;
  };

  // 3. Refresh Active Participants from Server
  const refreshParticipants = useCallback(async () => {
    if (!codeParam) return;
    try {
      const list = await api.getParticipants(codeParam);
      setParticipants(list);
    } catch (err) {
      console.warn("Error refreshing participants:", err);
    }
  }, [codeParam]);

  // 4. WebSocket Hooks & Handlers
  const currentParticipantId = joinData?.participant?.id || null;

  const handleRemoteChatMessage = useCallback((msg: ChatMessage) => {
    // Prevent duplicate messages if the message is from current participant
    if (currentParticipantId && msg.participant_id === currentParticipantId) {
      return;
    }
    setChatMessages((prev) => {
      if (prev.some((m) => m.id === msg.id || (m.content === msg.content && m.participant_id === msg.participant_id))) {
        return prev;
      }
      return [...prev, msg];
    });
    if (!isChatOpen) {
      setUnreadChatCount((prev) => prev + 1);
    }
  }, [currentParticipantId, isChatOpen]);

  const handleMutedByHost = useCallback(() => {
    if (!isAudioMuted) {
      toggleAudio();
    }
    showToast("The host has muted your microphone.", "info");
  }, [isAudioMuted, toggleAudio, showToast]);

  const handleParticipantMuted = useCallback((targetId: number, muted: boolean) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === targetId ? { ...p, is_muted: muted } : p))
    );
  }, []);

  const handleParticipantRemoved = useCallback((targetId: number) => {
    if (targetId === currentParticipantId) {
      stopAllTracks();
      alert("You have been removed from the meeting by the host.");
      router.push("/");
    } else {
      setParticipants((prev) => prev.filter((p) => p.id !== targetId));
      showToast("A participant was removed.", "info");
    }
  }, [currentParticipantId, stopAllTracks, router, showToast]);

  const handleMeetingEnded = useCallback(() => {
    stopAllTracks();
    alert("This meeting has been ended by the host.");
    router.push("/");
  }, [stopAllTracks, router]);

  const handleRemoteReaction = useCallback((reaction: string, senderId: number) => {
    setActiveReaction(reaction);
    setTimeout(() => setActiveReaction(null), 3000);
  }, []);

  const {
    sendChatMessage: socketSendChat,
    sendMuteAll: socketSendMuteAll,
    sendMuteParticipant: socketSendMute,
    sendRemoveParticipant: socketSendRemove,
    sendMeetingEnded: socketSendEnd,
    sendReaction: socketSendReaction,
  } = useMeetingSocket({
    meetingCode: codeParam,
    participantId: currentParticipantId,
    onParticipantJoined: () => {
      refreshParticipants();
      showToast("A new participant joined.", "info");
    },
    onParticipantLeft: (pid) => {
      setParticipants((prev) => prev.filter((p) => p.id !== pid));
    },
    onMutedByHost: handleMutedByHost,
    onParticipantMuted: handleParticipantMuted,
    onParticipantRemoved: handleParticipantRemoved,
    onMeetingEnded: handleMeetingEnded,
    onChatMessage: handleRemoteChatMessage,
    onReaction: handleRemoteReaction,
  });

  // 5. Join Room Handler (called from PreJoinScreen)
  const handleJoinFromPreJoin = async (settings: {
    displayName: string;
    isMuted: boolean;
    isVideoOff: boolean;
    passcode?: string;
  }) => {
    setIsJoining(true);
    try {
      // Initialize actual stream in room respecting user's pre-join selections
      await startMedia({
        audio: !settings.isMuted,
        video: !settings.isVideoOff,
      });

      // Check if user is host
      const activeUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("zoom_current_user") || "null") : null;
      const hostNameMatch = Boolean(validation?.host_name && settings.displayName.toLowerCase() === validation.host_name.toLowerCase());
      const isHostUser = hostNameMatch || Boolean(activeUser?.name && validation?.host_name && activeUser.name.toLowerCase() === validation.host_name.toLowerCase());

      const res = await api.joinMeeting(codeParam, {
        display_name: settings.displayName,
        user_id: activeUser?.id || (isHostUser ? DEFAULT_USER.id : null),
        passcode: settings.passcode,
        is_muted: settings.isMuted,
        is_video_off: settings.isVideoOff,
      });

      setJoinData(res);
      setHasJoined(true);

      // Load existing chat history and participants
      try {
        const [parts, msgs] = await Promise.all([
          api.getParticipants(codeParam),
          api.getChatMessages(codeParam),
        ]);
        setParticipants(parts);
        setChatMessages(msgs);
      } catch (e) {
        console.warn("Could not load initial room data:", e);
      }

      showToast(`Joined ${res.title}`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to join meeting.";
      showToast(msg, "error");
    } finally {
      setIsJoining(false);
    }
  };

  // 6. Leave & End Actions
  const handleLeaveMeeting = async () => {
    stopAllTracks();
    if (joinData?.participant?.id) {
      try {
        await api.leaveMeeting(codeParam, joinData.participant.id);
      } catch (e) {
        console.warn("Error notifying leave:", e);
      }
    }
    router.push("/");
  };

  const handleEndMeetingForAll = async () => {
    stopAllTracks();
    try {
      socketSendEnd();
      await api.endMeeting(codeParam);
    } catch (e) {
      console.warn("Error ending meeting:", e);
    }
    router.push("/");
  };

  // 7. Host Controls
  const isHost = Boolean(joinData?.is_host);

  const handleMuteAll = async () => {
    try {
      await api.muteAllParticipants(codeParam);
      socketSendMuteAll();
      await refreshParticipants();
      showToast("Muted all participants.", "info");
    } catch (err) {
      showToast("Failed to mute all participants.", "error");
    }
  };

  const handleMuteParticipant = async (pid: number | string, mute: boolean) => {
    try {
      const numId = Number(pid);
      await api.muteParticipant(numId, mute);
      socketSendMute(numId, mute);
      await refreshParticipants();
      showToast(`Participant ${mute ? "muted" : "unmuted"}.`, "info");
    } catch (err) {
      showToast("Failed to update participant mute status.", "error");
    }
  };

  const handleRemoveParticipant = async (pid: number | string) => {
    if (confirm("Remove this participant from the meeting?")) {
      try {
        const numId = Number(pid);
        await api.removeParticipant(numId);
        socketSendRemove(numId);
        await refreshParticipants();
        showToast("Participant removed.", "info");
      } catch (err) {
        showToast("Failed to remove participant.", "error");
      }
    }
  };

  // 8. Chat Sending
  const handleSendMessage = async (content: string) => {
    if (!joinData?.participant?.id) return;
    try {
      const sent = await api.sendChatMessage(codeParam, {
        content,
        participant_id: joinData.participant.id,
      });
      // Broadcast via socket to others
      socketSendChat(content, joinData.participant.display_name);
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
    } catch (err) {
      showToast("Failed to send message.", "error");
    }
  };

  // 9. Reactions & Hand Raise
  const handleSendReaction = (emoji: string) => {
    setActiveReaction(emoji);
    socketSendReaction(emoji);
    setTimeout(() => setActiveReaction(null), 3000);
  };

  const handleToggleHandRaise = async () => {
    if (!joinData?.participant?.id) return;
    const nextVal = !isHandRaised;
    setIsHandRaised(nextVal);
    try {
      await api.updateParticipantFlags(joinData.participant.id, {
        is_hand_raised: nextVal,
      });
      showToast(nextVal ? "Hand raised" : "Hand lowered", "info");
    } catch (e) {
      console.warn("Error updating hand raise flag:", e);
    }
  };

  // 10. Copy Info Popover Link
  const handleCopyMeetingLink = async () => {
    const link = `http://localhost:3000/join/${codeParam}${
      validation?.passcode ? `?pwd=${validation.passcode}` : ""
    }`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedInfo(true);
      showToast("Meeting link copied!", "success");
      setTimeout(() => setCopiedInfo(false), 2000);
    } catch {
      showToast("Failed to copy link", "error");
    }
  };

  // Error State before Room
  if (meetingError) {
    return (
      <div className="min-h-screen bg-zoom-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-zoom border border-red-200 p-8 max-w-md w-full text-center shadow-zoom space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-zoom-red mx-auto flex items-center justify-center text-xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-zoom-text">Meeting Unavailable</h2>
          <p className="text-xs text-zoom-muted">{meetingError}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-zoom-blue text-white py-2 rounded-zoom text-sm font-semibold hover:bg-zoom-blue-hover"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Pre-Join Screen Phase
  if (!hasJoined) {
    return (
      <PreJoinScreen
        meetingTitle={validation?.title || "Zoom Meeting"}
        meetingCode={codeParam}
        hostName={validation?.host_name || "Host"}
        initialDisplayName={DEFAULT_USER.name}
        hasPasscode={Boolean(validation?.has_passcode)}
        onJoin={handleJoinFromPreJoin}
        isLoading={isJoining}
      />
    );
  }

  // Prepare Tile Data List: Local User Tile + Other Participant Tiles
  const activeStream = isScreenSharing ? screenStream : localStream;

  const localTileData: ParticipantTileData = {
    id: "local",
    displayName: joinData?.participant?.display_name || DEFAULT_USER.name,
    stream: activeStream,
    isVideoOff,
    isMuted: isAudioMuted,
    isHandRaised,
    isHost,
    isLocal: true,
    reaction: activeReaction,
  };

  // Filter out self from server participants list
  const currentParticipant = joinData?.participant;
  const remoteTiles: ParticipantTileData[] = participants
    .filter((p) => {
      // Exclude self by participant ID
      if (currentParticipant?.id && p.id === currentParticipant.id) return false;
      // Exclude self by user ID if authenticated user
      if (currentParticipant?.user_id && p.user_id && p.user_id === currentParticipant.user_id) return false;
      // Exclude duplicate host tile if user is host with same display name
      if (isHost && p.role === "host" && p.display_name === currentParticipant?.display_name) return false;
      return true;
    })
    .map((p) => ({
      id: p.id,
      displayName: p.display_name,
      isVideoOff: p.is_video_off,
      isMuted: p.is_muted,
      isHandRaised: p.is_hand_raised,
      isHost: p.role === "host",
      isLocal: false,
    }));

  const allTiles: ParticipantTileData[] = [localTileData, ...remoteTiles];

  return (
    <div className="h-screen w-screen bg-zoom-dark flex flex-col overflow-hidden select-none">
      {/* Top Meeting Header Bar */}
      <header className="h-12 bg-zoom-dark-bar border-b border-white/10 px-4 flex items-center justify-between text-white z-20">
        {/* Left: Security Shield & Meeting Title Popover */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setIsInfoOpen(!isInfoOpen)}
            className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Meeting Information"
          >
            <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-bold text-xs sm:text-sm truncate max-w-[180px] sm:max-w-xs">
              {validation?.title || "Zoom Meeting"}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {/* Meeting Info Popover */}
          {isInfoOpen && (
            <div
              className="absolute left-0 top-full mt-2 w-72 bg-[#2D2D3A] rounded-zoom border border-white/10 shadow-2xl p-4 text-xs space-y-3 z-50 animate-in fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-white">Meeting Info</span>
                <span className="text-[10px] text-green-400 font-semibold bg-green-900/40 px-1.5 py-0.5 rounded">
                  Encrypted
                </span>
              </div>

              <div>
                <span className="text-gray-400">Meeting ID:</span>
                <p className="font-mono font-bold text-white text-sm">
                  {formatMeetingCode(codeParam)}
                </p>
              </div>

              {validation?.passcode && (
                <div>
                  <span className="text-gray-400">Passcode:</span>
                  <p className="font-mono font-bold text-white text-sm">
                    {validation.passcode}
                  </p>
                </div>
              )}

              <div>
                <span className="text-gray-400">Host:</span>
                <p className="font-semibold text-white">
                  {validation?.host_name || "Host"}
                </p>
              </div>

              <button
                onClick={handleCopyMeetingLink}
                className="w-full bg-zoom-blue hover:bg-zoom-blue-hover py-1.5 rounded font-bold text-white flex items-center justify-center gap-1.5 transition-colors mt-2"
              >
                {copiedInfo ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedInfo ? "Link Copied" : "Copy Invite Link"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Center: Meeting Elapsed Timer */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-300 font-mono bg-white/5 px-2.5 py-1 rounded">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>{formatElapsed(elapsedSeconds)}</span>
        </div>

        {/* Right: View Switcher (Speaker vs Gallery) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setViewMode(viewMode === "gallery" ? "speaker" : "gallery")
            }
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs text-gray-200 transition-colors"
            title="Toggle View Mode"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="capitalize">{viewMode} View</span>
          </button>
        </div>
      </header>

      {/* Main Stage & Drawers */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Grid Viewport */}
        <VideoGrid
          participants={allTiles}
          viewMode={viewMode}
        />

        {/* Slide-out Participants Drawer */}
        <ParticipantsPanel
          isOpen={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
          participants={allTiles}
          isHost={isHost}
          onMuteAll={handleMuteAll}
          onMuteParticipant={handleMuteParticipant}
          onRemoveParticipant={handleRemoveParticipant}
        />

        {/* Slide-out Chat Drawer */}
        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          currentParticipantId={joinData?.participant?.id}
        />
      </div>

      {/* Bottom Control Toolbar */}
      <ControlBar
        isMuted={isAudioMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        isHandRaised={isHandRaised}
        participantCount={allTiles.length}
        unreadChatCount={unreadChatCount}
        isParticipantsOpen={isParticipantsOpen}
        isChatOpen={isChatOpen}
        isHost={isHost}
        onToggleAudio={async () => {
          const isAudioActive = toggleAudio();
          if (joinData?.participant?.id) {
            try {
              await api.updateParticipantFlags(joinData.participant.id, {
                is_muted: !isAudioActive,
              });
            } catch (e) {
              console.warn("Failed to sync mute flag:", e);
            }
          }
        }}
        onToggleVideo={async () => {
          const isVideoActive = await toggleVideo();
          if (joinData?.participant?.id) {
            try {
              await api.updateParticipantFlags(joinData.participant.id, {
                is_video_off: !isVideoActive,
              });
            } catch (e) {
              console.warn("Failed to sync video flag:", e);
            }
          }
        }}
        onToggleScreenShare={toggleScreenShare}
        onToggleHandRaise={handleToggleHandRaise}
        onToggleParticipants={() => {
          setIsParticipantsOpen(!isParticipantsOpen);
          if (!isParticipantsOpen) setIsChatOpen(false);
        }}
        onToggleChat={() => {
          setIsChatOpen(!isChatOpen);
          if (!isChatOpen) {
            setIsParticipantsOpen(false);
            setUnreadChatCount(0);
          }
        }}
        onSendReaction={handleSendReaction}
        onLeaveMeeting={handleLeaveMeeting}
        onEndMeetingForAll={isHost ? handleEndMeetingForAll : undefined}
      />

      {/* Leave / End Meeting Confirmation Modal (Shown on Browser Back button or Leave trigger) */}
      {showLeaveConfirmModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#242430] border border-white/10 rounded-2xl max-w-sm w-full p-6 text-white shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-zoom-red mx-auto flex items-center justify-center">
              <LogOut className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Leave Meeting?</h3>
              <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                {isHost
                  ? "You are the meeting host. Would you like to end the meeting for everyone or just leave?"
                  : "Are you sure you want to leave this meeting?"}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {isHost && (
                <button
                  type="button"
                  onClick={async () => {
                    setShowLeaveConfirmModal(false);
                    await handleEndMeetingForAll();
                  }}
                  className="w-full py-2.5 rounded-lg bg-zoom-red hover:bg-zoom-red-hover text-white text-xs font-bold transition-colors shadow"
                >
                  End Meeting for All
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  setShowLeaveConfirmModal(false);
                  await handleLeaveMeeting();
                }}
                className="w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
              >
                Leave Meeting
              </button>

              <button
                type="button"
                onClick={() => setShowLeaveConfirmModal(false)}
                className="w-full py-2 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cancel / Stay in Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
