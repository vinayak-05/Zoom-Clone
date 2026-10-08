"use client";

import React, { useState } from "react";
import { X, Users, Search, Mail, Phone, Video } from "lucide-react";
import { useToast } from "../ui/Toast";

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteContact?: (contactName: string) => void;
}

const DEFAULT_CONTACTS = [
  { id: 1, name: "Vinayak Gupta", email: "vinayak@zoomclone.com", role: "Host / Admin", status: "online" },
  { id: 2, name: "Alexander Wright", email: "alex@company.org", role: "Product Manager", status: "away" },
  { id: 3, name: "Sarah Chen", email: "sarah.chen@tech.io", role: "Engineering Lead", status: "online" },
  { id: 4, name: "Marcus Brody", email: "marcus@design.studio", role: "Design Director", status: "offline" },
];

export function ContactsModal({ isOpen, onClose, onInviteContact }: ContactsModalProps) {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filtered = DEFAULT_CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden flex flex-col text-gray-800">
        <div className="bg-[#1C1C28] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm">Zoom Contacts</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search contacts by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#0B5CFF]"
            />
          </div>
        </div>

        <div className="p-4 max-h-[50vh] overflow-y-auto space-y-2 text-xs">
          {filtered.map((contact) => (
            <div
              key={contact.id}
              className="p-2.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C43D1A] text-white font-bold flex items-center justify-center relative">
                  {contact.name[0]}
                  <span
                    className={`w-2 h-2 rounded-full absolute -bottom-0.5 -right-0.5 border border-white ${
                      contact.status === "online"
                        ? "bg-green-500"
                        : contact.status === "away"
                        ? "bg-amber-500"
                        : "bg-gray-400"
                    }`}
                  />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{contact.name}</p>
                  <p className="text-gray-500 text-[11px]">{contact.role}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  onInviteContact?.(contact.name);
                  showToast(`Invited ${contact.name} to meeting`, "success");
                }}
                className="px-2.5 py-1 bg-blue-50 text-[#0B5CFF] hover:bg-blue-100 rounded-lg font-semibold flex items-center gap-1 transition-colors"
              >
                <Video className="w-3 h-3" />
                <span>Invite</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
