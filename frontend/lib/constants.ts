/**
 * Global application constants and configuration.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export const DEFAULT_USER = {
  id: 0,
  name: "Guest",
  email: "guest@zoomclone.local",
  avatar_url: null,
  personal_meeting_id: "5001234567",
  timezone: "Asia/Kolkata",
  account_no: "000000000",
  plan: "Free",
  is_guest: true,
};

export const VINAYAK_USER = {
  id: 1,
  name: "Vinayak",
  email: "vinayak@zoomclone.com",
  avatar_url: null,
  personal_meeting_id: "3829148201",
  timezone: "Asia/Kolkata",
  account_no: "109823411",
  plan: "Basic",
  is_guest: false,
};

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
