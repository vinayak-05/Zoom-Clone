"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";
import type { ChatMessage } from "../../lib/types";
import { formatTime } from "../../lib/utils";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  currentParticipantId?: number;
}

export function ChatPanel({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  currentParticipantId,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  return (
    <div className="w-80 sm:w-88 bg-white border-l border-zoom-border flex flex-col h-full z-40 select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-zoom-border flex items-center justify-between">
        <h3 className="font-bold text-sm text-zoom-text">In-Meeting Chat</h3>
        <button
          onClick={onClose}
          className="p-1 text-zoom-muted hover:text-zoom-text rounded hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-xs text-zoom-muted">
            No chat messages yet. Say hello to everyone!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentParticipantId === msg.participant_id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[11px] text-zoom-muted">
                  <span className="font-bold text-zoom-text">
                    {isMe ? "Me" : msg.sender_name}
                  </span>
                  <span>•</span>
                  <span>{formatTime(msg.created_at)}</span>
                </div>
                <div
                  className={`p-2.5 rounded-zoom text-xs max-w-[85%] break-words ${
                    isMe
                      ? "bg-zoom-blue text-white"
                      : "bg-gray-100 text-zoom-text border border-zoom-border"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-zoom-border bg-gray-50 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Type message to everyone..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 h-9 px-3 rounded border border-zoom-border bg-white text-xs text-zoom-text focus:outline-none focus:border-zoom-blue"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded bg-zoom-blue hover:bg-zoom-blue-hover disabled:opacity-40 text-white transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
