/**
 * Client-side authentication helpers, email validation, and OAuth simulation.
 */

import { API_BASE_URL, DEFAULT_USER } from "./constants";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  personal_meeting_id: string;
  timezone: string;
  plan?: string;
  account_no?: string;
  is_guest?: boolean;
}

interface StoredAccount {
  id: number;
  name: string;
  email: string;
  password?: string;
  avatar_url?: string | null;
  personal_meeting_id: string;
  timezone: string;
  plan?: string;
  account_no?: string;
  is_guest?: boolean;
}

const AUTH_KEY = "zoom_auth_user";
const TOKEN_KEY = "zoom_auth_token";
const ACCOUNTS_KEY = "zoom_local_accounts";

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const regex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  return regex.test(email.trim());
}

function getLocalAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) {
      const initial: StoredAccount[] = [
        {
          id: 1,
          name: "Guest",
          email: "guest@zoomclone.com",
          avatar_url: null,
          personal_meeting_id: "5001234567",
          timezone: "Asia/Kolkata",
          plan: "Free",
          account_no: "000000000",
          is_guest: true,
        },
      ];
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalAccount(account: StoredAccount): void {
  if (typeof window === "undefined") return;
  try {
    const accounts = getLocalAccounts();
    const idx = accounts.findIndex((a) => a.email.toLowerCase() === account.email.toLowerCase());
    if (idx >= 0) {
      accounts[idx] = { ...accounts[idx], ...account };
    } else {
      accounts.push(account);
    }
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore storage write errors
  }
}

export function getStoredUser(): AuthUser {
  if (typeof window === "undefined") return DEFAULT_USER as AuthUser;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return DEFAULT_USER as AuthUser;
    const parsed = JSON.parse(raw);
    return parsed.id !== undefined ? parsed : (DEFAULT_USER as AuthUser);
  } catch {
    return DEFAULT_USER as AuthUser;
  }
}

export function setStoredUser(user: AuthUser, token?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch {
    // Ignore storage write errors
  }
}

async function safeAuthFetch(endpoint: string, data: any): Promise<any | null> {
  const base = API_BASE_URL;
  if (!base) return null;

  // Prevent browser blocking HTTPS page calling plain HTTP endpoint
  if (typeof window !== "undefined" && window.location.protocol === "https:" && base.startsWith("http://")) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${base}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      return await res.json();
    }
    try {
      const err = await res.json();
      return { _error: true, detail: err.detail || "Authentication failed" };
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

export async function checkEmailExists(email: string): Promise<{ exists: boolean; message: string; name?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // Try remote backend if reachable
  const remote = await safeAuthFetch("/api/v1/auth/check-email", { email: cleanEmail });
  if (remote && !remote._error) {
    return remote;
  }

  // Fallback to local accounts database
  const accounts = getLocalAccounts();
  const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
  if (found) {
    return { exists: true, message: "User exists", name: found.name };
  }
  return { exists: false, message: `No account found for '${cleanEmail}'` };
}

export async function loginWithEmail(email: string, password?: string): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();

  // Try remote backend if reachable
  const remote = await safeAuthFetch("/api/v1/auth/login", { email: cleanEmail, password });
  if (remote) {
    if (remote._error) {
      throw new Error(remote.detail);
    }
    const user: AuthUser = {
      ...remote.user,
      plan: "Basic",
      account_no: "109823411",
      is_guest: false,
    };
    setStoredUser(user, remote.access_token);
    saveLocalAccount({ ...user, password, is_guest: false });
    return user;
  }

  // Fallback to local accounts database
  const accounts = getLocalAccounts();
  const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
  if (!found) {
    throw new Error(`No account found for '${email}'. Please sign up first.`);
  }

  if (found.password && password && found.password !== password) {
    throw new Error("Incorrect password. Please try again.");
  }

  const user: AuthUser = {
    id: found.id,
    name: found.name,
    email: found.email,
    avatar_url: found.avatar_url,
    personal_meeting_id: found.personal_meeting_id,
    timezone: found.timezone,
    plan: found.plan,
    account_no: found.account_no,
    is_guest: found.is_guest,
  };
  setStoredUser(user, "local_token_" + Date.now());
  return user;
}

