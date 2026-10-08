import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatMeetingCode(code: string): string {
  const cleaned = code.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  return code;
}

export function parseMeetingCode(input: string): string | null {
  if (!input) return null;
  const urlMatch = input.match(/\/(?:join|j|meeting)\/([0-9\-\s]{9,13})/);
  if (urlMatch) {
    const digits = urlMatch[1].replace(/\D/g, "");
    if (digits.length >= 9 && digits.length <= 12) return digits;
  }
  const digits = input.replace(/\D/g, "");
  if (digits.length >= 9 && digits.length <= 12) return digits;
  return null;
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(dateString: string | null): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateTime(dateString: string | null): string {
  if (!dateString) return "";
  return `${formatDate(dateString)}, ${formatTime(dateString)}`;
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return "";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs} hr ${mins} mins`;
  if (hrs > 0) return `${hrs} hr`;
  return `${mins} mins`;
}

export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0][0] + (parts[parts.length - 1][0] || "")).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-[#C43D1A]", // Signature Zoom Burnt Orange
  "bg-blue-600",
  "bg-emerald-600",
  "bg-indigo-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-teal-600",
  "bg-rose-600",
];

export function getAvatarColor(name: string): string {
  if (!name) return "bg-[#C43D1A]";
  // Match Vinayak or single-V to signature Zoom burnt orange
  if (name.toLowerCase().includes("vinayak") || name.trim().toUpperCase() === "V") {
    return "bg-[#C43D1A]";
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}
