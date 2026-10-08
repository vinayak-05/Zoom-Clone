"use client";

import React, { useState } from "react";
import { X, Key, Shield, ArrowRight } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { loginWithOAuth, AuthUser } from "../../lib/auth";
import { useToast } from "../ui/Toast";

interface OAuthModalProps {
  isOpen: boolean;
  provider: "google" | "microsoft" | "apple" | "sso" | null;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

export function OAuthModal({ isOpen, provider, onClose, onSuccess }: OAuthModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);

  if (!isOpen || !provider) return null;

  const handleSelectAccount = async (email: string, name: string) => {
    try {
      setLoading(true);
      const user = await loginWithOAuth(provider, email, name);
      showToast(`Connected via ${provider.toUpperCase()} as ${name}!`, "success");
      onSuccess(user);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OAuth connection failed";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    handleSelectAccount(customEmail.trim(), customName.trim() || customEmail.split("@")[0]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {provider === "google" && (
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            {provider === "microsoft" && (
              <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
                <span className="bg-[#F25022] w-2 h-2" />
                <span className="bg-[#7FBA00] w-2 h-2" />
                <span className="bg-[#00A4EF] w-2 h-2" />
                <span className="bg-[#FFB900] w-2 h-2" />
              </div>
            )}
            {provider === "apple" && (
              <svg className="w-6 h-6 fill-black" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.92.04-2.03.62-2.67 1.37-.56.64-.99 1.68-.86 2.7 1.03.08 2-.47 2.61-1.22z" />
              </svg>
            )}
            {provider === "sso" && <Key className="w-6 h-6 text-[#0B5CFF]" />}

            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                Sign in with {provider === "sso" ? "SSO" : provider.charAt(0).toUpperCase() + provider.slice(1)}
              </h3>
              <p className="text-[11px] text-gray-500">to continue to Zoom</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Account Selector List */}
        {!showCustomForm ? (
          <div className="p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-600 px-2 mb-1">Choose an account</p>

            {/* Account 1: Guest */}
            <button
              onClick={() => handleSelectAccount("guest@zoomclone.com", "Guest")}
              disabled={loading}
              className="w-full p-2.5 rounded-xl hover:bg-gray-50 border border-gray-100 flex items-center gap-3 transition-colors text-left group cursor-pointer"
            >
              <Avatar name="Guest" size="sm" />
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-gray-900 group-hover:text-[#0B5CFF] transition-colors">
                  Guest
                </p>
                <p className="text-[11px] text-gray-500 truncate">guest@zoomclone.com</p>
              </div>
            </button>

            {/* Account 2: Sarah Connor */}
            <button
              onClick={() => handleSelectAccount("sarah.c@techcorp.io", "Sarah Connor")}
              disabled={loading}
              className="w-full p-2.5 rounded-xl hover:bg-gray-50 border border-gray-100 flex items-center gap-3 transition-colors text-left group cursor-pointer"
            >
              <Avatar name="Sarah Connor" size="sm" />
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-gray-900 group-hover:text-[#0B5CFF] transition-colors">
                  Sarah Connor
                </p>
                <p className="text-[11px] text-gray-500 truncate">sarah.c@techcorp.io</p>
              </div>
            </button>

            {/* Use Another Account Button */}
            <button
              onClick={() => setShowCustomForm(true)}
              className="w-full p-2.5 text-xs text-[#0B5CFF] font-semibold hover:bg-blue-50/50 rounded-xl transition-colors text-left flex items-center justify-between"
            >
              <span>Use another account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="p-5 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Full Name"
                className="w-full h-9 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B5CFF]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                {provider.toUpperCase()} Email Address
              </label>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-9 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B5CFF]"
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="flex-1 h-8 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-8 text-xs font-semibold text-white bg-[#0B5CFF] hover:bg-[#0845BF] rounded-lg transition-colors cursor-pointer"
              >
                {loading ? "Connecting..." : "Continue"}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-green-600" />
            Secure authentication
          </span>
          <span>Zoom Privacy</span>
        </div>
      </div>
    </div>
  );
}
