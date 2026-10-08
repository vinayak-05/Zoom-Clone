/**
 * Client-side authentication helpers and persistence.
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
}

const AUTH_KEY = "zoom_auth_user";
const TOKEN_KEY = "zoom_auth_token";

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return DEFAULT_USER as AuthUser;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return DEFAULT_USER as AuthUser;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USER as AuthUser;
  }
}

export function setStoredUser(user: AuthUser, token?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export async function loginWithEmail(email: string, password?: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error("Failed to sign in. Please check your credentials.");
  }

  const data = await res.json();
  const user: AuthUser = {
    ...data.user,
    plan: "Basic",
    account_no: "109823411",
  };
  setStoredUser(user, data.access_token);
  return user;
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Ignore network failure on logout
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem("zoom_displayName");
  }
}
