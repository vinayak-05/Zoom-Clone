"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  HelpCircle,
  Bell,
  Settings,
  ChevronDown,
  User,
  LogOut,
  Video,
  Plus,
  Calendar,
} from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { DEFAULT_USER } from "../../lib/constants";
import { useToast } from "../ui/Toast";

interface NavbarProps {
  onOpenJoinModal?: () => void;
  onStartInstantMeeting?: () => void;
}

export function Navbar({ onOpenJoinModal, onStartInstantMeeting }: NavbarProps) {
  const { showToast } = useToast();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHostDropdownOpen, setIsHostDropdownOpen] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-zoom-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Left: Brand Logo + Primary Nav */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-1.5 focus:outline-none">
          <span className="text-2xl font-black tracking-tight text-zoom-blue">
            zoom
          </span>
        </Link>

        {/* Desktop Category Links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-zoom-text">
          <button
            onClick={() => showToast("Products catalog coming soon", "info")}
            className="hover:text-zoom-blue transition-colors flex items-center gap-1"
          >
            Products
          </button>
          <button
            onClick={() => showToast("Solutions overview coming soon", "info")}
            className="hover:text-zoom-blue transition-colors flex items-center gap-1"
          >
            Solutions
          </button>
          <button
            onClick={() => showToast("Resources coming soon", "info")}
            className="hover:text-zoom-blue transition-colors flex items-center gap-1"
          >
            Resources
          </button>
          <button
            onClick={() => showToast("Plans & Pricing coming soon", "info")}
            className="hover:text-zoom-blue transition-colors"
          >
            Plans & Pricing
          </button>
        </nav>
      </div>

      {/* Right: Actions, Search, Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick Action Links matching Zoom header */}
        <div className="hidden md:flex items-center gap-3 text-sm font-semibold">
          <Link
            href="/meetings/schedule"
            className="text-zoom-text hover:text-zoom-blue px-2.5 py-1.5 transition-colors"
          >
            Schedule
          </Link>
          <button
            onClick={onOpenJoinModal}
            className="text-zoom-text hover:text-zoom-blue px-2.5 py-1.5 transition-colors"
          >
            Join
          </button>

          {/* Host Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsHostDropdownOpen(!isHostDropdownOpen)}
              className="text-zoom-text hover:text-zoom-blue px-2.5 py-1.5 flex items-center gap-1 transition-colors"
            >
              Host
              <ChevronDown className="w-3.5 h-3.5 text-zoom-muted" />
            </button>

            {isHostDropdownOpen && (
              <div
                className="absolute right-0 mt-1 w-48 bg-white rounded-zoom shadow-zoom-card border border-zoom-border py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setIsHostDropdownOpen(false)}
              >
                <button
                  onClick={onStartInstantMeeting}
                  className="w-full text-left px-4 py-2 text-xs sm:text-sm text-zoom-text hover:bg-gray-50 flex items-center gap-2"
                >
                  <Video className="w-4 h-4 text-zoom-orange" />
                  With Video On
                </button>
                <button
                  onClick={onStartInstantMeeting}
                  className="w-full text-left px-4 py-2 text-xs sm:text-sm text-zoom-text hover:bg-gray-50 flex items-center gap-2"
                >
                  <Video className="w-4 h-4 text-zoom-muted" />
                  With Video Off
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden sm:flex items-center relative">
          <Search className="w-4 h-4 absolute left-3 text-zoom-muted" />
          <input
            type="text"
            placeholder="Search"
            className="h-8 pl-9 pr-3 w-36 lg:w-48 bg-gray-100 hover:bg-gray-200/70 focus:bg-white text-xs rounded-full border border-transparent focus:border-zoom-blue focus:outline-none transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter") showToast("Search coming soon", "info");
            }}
          />
        </div>

        {/* Icon Utilities */}
        <div className="flex items-center gap-1 sm:gap-2 text-zoom-muted">
          <button
            onClick={() => showToast("Support documentation available at zoom.us", "info")}
            className="p-1.5 hover:text-zoom-text hover:bg-gray-100 rounded-full transition-colors"
            title="Support"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => showToast("No new notifications", "info")}
            className="p-1.5 hover:text-zoom-text hover:bg-gray-100 rounded-full transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 bg-zoom-blue rounded-full absolute top-1 right-1" />
          </button>
          <button
            onClick={() => showToast("Settings opened", "info")}
            className="p-1.5 hover:text-zoom-text hover:bg-gray-100 rounded-full transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Avatar Dropdown */}
        <div className="relative ml-1">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-1.5 focus:outline-none"
            aria-label="User profile menu"
          >
            <Avatar name={DEFAULT_USER.name} size="sm" isOnline={true} />
            <ChevronDown className="w-3 h-3 text-zoom-muted hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white rounded-zoom shadow-zoom-card border border-zoom-border py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              onClick={() => setIsProfileOpen(false)}
            >
              <div className="px-4 py-2 border-b border-zoom-border flex items-center gap-3">
                <Avatar name={DEFAULT_USER.name} size="md" isOnline={true} />
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-zoom-text truncate">
                    {DEFAULT_USER.name}
                  </p>
                  <p className="text-xs text-zoom-muted truncate">
                    {DEFAULT_USER.email}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-zoom-blue">
                    Licensed Host
                  </span>
                </div>
              </div>

              <div className="py-1">
                <div className="px-4 py-1.5 text-xs text-zoom-muted">
                  Personal Meeting ID (PMI)
                  <p className="text-sm font-semibold text-zoom-text font-mono">
                    {DEFAULT_USER.personal_meeting_id.slice(0, 3)}{" "}
                    {DEFAULT_USER.personal_meeting_id.slice(3, 7)}{" "}
                    {DEFAULT_USER.personal_meeting_id.slice(7)}
                  </p>
                </div>
              </div>

              <div className="border-t border-zoom-border pt-1">
                <button
                  onClick={() => showToast("Profile settings coming soon", "info")}
                  className="w-full text-left px-4 py-2 text-xs sm:text-sm text-zoom-text hover:bg-gray-50 flex items-center gap-2.5"
                >
                  <User className="w-4 h-4 text-zoom-muted" />
                  My Profile
                </button>
                <button
                  onClick={() => showToast("Host is permanently authenticated in demo", "info")}
                  className="w-full text-left px-4 py-2 text-xs sm:text-sm text-zoom-red hover:bg-red-50 flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out (Vinayak)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
