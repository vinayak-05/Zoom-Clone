"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Star,
  Edit2,
  Copy,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  User,
  Settings as SettingsIcon,
  Globe,
  Clock,
  Calendar,
  Key,
} from "lucide-react";
import { Navbar } from "../../components/layout/Navbar";
import { Avatar } from "../../components/ui/Avatar";
import { DEFAULT_USER } from "../../lib/constants";
import { useToast } from "../../components/ui/Toast";
import { getStoredUser, setStoredUser, AuthUser } from "../../lib/auth";

export default function ProfilePage() {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<AuthUser>(DEFAULT_USER as AuthUser);
  const [isAccountOpen, setIsAccountOpen] = useState(true);
  const [showHostKey, setShowHostKey] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [userName, setUserName] = useState(DEFAULT_USER.name);
  const [tempName, setTempName] = useState(DEFAULT_USER.name);
  const [isEditingPasscode, setIsEditingPasscode] = useState(false);
  const [pmiPasscode, setPmiPasscode] = useState("123456");
  const [tempPasscode, setTempPasscode] = useState("123456");

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setCurrentUser(stored);
      setUserName(stored.name);
      setTempName(stored.name);
    }
    const storedPasscode = localStorage.getItem("zoom_pmi_passcode");
    if (storedPasscode) {
      setPmiPasscode(storedPasscode);
      setTempPasscode(storedPasscode);
    }
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, "success");
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    const updated = { ...currentUser, name: tempName.trim() };
    setCurrentUser(updated);
    setUserName(tempName.trim());
    setStoredUser(updated);
    setIsEditingName(false);
    showToast("Profile name updated successfully", "success");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none">
      {/* Top Dual-tier Navbar matching Zoom */}
      <Navbar />

      <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 py-6 flex flex-col md:flex-row gap-8">
        {/* Left Column: Account Sidebar */}
        <aside className="w-full md:w-56 flex-shrink-0 space-y-4">
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

          {/* My Account */}
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
                  className="block py-1.5 px-2.5 -ml-2.5 rounded-lg bg-[#EAF2FF] text-[#0B5CFF] font-semibold transition-colors"
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="block py-1.5 text-[#232333] hover:text-[#0B5CFF] transition-colors"
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

          {/* Upgrade to Pro Button */}
          <div className="pt-6">
            <button
              onClick={() => showToast("Opening Upgrade to Pro plans...", "info")}
              className="w-full py-2 px-3 rounded-full border border-[#00B4D8] text-[#0077B6] bg-[#E8F8FA] hover:bg-[#D4F3F7] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Star className="w-3.5 h-3.5 fill-[#0077B6] text-[#0077B6]" />
              <span>Upgrade to Pro</span>
            </button>
          </div>
        </aside>

        {/* Right Main Content: Profile Details */}
        <main className="flex-1 space-y-6 pb-20">
          {/* Top User Overview Card */}
          <div className="bg-white rounded-2xl border border-[#E5E9F0] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Signature Orange circle with White "V" */}
              <div className="relative group cursor-pointer">
                <Avatar
                  name={userName}
                  size="xl"
                  className="shadow-sm ring-4 ring-orange-50"
                />
                <button
                  onClick={() => showToast("Photo upload dialog opened", "info")}
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold"
                >
                  Change
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-[#1C1C28]">{userName}</h1>
                  <button
                    onClick={() => {
                      setTempName(userName);
                      setIsEditingName(true);
                    }}
                    className="p-1 text-gray-400 hover:text-[#0B5CFF] transition-colors"
                    title="Edit Name"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{currentUser.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0B5CFF]">
                    {currentUser.plan || "Basic"} Account
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">Capacity: 100 participants</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => showToast("Opening checkout for Zoom Pro Licensed plan...", "info")}
              className="py-2 px-5 rounded-full bg-[#0B5CFF] hover:bg-[#0845BF] text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              Upgrade Account
            </button>
          </div>

          {/* Edit Name Modal */}
          {isEditingName && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Display Name</h3>
                <form onSubmit={handleSaveName} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#0B5CFF]"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm text-white bg-[#0B5CFF] hover:bg-[#0845BF] rounded-lg transition-colors font-medium"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Personal Information Card */}
          <div className="bg-white rounded-2xl border border-[#E5E9F0] p-6 space-y-5">
            <h2 className="text-base font-bold text-[#1C1C28] border-b border-[#F0F2F6] pb-3">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-xs text-gray-500 font-medium">Display Name</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{userName}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium">Sign-In Email</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{currentUser.email}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium">Account Number</p>
                <p className="text-sm font-mono font-semibold text-gray-900 mt-1">
                  {currentUser.account_no || "109823411"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium">Department & Role</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">Engineering • Host</p>
              </div>
            </div>
          </div>

          {/* Meeting Settings Card */}
          <div className="bg-white rounded-2xl border border-[#E5E9F0] p-6 space-y-5">
            <h2 className="text-base font-bold text-[#1C1C28] border-b border-[#F0F2F6] pb-3">
              Meeting Information
            </h2>

            <div className="space-y-4 text-sm">
              {/* PMI */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#F0F2F6]">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Personal Meeting ID (PMI)</p>
                  <p className="text-base font-bold font-mono text-gray-900 mt-0.5">
                    {(currentUser.personal_meeting_id || "5001234567").slice(0, 3)}{" "}
                    {(currentUser.personal_meeting_id || "5001234567").slice(3, 7)}{" "}
                    {(currentUser.personal_meeting_id || "5001234567").slice(7)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(currentUser.personal_meeting_id || "5001234567", "PMI")}
                    className="text-xs text-[#0B5CFF] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy ID
                  </button>
                  <Link
                    href={`/meeting/${currentUser.personal_meeting_id || "5001234567"}`}
                    className="text-xs bg-blue-50 text-[#0B5CFF] hover:bg-blue-100 font-semibold px-3 py-1.5 rounded-full transition-colors"
                  >
                    Start Room
                  </Link>
                </div>
              </div>

              {/* Personal Meeting Passcode */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#F0F2F6]">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Personal Meeting Passcode</p>
                  {isEditingPasscode ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={tempPasscode}
                        onChange={(e) => setTempPasscode(e.target.value)}
                        className="text-xs font-mono border border-gray-300 rounded-lg px-2.5 py-1 w-32 uppercase focus:outline-none focus:border-[#0B5CFF]"
                        maxLength={10}
                      />
                      <button
                        onClick={() => {
                          setPmiPasscode(tempPasscode.trim().toUpperCase() || "123456");
                          localStorage.setItem("zoom_pmi_passcode", tempPasscode.trim().toUpperCase() || "123456");
                          setIsEditingPasscode(false);
                          showToast("PMI Passcode updated successfully", "success");
                        }}
                        className="text-xs bg-[#0B5CFF] hover:bg-[#0845BF] text-white px-3 py-1 rounded-lg font-semibold transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setTempPasscode(pmiPasscode);
                          setIsEditingPasscode(false);
                        }}
                        className="text-xs text-gray-500 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-mono font-semibold text-gray-900 mt-0.5">
                      {pmiPasscode}
                    </p>
                  )}
                </div>
                {!isEditingPasscode && (
                  <button
                    onClick={() => {
                      setTempPasscode(pmiPasscode);
                      setIsEditingPasscode(true);
                    }}
                    className="text-xs text-[#0B5CFF] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
              </div>

              {/* Personal Link */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#F0F2F6]">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Personal Meeting URL</p>
                  <p className="text-xs font-mono text-gray-800 mt-0.5 break-all">
                    http://localhost:3000/join/{currentUser.personal_meeting_id || "5001234567"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      `http://localhost:3000/join/${currentUser.personal_meeting_id || "5001234567"}`,
                      "Meeting link"
                    )
                  }
                  className="text-xs text-[#0B5CFF] hover:underline font-semibold flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Link
                </button>
              </div>

              {/* Host Key */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Host Key</p>
                  <p className="text-sm font-mono font-semibold text-gray-900 mt-0.5">
                    {showHostKey ? "482910" : "••••••"}
                  </p>
                </div>
                <button
                  onClick={() => setShowHostKey(!showHostKey)}
                  className="text-xs text-[#0B5CFF] hover:underline font-semibold flex items-center gap-1"
                >
                  {showHostKey ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Show
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="bg-white rounded-2xl border border-[#E5E9F0] p-6 space-y-5">
            <h2 className="text-base font-bold text-[#1C1C28] border-b border-[#F0F2F6] pb-3">
              Account Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Language</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">English (US)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Time Zone</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    (GMT+5:30) India Standard Time
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Date Format</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">mm/dd/yyyy</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
