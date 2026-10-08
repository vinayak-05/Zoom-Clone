"use client";

import React, { useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ChevronUp,
  Shield,
  Users,
  MessageSquare,
  Share2,
  Smile,
  Hand,
  MoreHorizontal,
  LogOut,
  StopCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface ControlBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  participantCount: number;
  unreadChatCount: number;
  isParticipantsOpen: boolean;
  isChatOpen: boolean;
  isHost: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHandRaise: () => void;
  onToggleParticipants: () => void;
  onToggleChat: () => void;
  onSendReaction: (reaction: string) => void;
  onLeaveMeeting: () => void;
  onEndMeetingForAll?: () => void;
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
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHandRaise,
  onToggleParticipants,
  onToggleChat,
  onSendReaction,
  onLeaveMeeting,
  onEndMeetingForAll,
}: ControlBarProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  const reactions = ["👏", "👍", "❤️", "😂", "😮", "🎉"];

  return (
    <footer className="h-18 bg-zoom-dark-bar border-t border-white/10 px-2 sm:px-6 flex items-center justify-between select-none relative z-30">
      {/* Left Utilities: Audio & Video */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Audio Mute/Unmute */}
        <div className="flex items-center rounded hover:bg-white/10 transition-colors p-1 group">
          <button
            onClick={onToggleAudio}
            className="flex flex-col items-center gap-0.5 px-2 py-1 text-white focus:outline-none"
            title={isMuted ? "Unmute (Alt+A)" : "Mute (Alt+A)"}
          >
            {isMuted ? (
              <MicOff className="w-5 h-5 text-zoom-red" />
            ) : (
              <Mic className="w-5 h-5 text-white" />
            )}
            <span className="text-[10px] text-gray-300 font-medium">
              {isMuted ? "Unmute" : "Mute"}
            </span>
          </button>
          <button
            onClick={onToggleAudio}
            className="p-1 text-gray-400 hover:text-white"
            title="Audio settings"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Video Start/Stop */}
        <div className="flex items-center rounded hover:bg-white/10 transition-colors p-1 group">
          <button
            onClick={onToggleVideo}
            className="flex flex-col items-center gap-0.5 px-2 py-1 text-white focus:outline-none"
            title={isVideoOff ? "Start Video (Alt+V)" : "Stop Video (Alt+V)"}
          >
            {isVideoOff ? (
              <VideoOff className="w-5 h-5 text-zoom-red" />
            ) : (
              <Video className="w-5 h-5 text-white" />
            )}
            <span className="text-[10px] text-gray-300 font-medium">
              {isVideoOff ? "Start Video" : "Stop Video"}
            </span>
          </button>
          <button
            onClick={onToggleVideo}
            className="p-1 text-gray-400 hover:text-white"
            title="Video settings"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center Controls: Room Features */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Participants Toggle */}
        <button
          onClick={onToggleParticipants}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded text-white hover:bg-white/10 transition-colors relative",
            isParticipantsOpen && "bg-white/20"
          )}
          title="Participants"
        >
          <div className="relative">
            <Users className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-2 bg-zoom-blue text-[10px] font-bold px-1 rounded-full text-white">
              {participantCount}
            </span>
          </div>
          <span className="text-[10px] text-gray-300 font-medium">
            Participants
          </span>
        </button>

        {/* Chat Toggle */}
        <button
          onClick={onToggleChat}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded text-white hover:bg-white/10 transition-colors relative",
            isChatOpen && "bg-white/20"
          )}
          title="Chat"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {unreadChatCount > 0 && !isChatOpen && (
              <span className="absolute -top-1.5 -right-2 bg-zoom-orange text-[10px] font-bold px-1.5 rounded-full text-white animate-pulse">
                {unreadChatCount}
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-300 font-medium">Chat</span>
        </button>

        {/* Share Screen */}
        <button
          onClick={onToggleScreenShare}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded hover:bg-white/10 transition-colors",
            isScreenSharing ? "text-zoom-red" : "text-green-500"
          )}
          title="Share Screen"
        >
          {isScreenSharing ? (
            <StopCircle className="w-5 h-5 text-zoom-red" />
          ) : (
            <Share2 className="w-5 h-5 text-green-500" />
          )}
          <span className="text-[10px] font-medium text-gray-300">
            {isScreenSharing ? "Stop Share" : "Share"}
          </span>
        </button>

        {/* Reactions */}
        <div className="relative">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded text-white hover:bg-white/10 transition-colors"
            title="Reactions"
          >
            <Smile className="w-5 h-5 text-yellow-400" />
            <span className="text-[10px] text-gray-300 font-medium">
              Reactions
            </span>
          </button>

          {showReactions && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#2D2D3A] rounded-full p-2 flex items-center gap-2 shadow-2xl border border-white/10 z-50 animate-in fade-in zoom-in-90 duration-150">
              {reactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSendReaction(emoji);
                    setShowReactions(false);
                  }}
                  className="text-2xl hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Raise Hand */}
        <button
          onClick={onToggleHandRaise}
          className={cn(
            "hidden sm:flex flex-col items-center gap-0.5 px-3 py-1.5 rounded text-white hover:bg-white/10 transition-colors",
            isHandRaised && "bg-yellow-500/20 text-yellow-400"
          )}
          title="Raise Hand"
        >
          <Hand
            className={cn(
              "w-5 h-5",
              isHandRaised ? "text-yellow-400 fill-current" : "text-white"
            )}
          />
          <span className="text-[10px] text-gray-300 font-medium">
            {isHandRaised ? "Lower Hand" : "Raise Hand"}
          </span>
        </button>
      </div>

      {/* Right: Leave / End Meeting Button */}
      <div className="relative">
        <button
          onClick={() => setShowEndModal(true)}
          className="bg-zoom-red hover:bg-zoom-red-hover text-white px-4 py-1.5 rounded-zoom text-xs sm:text-sm font-bold shadow transition-colors flex items-center gap-1.5"
        >
          <span>{isHost ? "End" : "Leave"}</span>
        </button>

        {/* Leave/End Confirmation Dialog */}
        {showEndModal && (
          <div className="absolute right-0 bottom-full mb-3 w-60 bg-[#2D2D3A] rounded-zoom border border-white/10 shadow-2xl p-2 z-50 text-white animate-in fade-in zoom-in-95">
            {isHost ? (
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowEndModal(false);
                    onEndMeetingForAll?.();
                  }}
                  className="w-full text-left px-3 py-2 rounded bg-zoom-red hover:bg-zoom-red-hover text-xs font-bold transition-colors"
                >
                  End Meeting for All
                </button>
                <button
                  onClick={() => {
                    setShowEndModal(false);
                    onLeaveMeeting();
                  }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-white/10 text-xs font-medium transition-colors"
                >
                  Leave Meeting
                </button>
                <button
                  onClick={() => setShowEndModal(false)}
                  className="w-full text-center px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowEndModal(false);
                    onLeaveMeeting();
                  }}
                  className="w-full text-left px-3 py-2 rounded bg-zoom-red hover:bg-zoom-red-hover text-xs font-bold transition-colors"
                >
                  Leave Meeting
                </button>
                <button
                  onClick={() => setShowEndModal(false)}
                  className="w-full text-center px-3 py-1.5 text-xs text-gray-400 hover:text-white"
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
