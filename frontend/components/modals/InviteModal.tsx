"use client";

import React, { useState } from "react";
import { Copy, Check, Shield, Link2, Hash } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { formatMeetingCode } from "../../lib/utils";
import { useToast } from "../ui/Toast";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  meetingCode: string;
  passcode?: string | null;
  inviteLink: string;
}

export function InviteModal({
  isOpen,
  onClose,
  title,
  meetingCode,
  passcode,
  inviteLink,
}: InviteModalProps) {
  const { showToast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const formattedCode = formatMeetingCode(meetingCode);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      showToast("Invite link copied to clipboard!", "success");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      showToast("Failed to copy link", "error");
    }
  };

  const handleCopyFullInvitation = async () => {
    const fullText = `Vinayak is inviting you to a scheduled Zoom meeting.\n\nTopic: ${title}\n\nJoin Zoom Meeting:\n${inviteLink}\n\nMeeting ID: ${formattedCode}${
      passcode ? `\nPasscode: ${passcode}` : ""
    }`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedAll(true);
      showToast("Full invitation copied to clipboard!", "success");
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      showToast("Failed to copy invitation", "error");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite People to Join Meeting"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Meeting Information Summary */}
        <div className="bg-gray-50 border border-zoom-border rounded-zoom p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zoom-muted flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" />
              Meeting ID:
            </span>
            <span className="font-mono font-bold text-zoom-text text-sm">
              {formattedCode}
            </span>
          </div>

          {passcode && (
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zoom-muted flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Passcode:
              </span>
              <span className="font-mono font-bold text-zoom-text text-sm">
                {passcode}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-gray-200">
            <span className="font-semibold text-zoom-muted flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              Invite Link:
            </span>
            <button
              onClick={handleCopyLink}
              className="text-zoom-blue hover:underline font-medium truncate max-w-[200px]"
              title={inviteLink}
            >
              {inviteLink}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 text-xs"
            onClick={handleCopyLink}
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-green-600 mr-1.5" />
            ) : (
              <Copy className="w-4 h-4 mr-1.5" />
            )}
            <span>{copiedLink ? "Link Copied" : "Copy Invite Link"}</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            className="flex-1 text-xs"
            onClick={handleCopyFullInvitation}
          >
            {copiedAll ? (
              <Check className="w-4 h-4 text-white mr-1.5" />
            ) : (
              <Copy className="w-4 h-4 mr-1.5" />
            )}
            <span>{copiedAll ? "Invitation Copied" : "Copy Full Invitation"}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