export async function signupUser(email: string, name?: string, password?: string): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name?.trim() || cleanEmail.split("@")[0];

  // Try remote backend if reachable
  const remote = await safeAuthFetch("/api/v1/auth/signup", {
    email: cleanEmail,
    name: cleanName,
    password,
  });

  if (remote) {
    if (remote._error) {
      throw new Error(remote.detail);
    }
    const user: AuthUser = {
      ...remote.user,
      plan: "Basic",
      account_no: "109823411",
      is_guest: false,
    };
    saveLocalAccount({ ...user, password, is_guest: false });
    setStoredUser(user, remote.access_token);
    return user;
  }

  // Fallback to local accounts database
  const accounts = getLocalAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error(`An account for '${email}' already exists. Please sign in.`);
  }

  const newAccount: StoredAccount = {
    id: Date.now(),
    name: cleanName,
    email: cleanEmail,
    password: password || undefined,
    avatar_url: null,
    personal_meeting_id: String(Math.floor(1000000000 + Math.random() * 9000000000)),
    timezone: "Asia/Kolkata",
    plan: "Basic",
    account_no: String(Math.floor(100000000 + Math.random() * 900000000)),
    is_guest: false,
  };

  saveLocalAccount(newAccount);
  const user: AuthUser = {
    id: newAccount.id,
    name: newAccount.name,
    email: newAccount.email,
    avatar_url: newAccount.avatar_url,
    personal_meeting_id: newAccount.personal_meeting_id,
    timezone: newAccount.timezone,
    plan: newAccount.plan,
    account_no: newAccount.account_no,
    is_guest: false,
  };
  setStoredUser(user, "local_token_" + Date.now());
  return user;
}

export async function loginWithOAuth(
  provider: "google" | "microsoft" | "apple" | "sso",
  email: string,
  name?: string,
  avatar_url?: string | null
): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name?.trim() || `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`;

  // Try remote backend if reachable
  const remote = await safeAuthFetch("/api/v1/auth/oauth", {
    provider,
    email: cleanEmail,
    name: cleanName,
    avatar_url: avatar_url || null,
  });

  if (remote && !remote._error) {
    const user: AuthUser = {
      ...remote.user,
      plan: "Basic",
      account_no: "109823411",
      is_guest: false,
    };
    saveLocalAccount({ ...user, is_guest: false });
    setStoredUser(user, remote.access_token);
    return user;
  }

  // Fallback to local accounts database
  const accounts = getLocalAccounts();
  let found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
  if (!found) {
    found = {
      id: Date.now(),
      name: cleanName,
      email: cleanEmail,
      avatar_url: avatar_url || null,
      personal_meeting_id: String(Math.floor(1000000000 + Math.random() * 9000000000)),
      timezone: "Asia/Kolkata",
      plan: "Basic",
      account_no: String(Math.floor(100000000 + Math.random() * 900000000)),
      is_guest: false,
    };
    saveLocalAccount(found);
  } else if (avatar_url || name) {
    found.avatar_url = avatar_url || found.avatar_url;
    if (name) found.name = cleanName;
    saveLocalAccount(found);
  }

  const user: AuthUser = {
    id: found.id,
    name: found.name,
    email: found.email,
    avatar_url: found.avatar_url,
    personal_meeting_id: found.personal_meeting_id,
    timezone: found.timezone,
    plan: found.plan,
    account_no: found.account_no,
    is_guest: false,
  };
  setStoredUser(user, "oauth_token_" + Date.now());
  return user;
}

export async function logoutUser(): Promise<void> {
  const base = API_BASE_URL;
  if (base) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1000);
      await fetch(`${base}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timer);
    } catch {
      // Ignore network error on logout
    }
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem("zoom_displayName");
  }
}
