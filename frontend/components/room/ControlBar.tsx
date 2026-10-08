"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ChevronUp,
  Users,
  MessageSquare,
  Share2,
  Heart,
  Hand,
  MoreHorizontal,
  X,
  ShieldAlert,
  Sliders,
  Check,
  Subtitles,
  Settings,
  EyeOff,
  Eye,
  PenTool,
  Copy,
  UserPlus,
  Volume2,
  Lock,
  RotateCcw,
} from "lucide-react";
import { cn } from "../../lib/utils";

export interface ControlBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  participantCount: number;
  unreadChatCount: number;
  isParticipantsOpen: boolean;
  isChatOpen: boolean;
  isHost: boolean;
  isCaptionsActive: boolean;
  isIncomingVideoStopped: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHandRaise: () => void;
  onToggleParticipants: () => void;
  onToggleChat: () => void;
  onToggleCaptions: () => void;
  onToggleStopIncomingVideo: () => void;
  onResetToDefault: () => void;
  onOpenWhiteboard: () => void;
  onOpenSettings: (tab?: "general" | "video" | "audio" | "share" | "background" | "captions") => void;
  onOpenAudioTest: () => void;
  onOpenVirtualBackground: () => void;
  onOpenInvite: () => void;
  onSendReaction: (reaction: string) => void;
  onLeaveMeeting: () => void;
  onEndMeetingForAll?: () => void;
  onMuteAll?: () => void;
}

