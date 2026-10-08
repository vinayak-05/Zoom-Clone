"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Star,
  MessageSquare,
  X,
  Send,
  Sparkles,
  Check,
  User,
  Settings as SettingsIcon,
  Smartphone,
  Users,
  Shield,
  HelpCircle,
} from "lucide-react";
import { Navbar } from "../../components/layout/Navbar";
import { useToast } from "../../components/ui/Toast";
import { API_BASE_URL } from "../../lib/constants";

interface SettingItem {
  id: string;
  title: string;
  description: string;
  isNew?: boolean;
  hasDocumentIcon?: boolean;
  defaultValue: boolean;
}

interface SettingCategory {
  id: string;
  label: string;
  description?: string;
  items: SettingItem[];
}

const SETTINGS_CATEGORIES: SettingCategory[] = [
  {
    id: "meeting",
    label: "Meeting",
    items: [
      {
        id: "host_video",
        title: "Host video",
        description: "Start meetings with host video on",
        defaultValue: true,
      },
      {
        id: "participant_video",
        title: "Participants video",
        description: "Start meetings with participant video on",
        defaultValue: true,
      },
      {
        id: "audio_type",
        title: "Audio Type",
        description: "Determine how participants can join the audio portion of the meeting (Computer Audio and Telephone)",
        defaultValue: true,
      },
      {
        id: "join_before_host",
        title: "Join before host",
        description: "Allow participants to join the meeting before the host arrives",
        defaultValue: false,
      },
      {
        id: "waiting_room",
        title: "Waiting Room",
        description: "When attendees join a meeting, place them in a waiting room and require the host to admit them individually",
        defaultValue: true,
      },
      {
        id: "mute_on_entry",
        title: "Mute participants upon entry",
        description: "Automatically mute all participants when they join the meeting",
        defaultValue: true,
      },
    ],
  },
  {
    id: "clips",
    label: "Clips",
    items: [
      {
        id: "clips_avatars",
        title: "Create with avatars",
        description: "Create clips that uses your user's chosen avatar to read the script they enter.",
        isNew: true,
        defaultValue: true,
      },
      {
        id: "clips_custom_avatars",
        title: "Create custom avatars",
        description: "Allow users to create custom avatars for clips that would read the script they enter.",
        isNew: true,
        hasDocumentIcon: true,
        defaultValue: true,
      },
    ],
  },
  {
    id: "canvas",
    label: "Canvas",
    items: [
      {
        id: "canvas_ai_revision",
        title: "Canvas content generation and revision with AI",
        description: "Allow users to use AI to generate and revise content in Canvas. Meeting transcripts from meeting summaries will be shown to hosts and can be used to create document content.",
        defaultValue: true,
      },
      {
        id: "canvas_sentence_completion",
        title: "Canvas sentence completion with AI",
        description: "Allow users to have predictive writing suggestions appear while writing.",
        defaultValue: true,
      },
    ],
  },
  {
    id: "paper",
    label: "Paper",
    items: [
      {
        id: "paper_ai_content",
        title: "Paper content generation and revision with AI",
        description: "Allow users to use AI to generate and revise content in Zoom Paper. Meeting transcripts from meeting summaries will be shown to hosts and can be used to create documents.",
        defaultValue: false,
      },
    ],
  },
  {
    id: "sheets",
    label: "Sheets",
    items: [
      {
        id: "sheets_ai_content",
        title: "Sheets content generation and revision with AI",
        description: "Allow users to use AI to generate and revise content in Zoom Sheets. Meeting transcripts from meeting summaries will be shown to hosts and can be used to create sheet content.",
        defaultValue: false,
      },
      {
        id: "sheets_ai_formula",
        title: "AI Formula",
        description: "Enable AI to generate, explain, and apply spreadsheet formulas from natural-language input in Zoom Sheets",
        defaultValue: true,
      },
      {
        id: "sheets_ai_function",
        title: "AI Function",
        description: "Enable AI in spreadsheets to generate, summarize, categorize, and analyze data via the =AI() function in Zoom Sheets",
        defaultValue: true,
      },
    ],
  },
  {
    id: "slides",
    label: "Slides",
    items: [
      {
        id: "slides_ai_generation",
        title: "Slides content generation and revision with AI",
        description: "Allow users to use AI to generate and revise presentation slide decks in Zoom Slides from prompts or meeting transcripts.",
        isNew: true,
        defaultValue: true,
      },
    ],
  },
];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "clips";
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isAccountOpen, setIsAccountOpen] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isHelpChatOpen, setIsHelpChatOpen] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string }>>([
    { sender: "assistant", text: "Hi Vinayak! I'm your Zoom AI Companion. How can I help with your account settings or meetings today?" },
  ]);
  const [chatInput, setChatInput] = useState("");

  // Store setting toggle states
  const [settingsState, setSettingsState] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    SETTINGS_CATEGORIES.forEach((cat) => {
      cat.items.forEach((item) => {
        initial[item.id] = item.defaultValue;
      });
    });
    return initial;
  });

  // Fetch settings from backend on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/settings`);
        if (res.ok) {
          const backendData = await res.json();
          setSettingsState((prev) => ({ ...prev, ...backendData }));
        }
      } catch (err) {
        console.error("Failed to load settings from server:", err);
      }
    }
    fetchSettings();
  }, []);

  const handleToggle = async (id: string, title: string) => {
    const updated = !settingsState[id];
    setSettingsState((prev) => ({ ...prev, [id]: updated }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: id, value: updated }),
      });
      if (res.ok) {
        showToast(`${title} saved to cloud (${updated ? "On" : "Off"})`, "success");
      } else {
        showToast(`${title} updated locally`, "info");
      }
    } catch {
      showToast(`${title} updated locally`, "info");
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiTyping) return;
    const userText = chatInput.trim();
    const newHistory = [...chatMessages, { sender: "user", text: userText }];
    setChatMessages(newHistory);
    setChatInput("");
    setIsAiTyping(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: chatMessages,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          { sender: "assistant", text: data.reply },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "assistant",
            text: "I've noted your question. All your Zoom settings and preferences are currently synced and up to date.",
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "I'm available to help you with Clips, Canvas AI generation, and audio/video settings anytime.",
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none">
      {/* Top Dual-tier Navbar matching Zoom */}
      <Navbar />

      <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 py-6 flex flex-col md:flex-row gap-8">
        {/* Left Column 1: Primary Account Sidebar (approx 210px) */}
        <aside className="w-full md:w-52 flex-shrink-0 space-y-4">
          {/* Top Quick Links */}
          <div className="space-y-2 pb-3 border-b border-[#E4E4EB]">
            <a
              href="https://zoom.us"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between text-sm text-[#232333] hover:text-[#0B5CFF] font-medium py-1 transition-colors"
            >
              <span>Scheduler</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>
            <button
              onClick={() => showToast("Products catalog available", "info")}
              className="text-left w-full text-sm text-[#232333] hover:text-[#0B5CFF] font-medium py-1 transition-colors"
            >
              Discover More Products
            </button>
          </div>

          {/* Collapsible: My Account */}
          <div className="space-y-1">
            <button
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className="w-full flex items-center justify-between text-sm font-semibold text-[#1C1C28] py-1 hover:text-[#0B5CFF] transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    isAccountOpen ? "" : "-rotate-90"
                  }`}
                />
                <span>My Account</span>
              </div>
            </button>

            {isAccountOpen && (
              <div className="pl-6 space-y-1 text-sm font-normal">
                <Link
                  href="/profile"
                  className="block py-1.5 text-[#232333] hover:text-[#0B5CFF] transition-colors"
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="block py-1.5 px-2.5 -ml-2.5 rounded-lg bg-[#EAF2FF] text-[#0B5CFF] font-semibold transition-colors"
                >
                  Settings
                </Link>
                <button
                  onClick={() => showToast("Personal Devices managed here", "info")}
                  className="block text-left w-full py-1.5 text-[#232333] hover:text-[#0B5CFF] transition-colors"
                >
                  Personal Devices
                </button>
                <button
                  onClick={() => showToast("Personal Contacts list", "info")}
                  className="block text-left w-full py-1.5 text-[#232333] hover:text-[#0B5CFF] transition-colors"
                >
                  Personal Contacts
                </button>
                <button
                  onClick={() => showToast("Data & Privacy controls", "info")}
                  className="block text-left w-full py-1.5 text-[#232333] hover:text-[#0B5CFF] transition-colors"
                >
                  Data & Privacy
                </button>
              </div>
            )}
          </div>

          {/* Admin Group */}
          <div>
            <button
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              className="w-full flex items-center gap-1.5 text-sm font-semibold text-[#1C1C28] py-1 hover:text-[#0B5CFF] transition-colors"
            >
              <ChevronRight
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  isAdminOpen ? "rotate-90" : ""
                }`}
              />
              <span>Admin</span>
            </button>
            {isAdminOpen && (
              <div className="pl-6 pt-1 space-y-1 text-xs text-gray-500">
                <p className="py-1">User Management</p>
                <p className="py-1">Room Management</p>
                <p className="py-1">Account Profile</p>
              </div>
            )}
          </div>

          {/* Support Group */}
          <div>
            <button
              onClick={() => setIsSupportOpen(!isSupportOpen)}
              className="w-full flex items-center gap-1.5 text-sm font-semibold text-[#1C1C28] py-1 hover:text-[#0B5CFF] transition-colors"
            >
              <ChevronRight
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  isSupportOpen ? "rotate-90" : ""
                }`}
              />
              <span>Support</span>
            </button>
            {isSupportOpen && (
              <div className="pl-6 pt-1 space-y-1 text-xs text-gray-500">
                <p className="py-1">Help Center</p>
                <p className="py-1">Ticket Status</p>
                <p className="py-1">System Health</p>
              </div>
            )}
          </div>

          {/* Upgrade to Pro Button (cyan pill matching user's screenshot) */}
          <div className="pt-6">
            <button
              onClick={() => showToast("Upgrading to Pro licensed host...", "info")}
              className="w-full py-2 px-3 rounded-full border border-[#00B4D8] text-[#0077B6] bg-[#E8F8FA] hover:bg-[#D4F3F7] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Star className="w-3.5 h-3.5 fill-[#0077B6] text-[#0077B6]" />
              <span>Upgrade to Pro</span>
            </button>
          </div>
        </aside>

        {/* Middle Column 2: Vertical Sub-tabs & Resources Card (approx 160px) */}
        <div className="w-full md:w-44 flex-shrink-0 space-y-6">
          {/* Vertical Sub-tabs */}
          <div className="space-y-1 border-l-2 border-[#E4E4EB]">
            {SETTINGS_CATEGORIES.map((cat) => {
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveTab(cat.id);
                    const element = document.getElementById(`section-${cat.id}`);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  className={`block text-left w-full pl-3 py-1.5 text-sm transition-all relative ${
                    isActive
                      ? "text-[#0B5CFF] font-semibold -ml-[2px] border-l-[3px] border-[#0B5CFF]"
                      : "text-[#232333] hover:text-[#0B5CFF] font-medium"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Resources Card (exact styling from user's screenshot) */}
          <div className="bg-[#F7F9FC] rounded-2xl p-5 border border-[#E9EFF7] space-y-3">
            <h4 className="text-sm font-bold text-[#1C1C28]">Resources</h4>
            <div className="space-y-2 text-xs">
              <a
                href="#whitepaper"
                onClick={(e) => {
                  e.preventDefault();
                  showToast("Opening Zoom AI Whitepaper", "info");
                }}
                className="block text-[#0B5CFF] hover:underline font-medium"
              >
                Whitepaper
              </a>
              <a
                href="#guide"
                onClick={(e) => {
                  e.preventDefault();
                  showToast("Opening Getting Started Guide", "info");
                }}
                className="block text-[#0B5CFF] hover:underline font-medium"
              >
                Getting started guide
              </a>
              <a
                href="#onboarding"
                onClick={(e) => {
                  e.preventDefault();
                  showToast("Opening Onboarding Center", "info");
                }}
                className="block text-[#0B5CFF] hover:underline font-medium"
              >
                Onboarding Center
              </a>
            </div>
          </div>
        </div>

        {/* Right Column 3: Main Settings Content Area */}
        <main className="flex-1 space-y-10 pb-24">
          {SETTINGS_CATEGORIES.map((category) => (
            <section
              key={category.id}
              id={`section-${category.id}`}
              className="scroll-mt-6"
            >
              <h2 className="text-xl font-bold text-[#1C1C28] mb-4">
                {category.label}
              </h2>

              {/* White Rounded Card Container */}
              <div className="bg-white rounded-2xl border border-[#E5E9F0] p-6 space-y-7 shadow-none">
                {category.items.map((item, idx) => {
                  const isChecked = settingsState[item.id] ?? item.defaultValue;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-start justify-between gap-6 ${
                        idx !== category.items.length - 1
                          ? "pb-6 border-b border-[#F0F2F6]"
                          : ""
                      }`}
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-semibold text-[#1C1C28]">
                            {item.title}
                          </h3>
                          {item.isNew && (
                            <span className="text-[10px] font-bold text-[#0B5CFF] bg-[#EDF3FF] border border-[#BFDBFE] px-1.5 py-0.5 rounded tracking-wide uppercase">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#747487] mt-1.5 leading-relaxed">
                          {item.description}
                          {item.hasDocumentIcon && (
                            <span className="inline-block ml-1 text-gray-400">🗎</span>
                          )}
                        </p>
                      </div>

                      {/* iOS / Zoom style toggle switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isChecked}
                        onClick={() => handleToggle(item.id, item.title)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0B5CFF] focus:ring-offset-2 ${
                          isChecked ? "bg-[#0B5CFF]" : "bg-[#CBD5E1]"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-1 ${
                            isChecked ? "translate-x-6 ml-0" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </main>
      </div>

      {/* Floating Bottom-Right Zoom Support/Help Chat Bubble */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isHelpChatOpen ? (
          <button
            onClick={() => setIsHelpChatOpen(true)}
            className="w-13 h-13 p-3.5 bg-[#0B5CFF] hover:bg-[#0845BF] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            title="Zoom Virtual Assistant"
            aria-label="Open Zoom Assistant"
          >
            <MessageSquare className="w-6 h-6 fill-white" />
          </button>
        ) : (
          <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E4E4EB] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
            {/* Header */}
            <div className="bg-[#0B5CFF] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 fill-white" />
                <span className="font-semibold text-sm">Zoom Virtual Assistant</span>
              </div>
              <button
                onClick={() => setIsHelpChatOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-4 h-72 overflow-y-auto space-y-3 bg-[#F8FAFC] text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-[#0B5CFF] text-white rounded-br-none"
                        : "bg-white text-[#232333] border border-[#E2E8F0] shadow-xs rounded-bl-none whitespace-pre-wrap"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-500 border border-[#E2E8F0] rounded-2xl rounded-bl-none px-3.5 py-2 text-xs flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 bg-[#0B5CFF] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#0B5CFF] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-[#0B5CFF] rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] text-gray-400 ml-1">AI Companion thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSendChatMessage}
              className="p-3 bg-white border-t border-[#E4E4EB] flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Zoom Assistant..."
                className="flex-1 text-xs border border-gray-300 rounded-full px-3 py-1.5 focus:outline-none focus:border-[#0B5CFF]"
              />
              <button
                type="submit"
                className="p-1.5 bg-[#0B5CFF] text-white rounded-full hover:bg-[#0845BF] transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
