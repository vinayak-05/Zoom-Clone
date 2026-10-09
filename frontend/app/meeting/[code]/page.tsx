"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Search,
  Bell,
  Home,
  MessageSquare,
  Video as VideoIcon,
  Users,
  Settings as SettingsIcon,
  LogOut,
  X,
  Sparkles,
  Info,
  ExternalLink,
} from "lucide-react";
import { PreJoinScreen } from "../../../components/room/PreJoinScreen";
import { VideoGrid } from "../../../components/room/VideoGrid";
import { ControlBar } from "../../../components/room/ControlBar";
import { ParticipantsPanel } from "../../../components/room/ParticipantsPanel";
import { ChatPanel } from "../../../components/room/ChatPanel";
import { WhiteboardModal } from "../../../components/modals/WhiteboardModal";
import { InMeetingSettingsModal } from "../../../components/modals/InMeetingSettingsModal";
import { UpcomingMeetingsModal } from "../../../components/modals/UpcomingMeetingsModal";
import { ContactsModal } from "../../../components/modals/ContactsModal";
import { AdminCenterModal } from "../../../components/modals/AdminCenterModal";
import { UpgradeModal } from "../../../components/modals/UpgradeModal";
import { InviteModal } from "../../../components/modals/InviteModal";
import { useLocalMedia } from "../../../hooks/useLocalMedia";
import { useMeetingSocket } from "../../../hooks/useMeetingSocket";
import { useWebRTC } from "../../../hooks/useWebRTC";
import { api } from "../../../lib/api";
import { formatMeetingCode, formatTime, getInitials, getAvatarHexColor } from "../../../lib/utils";
import { DEFAULT_USER, API_BASE_URL, getApiBaseUrl } from "../../../lib/constants";
import { getStoredUser } from "../../../lib/auth";
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

  // Active Authenticated / Default User
  const [currentUser, setCurrentUser] = useState(() => {
    return getStoredUser();
  });

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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Floating Device Change Notification Banners (exact match to Screenshot 1)
  const [showMicBanner, setShowMicBanner] = useState(true);
  const [showSpeakerBanner, setShowSpeakerBanner] = useState(true);

  // In-Meeting Feature Modals
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"general" | "video" | "audio" | "share" | "background" | "captions" | "profile">("audio");
  const [isUpcomingOpen, setIsUpcomingOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Screenshot 2 Features: Captions & Stop Incoming Video
  const [isCaptionsActive, setIsCaptionsActive] = useState(false);
  const [liveCaptionText, setLiveCaptionText] = useState("");
  const [isIncomingVideoStopped, setIsIncomingVideoStopped] = useState(false);
  const recognitionRef = useRef<any>(null);

  // In-Meeting Real-time States
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Search input state in Workplace header
  const [searchQuery, setSearchQuery] = useState("");

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

    window.history.pushState({ inMeeting: true }, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState({ inMeeting: true }, "", window.location.href);
      setShowLeaveConfirmModal(true);
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      stopAllTracks();
      if (joinData?.participant?.id) {
        const base = getApiBaseUrl();
        if (base) {
          navigator.sendBeacon?.(
            `${base}/api/v1/meetings/code/${codeParam}/leave?participant_id=${joinData.participant.id}`
          );
        }
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

  // 3. Web Speech Recognition for Live Captions
  useEffect(() => {
    if (!isCaptionsActive) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      setLiveCaptionText("");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let current = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          if (current.trim()) {
            setLiveCaptionText(current);
          }
        };

        recognition.onerror = () => {
          setLiveCaptionText("Speaking in meeting... (Live Captions Active)");
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        setLiveCaptionText("Captions enabled: Audio transcription active");
      }
    } else {
      setLiveCaptionText("Captions enabled: Audio transcription active");
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, [isCaptionsActive]);

  // 4. Refresh Active Participants from Server
  const refreshParticipants = useCallback(async () => {
    if (!codeParam) return;
    try {
      const list = await api.getParticipants(codeParam);
      setParticipants(list);
    } catch (err) {
      console.warn("Error refreshing participants:", err);
    }
  }, [codeParam]);

  // Periodic active participant sync across all devices
  useEffect(() => {
    if (!hasJoined || !codeParam) return;
    refreshParticipants();
    const interval = setInterval(() => {
      refreshParticipants();
    }, 2500);
    return () => clearInterval(interval);
  }, [hasJoined, codeParam, refreshParticipants]);

  // 5. WebSocket Hooks & Handlers
  const currentParticipantId = joinData?.participant?.id || null;

  const handleRemoteChatMessage = useCallback(
    (msg: ChatMessage) => {
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
    },
    [currentParticipantId, isChatOpen]
  );

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

  const handleParticipantRemoved = useCallback(
    (targetId: number) => {
      if (targetId === currentParticipantId) {
        stopAllTracks();
        alert("You have been removed from the meeting by the host.");
        router.push("/");
      } else {
        setParticipants((prev) => prev.filter((p) => p.id !== targetId));
        showToast("A participant was removed.", "info");
      }
    },
    [currentParticipantId, stopAllTracks, router, showToast]
  );

  const handleMeetingEnded = useCallback(() => {
    stopAllTracks();
    alert("This meeting has been ended by the host.");
    router.push("/");
  }, [stopAllTracks, router]);

  const handleRemoteReaction = useCallback((reaction: string, senderId: number) => {
    setActiveReaction(reaction);
    setTimeout(() => setActiveReaction(null), 3000);
  }, []);

  // WebRTC Signaling Handlers Ref
  const webrtcHandlersRef = useRef<{
    initiateCall: (id: number) => void;
    handleOffer: (id: number, offer: RTCSessionDescriptionInit) => void;
    handleAnswer: (id: number, answer: RTCSessionDescriptionInit) => void;
    handleIceCandidate: (id: number, candidate: RTCIceCandidateInit) => void;
    removePeer: (id: number) => void;
  } | null>(null);

  const {
    sendChatMessage: socketSendChat,
    sendMuteAll: socketSendMuteAll,
    sendMuteParticipant: socketSendMute,
    sendRemoveParticipant: socketSendRemove,
    sendMeetingEnded: socketSendEnd,
    sendReaction: socketSendReaction,
    sendWebRtcOffer: socketSendWebRtcOffer,
    sendWebRtcAnswer: socketSendWebRtcAnswer,
    sendWebRtcIceCandidate: socketSendWebRtcIceCandidate,
  } = useMeetingSocket({
    meetingCode: codeParam,
    participantId: currentParticipantId,
    onParticipantJoined: (pid) => {
      refreshParticipants();
      webrtcHandlersRef.current?.initiateCall(pid);
      showToast("A new participant joined.", "info");
    },
    onParticipantLeft: (pid) => {
      webrtcHandlersRef.current?.removePeer(pid);
      setParticipants((prev) => prev.filter((p) => p.id !== pid));
    },
    onMutedByHost: handleMutedByHost,
    onParticipantMuted: handleParticipantMuted,
    onParticipantRemoved: handleParticipantRemoved,
    onMeetingEnded: handleMeetingEnded,
    onChatMessage: handleRemoteChatMessage,
    onReaction: handleRemoteReaction,
    onWebRtcOffer: (senderId, offer) => webrtcHandlersRef.current?.handleOffer(senderId, offer),
    onWebRtcAnswer: (senderId, answer) => webrtcHandlersRef.current?.handleAnswer(senderId, answer),
    onWebRtcIceCandidate: (senderId, candidate) => webrtcHandlersRef.current?.handleIceCandidate(senderId, candidate),
  });

  const {
    remoteStreams,
    initiateCall,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    removePeer,
  } = useWebRTC({
    currentParticipantId,
    localStream: isScreenSharing ? screenStream : localStream,
    sendWebRtcOffer: (targetId, offer) => socketSendWebRtcOffer(targetId, offer),
    sendWebRtcAnswer: (targetId, answer) => socketSendWebRtcAnswer(targetId, answer),
    sendWebRtcIceCandidate: (targetId, candidate) => socketSendWebRtcIceCandidate(targetId, candidate),
  });

  useEffect(() => {
    webrtcHandlersRef.current = {
      initiateCall,
      handleOffer,
      handleAnswer,
      handleIceCandidate,
      removePeer,
    };
  }, [initiateCall, handleOffer, handleAnswer, handleIceCandidate, removePeer]);

  // 6. Join Room Handler (called from PreJoinScreen)
  const handleJoinFromPreJoin = async (settings: {
    displayName: string;
    isMuted: boolean;
    isVideoOff: boolean;
    passcode?: string;
  }) => {
    setIsJoining(true);
    try {
      await startMedia({
        audio: !settings.isMuted,
        video: !settings.isVideoOff,
      });

      const activeUser = getStoredUser();
      const res = await api.joinMeeting(codeParam, {
        display_name: settings.displayName,
        user_id: activeUser && !activeUser.is_guest ? activeUser.id : null,
        passcode: settings.passcode,
        is_muted: settings.isMuted,
        is_video_off: settings.isVideoOff,
      });

      setJoinData(res);
      setHasJoined(true);

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

  // 7. Leave & End Actions
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

  // 8. Host Controls
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

  // 9. Chat Sending
  const handleSendMessage = async (content: string) => {
    if (!joinData?.participant?.id) return;
    try {
      const sent = await api.sendChatMessage(codeParam, {
        content,
        participant_id: joinData.participant.id,
      });
      socketSendChat(content, joinData.participant.display_name);
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
    } catch (err) {
      showToast("Failed to send message.", "error");
    }
  };

  // 10. Reactions & Hand Raise
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

  // 11. Copy Meeting Link
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

  // 12. Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // 13. Reset to default (Screenshot 2)
  const handleResetToDefault = () => {
    setIsCaptionsActive(false);
    setIsIncomingVideoStopped(false);
    setViewMode("gallery");
    showToast("Meeting audio and video preferences reset to default.", "success");
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
        meetingTitle={validation?.title || `${currentUser.name || "Vinayak Gupta"}'s Zoom Meeting`}
        meetingCode={codeParam}
        hostName={validation?.host_name || currentUser.name || "Host"}
        initialDisplayName={currentUser.name || DEFAULT_USER.name}
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
    displayName: joinData?.participant?.display_name || currentUser.name || DEFAULT_USER.name,
    stream: activeStream,
    isVideoOff,
    isMuted: isAudioMuted,
    isHandRaised,
    isHost,
    isLocal: true,
    reaction: activeReaction,
    isIncomingVideoStopped: false,
  };

  const currentParticipant = joinData?.participant;
  const remoteTiles: ParticipantTileData[] = participants
    .filter((p) => {
      if (currentParticipant?.id && p.id === currentParticipant.id) return false;
      return true;
    })
    .map((p) => ({
      id: p.id,
      displayName: p.display_name,
      stream: remoteStreams[Number(p.id)] || null,
      isVideoOff: p.is_video_off,
      isMuted: p.is_muted,
      isHandRaised: p.is_hand_raised,
      isHost: p.role === "host",
      isLocal: false,
      isIncomingVideoStopped,
    }));

  const allTiles: ParticipantTileData[] = [localTileData, ...remoteTiles];
  const meetingDisplayTitle = validation?.title || `${currentUser.name || "Vinayak Gupta"}'s Zoom Meeting`;
  const avatarLetter = (currentUser.name || "Vinayak").trim().charAt(0).toUpperCase();

  return (
    <div className="h-screen w-screen bg-[#111114] flex flex-col overflow-hidden select-none">
      {/* =========================================================================
          TIER 1: TOP ZOOM WORKPLACE HEADER (Screenshot 1 & 2 exact match)
          ========================================================================= */}
      <header className="h-12 bg-white border-b border-[#E5E7EB] px-3 sm:px-6 flex items-center justify-between z-30 flex-shrink-0 select-none">
        {/* Left: Brand + Navigation Arrows + History + Search Bar */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Zoom | Workplace brand */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-[#0B5CFF] tracking-tight hover:opacity-90 transition-opacity">
              zoom
            </span>
            <span className="text-gray-300 font-light text-lg">|</span>
            <span className="text-gray-800 font-medium text-sm hidden sm:inline">
              Workplace
            </span>
          </div>

          {/* History Nav < > */}
          <div className="hidden md:flex items-center gap-1 text-gray-500">
            <button
              onClick={() => showToast("Previous Workplace view", "info")}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => showToast("Forward Workplace view", "info")}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
              title="Forward"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                refreshParticipants();
                showToast("Refreshed meeting data", "info");
              }}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors ml-1"
              title="Refresh"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Box: Search Ctrl+K */}
          <div className="relative hidden lg:block">
            <div className="flex items-center gap-2 bg-[#F1F3F5] rounded-full px-3 py-1 w-60 xl:w-72 border border-transparent focus-within:border-[#0B5CFF] focus-within:bg-white transition-all">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search Ctrl+K"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-gray-800 placeholder-gray-400 focus:outline-none flex-1 font-normal"
              />
            </div>
          </div>
        </div>

        {/* Right: Admin Center, Download, Upgrade, Notifications, Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <button
            onClick={() => setIsAdminOpen(true)}
            className="text-xs font-semibold text-gray-700 hover:text-[#0B5CFF] transition-colors hidden md:inline"
          >
            Admin Center
          </button>

          <button
            onClick={() => showToast("Zoom Desktop Client installer started", "info")}
            className="text-xs font-semibold text-gray-700 hover:text-[#0B5CFF] transition-colors hidden sm:inline"
          >
            Download
          </button>

          {/* Blue Upgrade Pill Button */}
          <button
            onClick={() => setIsUpgradeOpen(true)}
            className="bg-[#0E71EB] hover:bg-[#0845BF] text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs transition-colors flex items-center gap-1"
          >
            <span>Upgrade</span>
          </button>

          {/* Bell Icon */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsProfileDropdownOpen(false);
              }}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 bg-[#0B5CFF] rounded-full absolute top-1 right-1" />
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50 text-xs animate-in fade-in">
                <div className="font-bold text-gray-900 pb-2 border-b border-gray-100 flex justify-between items-center">
                  <span>Notifications</span>
                  <span className="text-[10px] text-blue-600 cursor-pointer">Mark all read</span>
                </div>
                <div className="py-2 text-gray-600 space-y-1.5">
                  <p className="font-medium text-gray-800">Welcome to Zoom Workplace</p>
                  <p className="text-[11px] text-gray-500">Audio devices configured and ready.</p>
                </div>
              </div>
            )}
          </div>

          {/* Signature Burnt Orange Square Avatar (Screenshot 1 & 2) */}
          <div className="relative">
            <button
              onClick={() => {
                setIsProfileDropdownOpen(!isProfileDropdownOpen);
                setIsNotificationsOpen(false);
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#C43D1A] text-white font-bold text-sm flex items-center justify-center shadow-xs hover:scale-105 transition-transform"
              title={currentUser.name}
            >
              {avatarLetter}
            </button>

            {/* Profile Dropdown */}
            {isProfileDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50 text-xs animate-in fade-in zoom-in-95"
                onClick={() => setIsProfileDropdownOpen(false)}
              >
                <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-lg bg-[#C43D1A] text-white font-bold flex items-center justify-center text-base">
                    {avatarLetter}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-gray-900 truncate">{currentUser.name || "Vinayak Gupta"}</p>
                    <p className="text-[11px] text-gray-500 truncate">{currentUser.email || "vinayak@zoomclone.com"}</p>
                  </div>
                </div>

                <div className="py-2 space-y-1 text-gray-700">
                  <div className="px-2 py-1 text-[11px] text-gray-500 flex justify-between">
                    <span>Status:</span>
                    <span className="text-green-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> In Meeting
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSettingsTab("profile");
                      setIsSettingsOpen(true);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-100 font-medium"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setSettingsTab("audio");
                      setIsSettingsOpen(true);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-100 font-medium"
                  >
                    Settings
                  </button>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setShowLeaveConfirmModal(true)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-red-600 hover:bg-red-50 font-semibold"
                  >
                    Leave Meeting
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          BODY: LEFT SIDEBAR RAIL + IN-MEETING VIEWPORT
          ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Vertical Sidebar Rail (Screenshot 1 & 2) */}
        <aside className="w-14 sm:w-16 bg-white border-r border-[#E5E7EB] flex flex-col justify-between items-center py-3 select-none flex-shrink-0 z-20">
          {/* Top Rail Navigation Icons */}
          <div className="flex flex-col items-center gap-4 w-full">
            <button
              onClick={() => {
                if (confirm("Leave current meeting to return to Home?")) {
                  handleLeaveMeeting();
                }
              }}
              className="flex flex-col items-center gap-1 text-gray-600 hover:text-[#0B5CFF] group w-full py-1"
              title="Home"
            >
              <Home className="w-5 h-5 text-gray-600 group-hover:text-[#0B5CFF] transition-colors" />
              <span className="text-[10px] font-medium leading-none">Home</span>
            </button>

            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`flex flex-col items-center gap-1 group w-full py-1 transition-colors ${
                isChatOpen ? "text-[#0B5CFF]" : "text-gray-600 hover:text-[#0B5CFF]"
              }`}
              title="Chat"
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5 transition-colors" />
                {unreadChatCount > 0 && !isChatOpen && (
                  <span className="w-2 h-2 bg-orange-500 rounded-full absolute -top-0.5 -right-0.5" />
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">Chat</span>
            </button>

            <button
              onClick={() => setIsUpcomingOpen(true)}
              className="flex flex-col items-center gap-1 text-gray-600 hover:text-[#0B5CFF] group w-full py-1"
              title="Meetings"
            >
              <VideoIcon className="w-5 h-5 text-gray-600 group-hover:text-[#0B5CFF] transition-colors" />
              <span className="text-[10px] font-medium leading-none">Meetings</span>
            </button>

            <button
              onClick={() => setIsContactsOpen(true)}
              className="flex flex-col items-center gap-1 text-gray-600 hover:text-[#0B5CFF] group w-full py-1"
              title="Contacts"
            >
              <Users className="w-5 h-5 text-gray-600 group-hover:text-[#0B5CFF] transition-colors" />
              <span className="text-[10px] font-medium leading-none">Contacts</span>
            </button>
          </div>

          {/* Bottom Settings Gear Icon */}
          <div className="w-full flex justify-center">
            <button
              onClick={() => {
                setSettingsTab("audio");
                setIsSettingsOpen(true);
              }}
              className="flex flex-col items-center gap-1 text-gray-600 hover:text-[#0B5CFF] group w-full py-1"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5 text-gray-600 group-hover:text-[#0B5CFF] transition-colors" />
              <span className="text-[10px] font-medium leading-none">Settings</span>
            </button>
          </div>
        </aside>

        {/* Center / Right: Main In-Meeting Stage Viewport */}
        <div className="flex-1 flex flex-col bg-[#111116] overflow-hidden relative">
          {/* Top In-Meeting Bar: Title, Security, Fullscreen */}
          <div className="h-10 bg-[#111116] border-b border-white/5 px-4 flex items-center justify-between text-white z-20 flex-shrink-0">
            {/* Left: (i) {User}'s Zoom Meeting info button */}
            <div className="relative">
              <button
                onClick={() => setIsInfoOpen(!isInfoOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 text-gray-200 hover:text-white transition-colors"
                title="Meeting Information"
              >
                <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-[10px] font-serif font-bold text-gray-300">
                  i
                </div>
                <span className="font-semibold text-xs sm:text-sm truncate max-w-[200px] sm:max-w-md">
                  {meetingDisplayTitle}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {/* Real Zoom Meeting Info Popover */}
              {isInfoOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-80 bg-[#1E1E26] rounded-2xl border border-white/15 shadow-2xl p-4 text-xs space-y-3 z-50 text-white animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-bold text-sm">Meeting Information</span>
                    <span className="text-[10px] text-green-400 font-semibold bg-green-950/60 border border-green-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Encrypted
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400">Meeting ID:</span>
                    <p className="font-mono font-bold text-white text-base">
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
                      {validation?.host_name || currentUser.name || "Host"}
                    </p>
                  </div>

                  <button
                    onClick={handleCopyMeetingLink}
                    className="w-full bg-[#0B5CFF] hover:bg-[#0845BF] py-2 rounded-xl font-bold text-white flex items-center justify-center gap-1.5 transition-colors mt-2 shadow-xs"
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

            {/* Right: Green Shield + View Mode + Fullscreen */}
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center cursor-help"
                title="Enhanced encryption active"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>

              {/* View Mode Toggle */}
              <button
                onClick={() => setViewMode(viewMode === "gallery" ? "speaker" : "gallery")}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs text-gray-200 transition-colors"
                title="Change View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline capitalize">{viewMode} View</span>
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Floating Audio Device Notification Banners (Screenshot 1 Exact Match) */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 max-w-xl w-[92%] pointer-events-none">
            {showMicBanner && (
              <div className="pointer-events-auto bg-[#18181D]/90 backdrop-blur-md border border-white/15 text-gray-200 text-xs px-4 py-2 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 w-full">
                <span className="leading-snug">
                  Your default microphone has changed to Default - Microphone Array (Intel® Smart Sound Technology for Digital Microphones) and will now be used.
                </span>
                <button
                  onClick={() => setShowMicBanner(false)}
                  className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  title="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {showSpeakerBanner && (
              <div className="pointer-events-auto bg-[#18181D]/90 backdrop-blur-md border border-white/15 text-gray-200 text-xs px-4 py-2 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 w-full">
                <span className="leading-snug">
                  Your default speaker has changed to Default - Speakers (Realtek(R) Audio) and will now be used.
                </span>
                <button
                  onClick={() => setShowSpeakerBanner(false)}
                  className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  title="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Stage Area: Video Grid & Drawers */}
          <div className="flex-1 flex overflow-hidden relative">
            <VideoGrid participants={allTiles} viewMode={viewMode} />

            {/* Live Captions Subtitle Overlay */}
            {isCaptionsActive && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 max-w-2xl w-[90%] bg-black/85 backdrop-blur-md text-white text-xs sm:text-sm px-4 py-2.5 rounded-2xl border border-white/20 shadow-2xl text-center animate-in fade-in">
                <span className="text-[#0B5CFF] font-bold mr-2">[CC] {currentUser.name || "Vinayak Gupta"}:</span>
                <span className="text-gray-200 italic">
                  {liveCaptionText || "Speaking into meeting audio... (Live Automated Transcription)"}
                </span>
              </div>
            )}

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
            isCaptionsActive={isCaptionsActive}
            isIncomingVideoStopped={isIncomingVideoStopped}
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
            onToggleCaptions={() => {
              const next = !isCaptionsActive;
              setIsCaptionsActive(next);
              showToast(next ? "Live automated captions enabled" : "Captions hidden", "info");
            }}
            onToggleStopIncomingVideo={() => {
              const next = !isIncomingVideoStopped;
              setIsIncomingVideoStopped(next);
              showToast(next ? "Stopped incoming video (bandwidth saver mode)" : "Resumed incoming video", "info");
            }}
            onResetToDefault={handleResetToDefault}
            onOpenWhiteboard={() => setIsWhiteboardOpen(true)}
            onOpenSettings={(tab) => {
              setSettingsTab(tab || "audio");
              setIsSettingsOpen(true);
            }}
            onOpenAudioTest={() => {
              setSettingsTab("audio");
              setIsSettingsOpen(true);
            }}
            onOpenVirtualBackground={() => {
              setSettingsTab("background");
              setIsSettingsOpen(true);
            }}
            onOpenInvite={() => setIsInviteOpen(true)}
            onSendReaction={handleSendReaction}
            onLeaveMeeting={handleLeaveMeeting}
            onEndMeetingForAll={isHost ? handleEndMeetingForAll : undefined}
            onMuteAll={isHost ? handleMuteAll : undefined}
          />
        </div>
      </div>

      {/* =========================================================================
          MODALS & OVERLAYS
          ========================================================================= */}
      {/* 1. Whiteboard Modal */}
      <WhiteboardModal
        isOpen={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
      />

      {/* 2. In-Meeting Settings Modal */}
      <InMeetingSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsTab}
      />

      {/* 3. Upcoming Meetings Modal */}
      <UpcomingMeetingsModal
        isOpen={isUpcomingOpen}
        onClose={() => setIsUpcomingOpen(false)}
        onSelectMeeting={(code) => {
          if (confirm(`Switch to meeting ${code}?`)) {
            router.push(`/meeting/${code}`);
          }
        }}
      />

      {/* 4. Contacts Modal */}
      <ContactsModal
        isOpen={isContactsOpen}
        onClose={() => setIsContactsOpen(false)}
        onInviteContact={(contactName) => {
          showToast(`Invitation sent to ${contactName}`, "success");
        }}
      />

      {/* 5. Admin Center Modal */}
      <AdminCenterModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* 6. Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
      />

      {/* 7. Invite Modal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title={meetingDisplayTitle}
        meetingCode={codeParam}
        passcode={validation?.passcode}
        inviteLink={`http://localhost:3000/join/${codeParam}${validation?.passcode ? `?pwd=${validation.passcode}` : ""}`}
      />

      {/* 8. Leave Confirmation Modal */}
      {showLeaveConfirmModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in select-none">
          <div className="bg-[#1E1E26] border border-white/10 rounded-2xl max-w-sm w-full p-6 text-white shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-[#E11D48] mx-auto flex items-center justify-center">
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
                  className="w-full py-2.5 rounded-xl bg-[#E11D48] hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
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
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
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
