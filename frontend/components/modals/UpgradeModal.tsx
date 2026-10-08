"use client";

import React from "react";
import { X, Check, Sparkles, Zap, Shield, ArrowRight } from "lucide-react";
import { useToast } from "../ui/Toast";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleUpgrade = (plan: string) => {
    showToast(`Upgraded to Zoom Workplace ${plan}!`, "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col text-gray-800">
        <div className="bg-gradient-to-r from-[#0B5CFF] to-[#0845BF] text-white p-6 relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="font-bold text-lg">Zoom Workplace Pro</span>
            </div>
            <p className="text-xs text-blue-100">
              Unlock unlimited group meetings, AI Companion, 5GB cloud recording, and premium whiteboards.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pro Plan */}
            <div className="border-2 border-[#0B5CFF] rounded-xl p-4 bg-blue-50/30 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-sm text-[#0B5CFF]">Pro Plan</h4>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">POPULAR</span>
                </div>
                <div className="text-2xl font-black text-gray-900 mb-3">$14.99 <span className="text-xs font-normal text-gray-500">/mo/user</span></div>
                <ul className="space-y-2 text-xs text-gray-600 mb-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    Meetings up to 30 hours
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    AI Companion included
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    5GB Cloud Recording storage
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    Up to 100 participants
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleUpgrade("Pro")}
                className="w-full py-2 bg-[#0B5CFF] hover:bg-[#0845BF] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Upgrade to Pro
              </button>
            </div>

            {/* Business Plan */}
            <div className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between bg-white hover:border-gray-300">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-sm text-gray-900">Business Plan</h4>
                  <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded-full">ENTERPRISE</span>
                </div>
                <div className="text-2xl font-black text-gray-900 mb-3">$21.99 <span className="text-xs font-normal text-gray-500">/mo/user</span></div>
                <ul className="space-y-2 text-xs text-gray-600 mb-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    Up to 300 participants
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    Company branding & vanity URLs
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    Unlimited Whiteboards
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    Managed domains & SSO
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleUpgrade("Business")}
                className="w-full py-2 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Upgrade to Business
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
