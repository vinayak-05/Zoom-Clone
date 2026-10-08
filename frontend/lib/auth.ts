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

const AUTH_KEY = "zoom_auth_user";
const TOKEN_KEY = "zoom_auth_token";

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const regex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  return regex.test(email.trim());
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
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export async function checkEmailExists(email: string): Promise<{ exists: boolean; message: string; name?: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/check-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Error checking email");
  }
  return data;
}

export async function loginWithEmail(email: string, password?: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to sign in. Please check your credentials.");
  }

  const user: AuthUser = {
    ...data.user,
    plan: "Basic",
    account_no: "109823411",
    is_guest: false,
  };
  setStoredUser(user, data.access_token);
  return user;
}

export async function signupUser(email: string, name?: string, password?: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), name: name?.trim(), password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to create account.");
  }

  const user: AuthUser = {
    ...data.user,
    plan: "Basic",
    account_no: "109823411",
    is_guest: false,
  };
  setStoredUser(user, data.access_token);
  return user;
}

export async function loginWithOAuth(
  provider: "google" | "microsoft" | "apple" | "sso",
  email: string,
  name?: string,
  avatar_url?: string | null
): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/oauth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider,
      email: email.trim(),
      name: name?.trim(),
      avatar_url: avatar_url || null,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || `Failed to sign in with ${provider}.`);
  }

  const user: AuthUser = {
    ...data.user,
    plan: "Basic",
    account_no: "109823411",
    is_guest: false,
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
    // Ignore network error on logout
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem("zoom_displayName");
  }
}
