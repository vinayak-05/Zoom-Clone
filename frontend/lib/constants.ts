/**
 * Global application constants and configuration.
 */

export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    try {
      const custom = localStorage.getItem("zoom_custom_backend_url");
      if (custom) return custom;
    } catch {
      // Storage unavailable
    }
    const host = window.location.hostname;
    const isLocalIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
    if (isLocalIp && host !== "127.0.0.1") {
      return `http://${host}:8000`;
    }
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://127.0.0.1:8000";
    }
    return "";
  }
  return "http://127.0.0.1:8000";
};

export const getWsBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  if (typeof window !== "undefined") {
    try {
      const custom = localStorage.getItem("zoom_custom_ws_url");
      if (custom) return custom;
    } catch {
      // Storage unavailable
    }
    const host = window.location.hostname;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const isLocalIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
    if (isLocalIp && host !== "127.0.0.1") {
      return `ws://${host}:8000`;
    }
    if (host === "localhost" || host === "127.0.0.1") {
      return "ws://127.0.0.1:8000";
    }
    return `${protocol}//${host}`;
  }
  return "ws://127.0.0.1:8000";
};

export const API_BASE_URL = getApiBaseUrl();
export const WS_BASE_URL = getWsBaseUrl();

export const DEFAULT_USER = {
  id: 1,
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
