"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  HelpCircle,
  Bell,
  Settings,
  ChevronDown,
  User,
  LogOut,
  Video,
  Monitor,
  Sparkles,
  ShieldCheck,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { DEFAULT_USER } from "../../lib/constants";
import { useToast } from "../ui/Toast";
import { logoutUser, getStoredUser, AuthUser } from "../../lib/auth";

interface NavbarProps {
  onOpenJoinModal?: () => void;
  onStartInstantMeeting?: () => void;
}

export function Navbar({ onOpenJoinModal, onStartInstantMeeting }: NavbarProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<AuthUser>(DEFAULT_USER as AuthUser);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHostDropdownOpen, setIsHostDropdownOpen] = useState(false);
  const [isWebAppDropdownOpen, setIsWebAppDropdownOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setCurrentUser(stored);
  }, []);

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    await logoutUser();
    showToast("Signed out successfully", "info");
    router.push("/signin");
  };

  const profileRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const webAppRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (hostRef.current && !hostRef.current.contains(event.target as Node)) {
        setIsHostDropdownOpen(false);
      }
      if (webAppRef.current && !webAppRef.current.contains(event.target as Node)) {
        setIsWebAppDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-40 select-none">
      {/* Tier 1: Top Dark Utility Bar (exact match to Zoom portal) */}
      <div className="bg-[#0E121E] text-[#C4C7D4] text-[11px] font-normal px-4 sm:px-8 py-1.5 hidden md:flex items-center justify-end gap-5 border-b border-gray-800/40">
        <button
          onClick={() => showToast("Search Zoom products & help", "info")}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-white" />
          <span className="font-semibold text-white">Search</span>
        </button>
        <button
          onClick={() => showToast("Opening Zoom Support Center", "info")}
          className="hover:text-white transition-colors"
        >
          Support
        </button>
        <span className="hover:text-white transition-colors cursor-pointer font-medium">
          1.888.799.9666
        </span>
        <span className="text-gray-600">|</span>
        <button
          onClick={() => showToast("Contact Sales at sales@zoom.us", "info")}
          className="hover:text-white transition-colors"
        >
          Contact Sales
        </button>
        <button
          onClick={() => showToast("Demo requested successfully", "info")}
          className="hover:text-white transition-colors"
        >
          Request a Demo
        </button>
      </div>

      {/* Tier 2: Primary Zoom Navigation Bar */}
      <header className="h-14 bg-white border-b border-[#E4E4EB] px-4 sm:px-8 flex items-center justify-between">
        {/* Left: Brand Logo + Primary Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-1.5 focus:outline-none">
            <span className="text-2xl font-black tracking-tight text-[#0B5CFF] hover:opacity-90 transition-opacity">
              zoom
            </span>
          </Link>

          {/* Desktop Category Links */}
          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-[#232333]">
            <button
              onClick={() => showToast("Products catalog", "info")}
              className="hover:text-[#0B5CFF] transition-colors"
            >
              Products
            </button>
            <button
              onClick={() => showToast("Solutions overview", "info")}
              className="hover:text-[#0B5CFF] transition-colors"
            >
              Solutions
            </button>
            <button
              onClick={() => showToast("Resources directory", "info")}
              className="hover:text-[#0B5CFF] transition-colors"
            >
              Resources
            </button>
            <button
              onClick={() => showToast("Plans & Pricing", "info")}
              className="hover:text-[#0B5CFF] transition-colors"
            >
              Plans & Pricing
            </button>
          </nav>
        </div>

        {/* Right: Actions, Search, Web App, Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Quick Action Links */}
          <div className="hidden md:flex items-center gap-3 text-sm font-medium text-[#232333]">
            <Link
              href="/meetings/schedule"
              className="hover:text-[#0B5CFF] px-2 py-1 transition-colors"
            >
              Schedule
            </Link>
            <button
              onClick={onOpenJoinModal || (() => router.push("/join"))}
              className="hover:text-[#0B5CFF] px-2 py-1 transition-colors"
            >
              Join
            </button>

            {/* Host Dropdown */}
            <div className="relative" ref={hostRef}>
              <button
                onClick={() => setIsHostDropdownOpen(!isHostDropdownOpen)}
                className="hover:text-[#0B5CFF] px-2 py-1 flex items-center gap-1 transition-colors"
              >
                Host
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {isHostDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[#E4E4EB] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setIsHostDropdownOpen(false)}
                >
                  <button
                    onClick={onStartInstantMeeting || (() => router.push("/meeting/3829148201"))}
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-[#232333] hover:bg-gray-50 flex items-center gap-2.5"
                  >
                    <Video className="w-4 h-4 text-orange-500" />
                    With Video On
                  </button>
                  <button
                    onClick={onStartInstantMeeting || (() => router.push("/meeting/3829148201"))}
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-[#232333] hover:bg-gray-50 flex items-center gap-2.5"
                  >
                    <Video className="w-4 h-4 text-gray-400" />
                    With Video Off
                  </button>
                  <button
                    onClick={() => {
                      showToast("Starting Screen Share meeting...", "info");
                      if (onStartInstantMeeting) onStartInstantMeeting();
                    }}
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-[#232333] hover:bg-gray-50 flex items-center gap-2.5"
                  >
                    <Monitor className="w-4 h-4 text-blue-500" />
                    Screen Share Only
                  </button>
                </div>
              )}
            </div>

            {/* Web App Dropdown (as in user screenshot) */}
            <div className="relative" ref={webAppRef}>
              <button
                onClick={() => setIsWebAppDropdownOpen(!isWebAppDropdownOpen)}
                className="hover:text-[#0B5CFF] px-2 py-1 flex items-center gap-1 transition-colors"
              >
                Web App
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {isWebAppDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-[#E4E4EB] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setIsWebAppDropdownOpen(false)}
                >
                  <button
                    onClick={() => {
                      setIsWebAppDropdownOpen(false);
                      showToast("Active in Zoom Web Client", "info");
                    }}
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-[#232333] hover:bg-gray-50"
                  >
                    Open Zoom Web Client
                  </button>
                  <button
                    onClick={() => {
                      setIsWebAppDropdownOpen(false);
                      showToast("Zoom Desktop Client installer downloaded", "info");
                    }}
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-[#232333] hover:bg-gray-50"
                  >
                    Download Desktop Client
                  </button>
                  <button
                    onClick={() => {
                      setIsWebAppDropdownOpen(false);
                      showToast("Progressive Web App enabled", "info");
                    }}
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-[#232333] hover:bg-gray-50"
                  >
                    Install Zoom PWA
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Icon Utilities */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-gray-600">
            <button
              onClick={() => showToast("Zoom Help Center documentation", "info")}
              className="p-1.5 hover:text-[#0B5CFF] hover:bg-gray-100 rounded-full transition-colors hidden sm:block"
              title="Help & Support"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => showToast("No new notifications", "info")}
              className="p-1.5 hover:text-[#0B5CFF] hover:bg-gray-100 rounded-full transition-colors relative hidden sm:block"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 bg-[#0B5CFF] rounded-full absolute top-1 right-1" />
            </button>
            <Link
              href="/settings"
              className="p-1.5 hover:text-[#0B5CFF] hover:bg-gray-100 rounded-full transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>

          {currentUser.is_guest && (
            <Link
              href="/signin"
              className="hidden sm:inline-flex items-center px-3 py-1 text-xs font-semibold text-white bg-[#0B5CFF] hover:bg-[#0845BF] rounded-full transition-colors shadow-xs"
            >
              Sign In
            </Link>
          )}

          {/* Profile Avatar Dropdown */}
          <div className="relative ml-1" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-1 focus:outline-none rounded-full ring-2 ring-transparent hover:ring-blue-200 transition-all"
              aria-label="User account menu"
            >
              {/* Signature Zoom Burnt Orange circle with crisp white V */}
              <Avatar
                name={currentUser.name}
                size="sm"
                className="cursor-pointer shadow-sm hover:scale-105 transition-transform"
              />
            </button>

            {isProfileOpen && (
              <div
                className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-[#E4E4EB] py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setIsProfileOpen(false)}
              >
                {/* Account Header */}
                <div className="px-4 py-3 border-b border-[#E4E4EB] flex items-center gap-3 bg-gray-50/50">
                  <Avatar name={currentUser.name} size="md" />
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-[#1C1C28] truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {currentUser.email}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-[#0B5CFF]">
                        {currentUser.plan || "Basic"} Plan
                      </span>
                    </div>
                  </div>
                </div>

                {currentUser.is_guest ? (
                  <div className="p-3 bg-blue-50/70 border-b border-[#E4E4EB]">
                    <p className="text-xs text-gray-700 font-medium">Currently using Guest mode</p>
                    <div className="mt-2 flex gap-2">
                      <Link
                        href="/signin"
                        className="flex-1 py-1.5 text-center text-xs font-semibold text-white bg-[#0B5CFF] hover:bg-[#0845BF] rounded-lg transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/signup"
                        className="flex-1 py-1.5 text-center text-xs font-semibold text-[#0B5CFF] border border-[#0B5CFF] hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Upgrade Pro Banner */
                  <div className="p-3 border-b border-[#E4E4EB] bg-gradient-to-r from-blue-50/60 to-cyan-50/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-900">Upgrade to Pro</p>
                        <p className="text-[11px] text-gray-500">Host unlimited 30hr meetings</p>
                      </div>
                      <button
                        onClick={() => showToast("Upgrade to Pro checkout opened", "info")}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-[#0B5CFF] hover:bg-[#0845BF] rounded-full transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        Upgrade
                      </button>
                    </div>
                  </div>
                )}

                {/* PMI Info */}
                <div className="px-4 py-2.5 text-xs text-gray-500 border-b border-[#E4E4EB]">
                  <span className="block font-medium">Personal Meeting ID (PMI)</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-sm font-bold text-[#1C1C28] font-mono">
                      {(currentUser.personal_meeting_id || "5001234567").slice(0, 3)}{" "}
                      {(currentUser.personal_meeting_id || "5001234567").slice(3, 7)}{" "}
                      {(currentUser.personal_meeting_id || "5001234567").slice(7)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(currentUser.personal_meeting_id || "5001234567");
                        showToast("PMI copied to clipboard", "success");
                      }}
                      className="text-[11px] text-[#0B5CFF] hover:underline font-medium"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Navigation links */}
                <div className="py-1">
                  <Link
                    href="/profile"
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-[#232333] hover:bg-gray-50 flex items-center gap-2.5"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    My Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-[#232333] hover:bg-gray-50 flex items-center gap-2.5"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    Settings
                  </Link>
                  <Link
                    href="/settings?tab=devices"
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-[#232333] hover:bg-gray-50 flex items-center gap-2.5"
                  >
                    <Smartphone className="w-4 h-4 text-gray-400" />
                    Personal Devices
                  </Link>
                  <Link
                    href="/settings?tab=privacy"
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-[#232333] hover:bg-gray-50 flex items-center gap-2.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-gray-400" />
                    Data & Privacy
                  </Link>
                </div>

                {/* Footer Sign Out */}
                <div className="border-t border-[#E4E4EB] pt-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-medium cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out ({currentUser.name})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
