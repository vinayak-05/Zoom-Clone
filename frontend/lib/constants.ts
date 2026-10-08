/**
 * Global application constants and configuration.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000";

export const DEFAULT_USER = {
  id: 0,
  name: "Guest",
  email: "guest@zoomclone.com",
  avatar_url: null,
  personal_meeting_id: "5001234567",
  timezone: "Asia/Kolkata",
  account_no: "000000000",
  plan: "Free",
  is_guest: true,
};

export const GUEST_USER = DEFAULT_USER;

export const COMMON_TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];
