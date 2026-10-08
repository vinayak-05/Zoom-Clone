"use client";

import React from "react";
import { X, ShieldCheck, Users, Settings, Database, Activity } from "lucide-react";
import { useToast } from "../ui/Toast";

interface AdminCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminCenterModal({ isOpen, onClose }: AdminCenterModalProps) {
  const { showToast } = useToast();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden flex flex-col text-gray-800">
        <div className="bg-[#1C1C28] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm">Zoom Workplace Admin Center</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 text-gray-900 font-semibold mb-1">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Users & Groups</span>
              </div>
              <p className="text-gray-500">1 Active Host • 0 Pending invites</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 text-gray-900 font-semibold mb-1">
                <Activity className="w-4 h-4 text-green-600" />
                <span>System Health</span>
              </div>
              <p className="text-green-600 font-medium">All Services Operational</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 text-gray-900 font-semibold mb-1">
                <Database className="w-4 h-4 text-purple-600" />
                <span>Cloud Storage</span>
              </div>
              <p className="text-gray-500">0.2 GB of 5.0 GB used</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 text-gray-900 font-semibold mb-1">
                <Settings className="w-4 h-4 text-gray-600" />
                <span>Security Policies</span>
              </div>
              <p className="text-gray-500">E2EE Enabled • Passcodes Enforced</p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                showToast("Admin Center preferences saved", "success");
                onClose();
              }}
              className="px-4 py-2 bg-[#0B5CFF] hover:bg-[#0845BF] text-white font-semibold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