export function ControlBar({
  isMuted,
  isVideoOff,
  isScreenSharing,
  isHandRaised,
  participantCount,
  unreadChatCount,
  isParticipantsOpen,
  isChatOpen,
  isHost,
  isCaptionsActive,
  isIncomingVideoStopped,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHandRaise,
  onToggleParticipants,
  onToggleChat,
  onToggleCaptions,
  onToggleStopIncomingVideo,
  onResetToDefault,
  onOpenWhiteboard,
  onOpenSettings,
  onOpenAudioTest,
  onOpenVirtualBackground,
  onOpenInvite,
  onSendReaction,
  onLeaveMeeting,
  onEndMeetingForAll,
  onMuteAll,
}: ControlBarProps) {
  // Popover menus state
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showVideoMenu, setShowVideoMenu] = useState(false);
  const [showParticipantsMenu, setShowParticipantsMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showHostTools, setShowHostTools] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  // Host Tools toggles
  const [isLocked, setIsLocked] = useState(false);
  const [isWaitingRoom, setIsWaitingRoom] = useState(true);
  const [allowShareScreen, setAllowShareScreen] = useState(true);
  const [allowChat, setAllowChat] = useState(true);
  const [allowRename, setAllowRename] = useState(true);
  const [allowUnmute, setAllowUnmute] = useState(true);
  const [allowStartVideo, setAllowStartVideo] = useState(true);

  // Selected devices
  const [selectedMic, setSelectedMic] = useState("default");
  const [selectedSpeaker, setSelectedSpeaker] = useState("default");
  const [selectedCamera, setSelectedCamera] = useState("integrated");
  const [shareMode, setShareMode] = useState<"one" | "multiple">("one");

  const reactions = ["👏", "👍", "❤️", "😂", "😮", "🎉"];

  // Close menus on click outside
  const barRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setShowAudioMenu(false);
        setShowVideoMenu(false);
        setShowParticipantsMenu(false);
        setShowReactions(false);
        setShowShareMenu(false);
        setShowHostTools(false);
        setShowMoreMenu(false);
        setShowEndModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <footer
      ref={barRef}
      className="h-[68px] bg-[#111114] border-t border-white/10 px-2 sm:px-4 flex items-center justify-between select-none relative z-30"
    >
      {/* 1. Left Controls: Unmute & Video */}
      <div className="flex items-center gap-1">
        {/* Unmute / Mute */}
        <div className="relative">
          <div className="flex items-center rounded-lg hover:bg-white/10 transition-colors p-1">
            <button
              onClick={onToggleAudio}
              className="flex flex-col items-center gap-0.5 px-2 py-0.5 text-white focus:outline-none"
              title={isMuted ? "Unmute (Alt+A)" : "Mute (Alt+A)"}
            >
              <div className="relative">
                {isMuted ? (
                  <MicOff className="w-5 h-5 text-[#E11D48]" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </div>
              <span className={cn("text-[11px] font-medium leading-none", isMuted ? "text-gray-300" : "text-white")}>
                {isMuted ? "Unmute" : "Mute"}
              </span>
            </button>

            <button
              onClick={() => {
                setShowAudioMenu(!showAudioMenu);
                setShowVideoMenu(false);
                setShowMoreMenu(false);
              }}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Select a Microphone"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Audio Dropdown Popover */}
          {showAudioMenu && (
            <div className="absolute left-0 bottom-full mb-3 w-80 bg-[#1E1E26] rounded-xl border border-white/10 shadow-2xl p-2 z-50 text-white text-xs space-y-1 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Select a Microphone
              </div>
              <button
                onClick={() => setSelectedMic("default")}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-gray-200"
              >
                <span className="truncate pr-2">
                  Default - Microphone Array (Intel® Smart Sound Technology)
                </span>
                {selectedMic === "default" && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
              </button>
              <button
                onClick={() => setSelectedMic("comm")}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-gray-200"
              >
                <span className="truncate pr-2">
                  Communications - Microphone Array (Intel® Smart Sound)
                </span>
                {selectedMic === "comm" && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
              </button>

              <div className="h-px bg-white/10 my-1" />

              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Select a Speaker
              </div>
              <button
                onClick={() => setSelectedSpeaker("default")}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-gray-200"
              >
                <span className="truncate pr-2">
                  Default - Speakers (Realtek(R) Audio)
                </span>
                {selectedSpeaker === "default" && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
              </button>
              <button
                onClick={() => setSelectedSpeaker("comm")}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-gray-200"
              >
                <span className="truncate pr-2">
                  Communications - Speakers (Realtek(R) Audio)
                </span>
                {selectedSpeaker === "comm" && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
              </button>

              <div className="h-px bg-white/10 my-1" />

              <button
                onClick={() => {
                  setShowAudioMenu(false);
                  onOpenAudioTest();
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-gray-200"
              >
                Test Speaker & Microphone...
              </button>
              <button
                onClick={() => {
                  setShowAudioMenu(false);
                  onToggleAudio();
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-gray-200"
              >
                Leave Computer Audio
              </button>

              <div className="h-px bg-white/10 my-1" />

              <button
                onClick={() => {
                  setShowAudioMenu(false);
                  onOpenSettings("audio");
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-gray-200 font-semibold"
              >
                Audio Settings...
              </button>
            </div>
          )}
        </div>

        {/* Video Start/Stop */}
        <div className="relative">
          <div className="flex items-center rounded-lg hover:bg-white/10 transition-colors p-1">
            <button
              onClick={onToggleVideo}
              className="flex flex-col items-center gap-0.5 px-2 py-0.5 text-white focus:outline-none"
              title={isVideoOff ? "Start Video (Alt+V)" : "Stop Video (Alt+V)"}
            >
              <div className="relative">
                {isVideoOff ? (
                  <VideoOff className="w-5 h-5 text-[#E11D48]" />
                ) : (
                  <Video className="w-5 h-5 text-white" />
                )}
              </div>
              <span className={cn("text-[11px] font-medium leading-none", isVideoOff ? "text-gray-300" : "text-white")}>
                Video
              </span>
            </button>

            <button
              onClick={() => {
                setShowVideoMenu(!showVideoMenu);
                setShowAudioMenu(false);
                setShowMoreMenu(false);
              }}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Select a Camera"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Video Dropdown Popover */}
          {showVideoMenu && (
            <div className="absolute left-0 bottom-full mb-3 w-72 bg-[#1E1E26] rounded-xl border border-white/10 shadow-2xl p-2 z-50 text-white text-xs space-y-1 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Select a Camera
              </div>
              <button
                onClick={() => setSelectedCamera("integrated")}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-gray-200"
              >
                <span className="truncate pr-2">Integrated Camera (04f2:b61e)</span>
                {selectedCamera === "integrated" && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
              </button>

              <div className="h-px bg-white/10 my-1" />

              <button
                onClick={() => {
                  setShowVideoMenu(false);
                  onOpenVirtualBackground();
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-gray-200"
              >
                Choose Virtual Background...
              </button>
              <button
                onClick={() => {
                  setShowVideoMenu(false);
                  onOpenSettings("video");
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-gray-200 font-semibold"
              >
                Video Settings...
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Center Action Cluster: Participants, Chat, React, Share, Host tools, Whiteboards, More */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Participants */}
        <div className="relative">
          <button
            onClick={onToggleParticipants}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-white hover:bg-white/10 transition-colors relative",
              isParticipantsOpen && "bg-white/20"
            )}
            title="Participants"
          >
            <div className="relative flex items-center">
              <Users className="w-5 h-5 text-gray-200" />
              <span className="ml-1 text-[11px] font-bold text-gray-200 flex items-center">
                {participantCount}
                <ChevronUp className="w-3 h-3 text-gray-400 ml-0.5" />
              </span>
            </div>
            <span className="text-[11px] text-gray-300 font-medium leading-none">
              Participants
            </span>
          </button>
        </div>

        {/* Chat */}
        <button
          onClick={onToggleChat}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-white hover:bg-white/10 transition-colors relative",
            isChatOpen && "bg-white/20"
          )}
          title="Chat"
        >
          <div className="relative flex items-center">
            <MessageSquare className="w-5 h-5 text-gray-200" />
            <ChevronUp className="w-3 h-3 text-gray-400 ml-0.5" />
            {unreadChatCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-2 bg-zoom-orange text-[10px] font-bold px-1.5 rounded-full text-white animate-pulse">
                {unreadChatCount}
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-300 font-medium leading-none">
            Chat
          </span>
        </button>

        {/* React */}
        <div className="relative">
          <button
            onClick={() => {
              setShowReactions(!showReactions);
              setShowMoreMenu(false);
              setShowHostTools(false);
            }}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-white hover:bg-white/10 transition-colors",
              (showReactions || isHandRaised) && "bg-white/20"
            )}
            title="Reactions"
          >
            <Heart className={cn("w-5 h-5", isHandRaised ? "text-yellow-400 fill-current" : "text-gray-200")} />
            <span className="text-[11px] text-gray-300 font-medium leading-none">
              React
            </span>
          </button>

          {/* Reactions Floating Bar */}
          {showReactions && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#1E1E26] rounded-2xl p-2.5 flex flex-col gap-2 shadow-2xl border border-white/10 z-50 animate-in fade-in zoom-in-90 duration-150 w-64">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Reactions
                </span>
                <span className="text-[10px] text-gray-400">Click to react</span>
              </div>
              <div className="flex items-center justify-around py-1">
                {reactions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onSendReaction(emoji);
                      setShowReactions(false);
                    }}
                    className="text-2xl hover:scale-130 transition-transform p-1 rounded-lg hover:bg-white/10"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="h-px bg-white/10 my-0.5" />

              <button
                onClick={() => {
                  onToggleHandRaise();
                  setShowReactions(false);
                }}
                className={`w-full py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-colors ${
                  isHandRaised
                    ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <Hand className={`w-4 h-4 ${isHandRaised ? "fill-current" : ""}`} />
                <span>{isHandRaised ? "Lower Hand" : "Raise Hand"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Share */}
        <div className="relative">
          <div className="flex items-center rounded-lg hover:bg-white/10 transition-colors">
            <button
              onClick={onToggleScreenShare}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2.5 py-1.5 focus:outline-none transition-colors",
                isScreenSharing ? "text-[#E11D48]" : "text-white"
              )}
              title="Share Screen"
            >
              <div className="relative flex items-center">
                <div className="w-5 h-5 rounded border-2 border-white/90 flex items-center justify-center">
                  <ChevronUp className="w-3.5 h-3.5 text-white stroke-[3]" />
                </div>
                <ChevronUp className="w-3 h-3 text-gray-400 ml-1" />
              </div>
              <span className="text-[11px] font-medium leading-none text-gray-300">
                {isScreenSharing ? "Stop Share" : "Share"}
              </span>
            </button>
          </div>
        </div>

        {/* Host tools */}
        <div className="relative">
          <button
            onClick={() => {
              setShowHostTools(!showHostTools);
              setShowMoreMenu(false);
              setShowReactions(false);
            }}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-white hover:bg-white/10 transition-colors",
              showHostTools && "bg-white/20"
            )}
            title="Host tools"
          >
            <ShieldAlert className="w-5 h-5 text-gray-200" />
            <span className="text-[11px] text-gray-300 font-medium leading-none">
              Host tools
            </span>
          </button>

          {/* Host Tools / Security Menu */}
          {showHostTools && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-72 bg-[#1E1E26] rounded-xl border border-white/10 shadow-2xl p-2.5 z-50 text-white text-xs space-y-1.5 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Meeting Security Controls
              </div>

              <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
                <span>Lock Meeting</span>
                <input
                  type="checkbox"
                  checked={isLocked}
                  onChange={(e) => setIsLocked(e.target.checked)}
                  className="accent-[#0B5CFF]"
                />
              </label>

              <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
                <span>Enable Waiting Room</span>
                <input
                  type="checkbox"
                  checked={isWaitingRoom}
                  onChange={(e) => setIsWaitingRoom(e.target.checked)}
                  className="accent-[#0B5CFF]"
                />
              </label>

              <div className="h-px bg-white/10 my-1" />

              <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Allow participants to:
              </div>

              <label className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/10 cursor-pointer">
                <span>Share Screen</span>
                <input
                  type="checkbox"
                  checked={allowShareScreen}
                  onChange={(e) => setAllowShareScreen(e.target.checked)}
                  className="accent-[#0B5CFF]"
                />
              </label>

              <label className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/10 cursor-pointer">
                <span>Chat</span>
                <input
                  type="checkbox"
                  checked={allowChat}
                  onChange={(e) => setAllowChat(e.target.checked)}
                  className="accent-[#0B5CFF]"
                />
              </label>

              <label className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/10 cursor-pointer">
                <span>Rename Themselves</span>
                <input
                  type="checkbox"
                  checked={allowRename}
                  onChange={(e) => setAllowRename(e.target.checked)}
                  className="accent-[#0B5CFF]"
                />
              </label>

              <label className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/10 cursor-pointer">
                <span>Unmute Themselves</span>
                <input
                  type="checkbox"
                  checked={allowUnmute}
                  onChange={(e) => setAllowUnmute(e.target.checked)}
                  className="accent-[#0B5CFF]"
                />
              </label>

              <label className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/10 cursor-pointer">
                <span>Start Video</span>
                <input
                  type="checkbox"
                  checked={allowStartVideo}
                  onChange={(e) => setAllowStartVideo(e.target.checked)}
                  className="accent-[#0B5CFF]"
                />
              </label>

              <div className="h-px bg-white/10 my-1" />

              <button
                onClick={() => {
                  onMuteAll?.();
                  setShowHostTools(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-semibold text-gray-200 transition-colors"
              >
                Mute All Participants
              </button>
            </div>
          )}
        </div>

        {/* Whiteboards */}
        <button
          onClick={onOpenWhiteboard}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-white hover:bg-white/10 transition-colors"
          title="Whiteboards"
        >
          <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center p-0.5">
            <PenTool className="w-3.5 h-3.5 text-gray-200" />
          </div>
          <span className="text-[11px] text-gray-300 font-medium leading-none">
            Whiteboards
          </span>
        </button>

        {/* More (...) -> EXACT MATCH TO SCREENSHOT 2 */}
        <div className="relative">
          <button
            onClick={() => {
              setShowMoreMenu(!showMoreMenu);
              setShowHostTools(false);
              setShowReactions(false);
              setShowAudioMenu(false);
              setShowVideoMenu(false);
            }}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-white hover:bg-white/10 transition-colors",
              showMoreMenu && "bg-white/20"
            )}
            title="More"
          >
            <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
              <span className="text-[10px] font-bold tracking-widest text-gray-200 leading-none mb-1">...</span>
            </div>
            <span className="text-[11px] text-gray-300 font-medium leading-none">
              More
            </span>
          </button>

          {/* Screenshot 2 Exact Menu Popover */}
          {showMoreMenu && (
            <div
              className="absolute right-0 bottom-full mb-3 bg-[#111116] rounded-2xl border border-white/15 shadow-2xl p-4 z-50 text-white min-w-[280px] sm:min-w-[320px] animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Row: 3 Action Cards matching Screenshot 2 */}
              <div className="grid grid-cols-3 gap-2 text-center pb-4">
                {/* 1. Show Captions */}
                <button
                  onClick={() => {
                    onToggleCaptions();
                    setShowMoreMenu(false);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl hover:bg-white/10 transition-colors group",
                    isCaptionsActive && "bg-white/15"
                  )}
                >
                  <div className="w-7 h-7 flex items-center justify-center rounded text-gray-200 group-hover:text-white">
                    <Subtitles className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium leading-tight text-gray-300">
                    {isCaptionsActive ? "Hide Captions" : "Show Captions"}
                  </span>
                </button>

                {/* 2. Settings */}
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenSettings();
                  }}
                  className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                >
                  <div className="w-7 h-7 flex items-center justify-center rounded text-gray-200 group-hover:text-white">
                    <Settings className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium leading-tight text-gray-300">
                    Settings
                  </span>
                </button>

                {/* 3. Stop Incoming Video */}
                <button
                  onClick={() => {
                    onToggleStopIncomingVideo();
                    setShowMoreMenu(false);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl hover:bg-white/10 transition-colors group",
                    isIncomingVideoStopped && "bg-white/15"
                  )}
                >
                  <div className="w-7 h-7 flex items-center justify-center rounded text-gray-200 group-hover:text-white">
                    {isIncomingVideoStopped ? (
                      <Eye className="w-5 h-5 text-blue-400" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-[11px] font-medium leading-tight text-gray-300">
                    {isIncomingVideoStopped ? "Start Incoming Video" : "Stop Incoming Video"}
                  </span>
                </button>
              </div>

              {/* Bottom Section: Reset to default matching Screenshot 2 */}
              <div className="border-t border-white/10 pt-3 flex items-center justify-center gap-2 text-xs">
                <span className="text-gray-400">Reset to default</span>
                <button
                  onClick={() => {
                    onResetToDefault();
                    setShowMoreMenu(false);
                  }}
                  className="text-[#0B5CFF] hover:text-blue-400 font-semibold hover:underline"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Right: End / Leave Button matching Screenshot 1 & 2 */}
      <div className="relative">
        <button
          onClick={() => setShowEndModal(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-[#E11D48] hover:opacity-85 transition-opacity"
          title={isHost ? "End Meeting" : "Leave Meeting"}
        >
          <div className="w-5 h-5 rounded-md bg-[#E11D48] flex items-center justify-center text-white shadow-xs">
            <X className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-[11px] font-bold text-[#E11D48] leading-none">
            End
          </span>
        </button>

        {/* Leave/End Confirmation Dialog */}
        {showEndModal && (
          <div className="absolute right-0 bottom-full mb-3 w-64 bg-[#1E1E26] rounded-2xl border border-white/10 shadow-2xl p-2.5 z-50 text-white animate-in fade-in zoom-in-95">
            {isHost ? (
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    setShowEndModal(false);
                    onEndMeetingForAll?.();
                  }}
                  className="w-full text-center py-2 px-3 rounded-xl bg-[#E11D48] hover:bg-red-700 text-xs font-bold transition-colors shadow-xs"
                >
                  End Meeting for All
                </button>
                <button
                  onClick={() => {
                    setShowEndModal(false);
                    onLeaveMeeting();
                  }}
                  className="w-full text-center py-2 px-3 rounded-xl hover:bg-white/10 text-xs font-semibold transition-colors"
                >
                  Leave Meeting
                </button>
                <button
                  onClick={() => setShowEndModal(false)}
                  className="w-full text-center py-1 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    setShowEndModal(false);
                    onLeaveMeeting();
                  }}
                  className="w-full text-center py-2 px-3 rounded-xl bg-[#E11D48] hover:bg-red-700 text-xs font-bold transition-colors shadow-xs"
                >
                  Leave Meeting
                </button>
                <button
                  onClick={() => setShowEndModal(false)}
                  className="w-full text-center py-1 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </footer>
  );
}
