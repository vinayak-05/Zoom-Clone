/**
 * Global application constants and configuration.
 */

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

    // 2. Check NEXT_PUBLIC_API_URL environment variable
    const envApi = process.env.NEXT_PUBLIC_API_URL;
    if (envApi) {
      const isEnvLocalhost = envApi.includes("127.0.0.1") || envApi.includes("localhost");
      // If deployed on remote site (Netlify), ignore localhost env setting
      if (!isLocalhost && !isLocalIp && isEnvLocalhost) {
        // Discard localhost URL for remote clients
      } else {
        return envApi;
      }
    }

    // 3. Localhost on developer machine
    if (isLocalhost) {
      return "http://127.0.0.1:8000";
    }

    // 4. Local network IP over Wi-Fi
    if (isLocalIp) {
      return `http://${host}:8000`;
    }

    // 5. On public deployment (Netlify) with no valid remote backend URL:
    // Return empty string to trigger local standalone mode without connection timeouts
    return "";
  }

  // Build time / server render
  const envApi = process.env.NEXT_PUBLIC_API_URL;
  if (envApi && !envApi.includes("127.0.0.1") && !envApi.includes("localhost")) {
    return envApi;
  }
  return "";
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

    return `${protocol}//${host}`;
  }

  const envWs = process.env.NEXT_PUBLIC_WS_URL;
  if (envWs && !envWs.includes("127.0.0.1") && !envWs.includes("localhost")) {
    return envWs;
  }
  const envApi = process.env.NEXT_PUBLIC_API_URL;
  if (envApi && !envApi.includes("127.0.0.1") && !envApi.includes("localhost")) {
    return envApi.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
  }
  return "";
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
