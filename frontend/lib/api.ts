/**
 * Centralized API client for all backend REST endpoints.
 * Handles base URL, headers, JSON serialization, and structured error throwing.
 */

import { getApiBaseUrl } from "./constants";
import { getStoredUser } from "./auth";
import type {
  User,
  Meeting,
  MeetingCreateInstant,
  MeetingCreateScheduled,
  MeetingUpdate,
  MeetingValidationResponse,
  Participant,
  ParticipantJoinRequest,
  ParticipantJoinResponse,
  ChatMessage,
} from "./types";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const primaryBase = getApiBaseUrl();

  if (!primaryBase) {
    throw new ApiError("No backend server configured", 404);
  }

  const url = `${primaryBase}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Bypass-Tunnel-Reminder": "true",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (typeof window !== "undefined") {
    try {
      const token = localStorage.getItem("zoom_auth_token");
      const stored = localStorage.getItem("zoom_auth_user");
      if (token && !headers["Authorization"]) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email && !headers["X-User-Email"]) {
          headers["X-User-Email"] = parsed.email;
        }
        if (parsed?.id && !headers["X-User-Id"]) {
          headers["X-User-Id"] = String(parsed.id);
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }

  let response: Response;
  const controller = new AbortController();
  // 12s timeout allows reliable network roundtrips over Cloudflare tunnel
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    let code: string | undefined;
    try {
      const errData = await response.json();
      if (errData && errData.detail) {
        detail = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
      }
      if (errData && errData.code) {
        code = errData.code;
      }
    } catch {
      // Non-JSON response
    }
    throw new ApiError(detail, response.status, code);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Users
  async getCurrentUser(): Promise<User> {
    try {
      return await request<User>("/api/v1/users/me");
    } catch {
      const u = getStoredUser();
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatar_url: u.avatar_url || null,
        personal_meeting_id: u.personal_meeting_id,
        timezone: u.timezone,
        created_at: new Date().toISOString(),
      };
    }
  },

  // Meetings
  async getMeetings(filter: "upcoming" | "recent" | "all" = "upcoming"): Promise<Meeting[]> {
    return await request<Meeting[]>(`/api/v1/meetings?filter=${filter}`);
  },

  async getMeetingById(id: number): Promise<Meeting> {
    return await request<Meeting>(`/api/v1/meetings/${id}`);
  },

  async createInstantMeeting(data?: MeetingCreateInstant): Promise<{
    meeting: Meeting;
    invite_link: string;
    host_participant_id: number;
  }> {
    return await request("/api/v1/meetings/instant", {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
  },

  async createScheduledMeeting(data: MeetingCreateScheduled): Promise<{
    meeting: Meeting;
    invite_link: string;
  }> {
    return await request("/api/v1/meetings/schedule", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateMeeting(id: number, data: MeetingUpdate): Promise<Meeting> {
    return await request<Meeting>(`/api/v1/meetings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async cancelMeeting(id: number): Promise<{ message: string }> {
    return await request<{ message: string }>(`/api/v1/meetings/${id}`, {
      method: "DELETE",
    });
  },

  async validateMeetingCode(code: string): Promise<MeetingValidationResponse> {
    return await request<MeetingValidationResponse>(`/api/v1/meetings/code/${encodeURIComponent(code)}/validate`);
  },

  async joinMeeting(code: string, data: ParticipantJoinRequest): Promise<ParticipantJoinResponse> {
    return await request<ParticipantJoinResponse>(`/api/v1/meetings/code/${encodeURIComponent(code)}/join`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async leaveMeeting(code: string, participantId: number): Promise<{ message: string }> {
    return await request<{ message: string }>(
      `/api/v1/meetings/code/${encodeURIComponent(code)}/leave?participant_id=${participantId}`,
      { method: "POST" }
    );
  },

  async endMeeting(code: string): Promise<{ message: string }> {
    return await request<{ message: string }>(`/api/v1/meetings/code/${encodeURIComponent(code)}/end`, {
      method: "POST",
    });
  },

  async getParticipants(code: string): Promise<Participant[]> {
    return await request<Participant[]>(`/api/v1/meetings/code/${encodeURIComponent(code)}/participants`);
  },

  async muteAllParticipants(code: string): Promise<Participant[]> {
    return await request<Participant[]>(`/api/v1/meetings/code/${encodeURIComponent(code)}/mute-all`, {
      method: "POST",
    });
  },

  // Participant Host Controls & Flags
  async muteParticipant(participantId: number, isMuted: boolean = true): Promise<Participant> {
    return await request<Participant>(`/api/v1/participants/${participantId}/mute?is_muted=${isMuted}`, {
      method: "POST",
    });
  },

  async removeParticipant(participantId: number): Promise<Participant> {
    return await request<Participant>(`/api/v1/participants/${participantId}/remove`, {
      method: "POST",
    });
  },

  async updateParticipantFlags(
    participantId: number,
    flags: { is_muted?: boolean; is_video_off?: boolean; is_hand_raised?: boolean }
  ): Promise<Participant> {
    return await request<Participant>(`/api/v1/participants/${participantId}/flags`, {
      method: "PATCH",
      body: JSON.stringify(flags),
    });
  },

  // In-Meeting Chat
  async getChatMessages(code: string): Promise<ChatMessage[]> {
    return await request<ChatMessage[]>(`/api/v1/meetings/code/${encodeURIComponent(code)}/messages`);
  },

  async sendChatMessage(
    code: string,
    data: { content: string; participant_id: number }
  ): Promise<ChatMessage> {
    return await request<ChatMessage>(`/api/v1/meetings/code/${encodeURIComponent(code)}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
