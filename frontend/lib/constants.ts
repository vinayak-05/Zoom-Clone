/**
 * Global application constants and configuration.
 */

export const DEFAULT_TUNNEL_URL = "https://limit-binary-edgar-mailto.trycloudflare.com";

export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // 1. Custom override from settings/localStorage
    try {
      const custom = localStorage.getItem("zoom_custom_backend_url");
      if (custom) return custom;
    } catch {
      // Storage unavailable
    }

    const host = window.location.hostname;
    const isLocalhost = host === "localhost" || host === "127.0.0.1";
    const isLocalIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);

    // 2. Localhost on developer machine
    if (isLocalhost) {
      return "http://127.0.0.1:8000";
    }

    // 3. Local network IP over Wi-Fi
    if (isLocalIp) {
      return `http://${host}:8000`;
    }

    // 4. Check NEXT_PUBLIC_API_URL environment variable
    const envApi = process.env.NEXT_PUBLIC_API_URL;
    if (envApi) {
      const isEnvLocalhost = envApi.includes("127.0.0.1") || envApi.includes("localhost");
      if (!isEnvLocalhost) {
        return envApi;
      }
    }

    // 5. Default public deployment (Netlify): connect directly to the live backend tunnel
    return DEFAULT_TUNNEL_URL;
  }

  // Build time / server render
  const envApi = process.env.NEXT_PUBLIC_API_URL;
  if (envApi && !envApi.includes("127.0.0.1") && !envApi.includes("localhost")) {
    return envApi;
  }
  return DEFAULT_TUNNEL_URL;
};

export const getWsBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    try {
      const customWs = localStorage.getItem("zoom_custom_ws_url");
      if (customWs) return customWs;
      const customApi = localStorage.getItem("zoom_custom_backend_url");
      if (customApi) {
        return customApi.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
      }
    } catch {
      // Storage unavailable
    }

    const host = window.location.hostname;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const isLocalhost = host === "localhost" || host === "127.0.0.1";
    const isLocalIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);

    const envWs = process.env.NEXT_PUBLIC_WS_URL;
    if (envWs) {
      const isEnvLocalhost = envWs.includes("127.0.0.1") || envWs.includes("localhost");
      if (!isLocalhost && !isLocalIp && isEnvLocalhost) {
        // Discard localhost WS for remote clients
      } else {
        return envWs;
      }
    }

    const envApi = process.env.NEXT_PUBLIC_API_URL;
    if (envApi && !envApi.includes("127.0.0.1") && !envApi.includes("localhost")) {
      return envApi.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
    }

    if (isLocalhost) {
      return "ws://127.0.0.1:8000";
    }

    if (isLocalIp) {
      return `ws://${host}:8000`;
    }

    return DEFAULT_TUNNEL_URL.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
  }

  const envWs = process.env.NEXT_PUBLIC_WS_URL;
  if (envWs && !envWs.includes("127.0.0.1") && !envWs.includes("localhost")) {
    return envWs;
  }
  const envApi = process.env.NEXT_PUBLIC_API_URL;
  if (envApi && !envApi.includes("127.0.0.1") && !envApi.includes("localhost")) {
    return envApi.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
  }
  return DEFAULT_TUNNEL_URL.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
};

export const API_BASE_URL = typeof window !== "undefined" ? getApiBaseUrl() : "";
export const WS_BASE_URL = typeof window !== "undefined" ? getWsBaseUrl() : "";

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
