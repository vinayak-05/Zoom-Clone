/**
 * Centralized API client for all backend REST endpoints.
 * Handles base URL, headers, JSON serialization, and structured error throwing.
 */

import { API_BASE_URL, getApiBaseUrl } from "./constants";
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

class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function createMockMeeting(
  id: number,
  code: string,
  title: string,
  type: "instant" | "scheduled" = "instant",
  scheduled_start: string | null = null,
  duration_minutes: number = 40,
  passcode: string | null = null,
  host_video_default: boolean = true,
  participant_video_default: boolean = true
): Meeting {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const formatted = code.length === 10 ? `${code.slice(0, 3)} ${code.slice(3, 6)} ${code.slice(6)}` : code;
  return {
    id,
    meeting_code: code,
    title,
    description: null,
    host_id: 1,
    type,
    status: "live",
    scheduled_start,
    duration_minutes,
    timezone: "Asia/Kolkata",
    passcode,
    waiting_room: false,
    host_video_default,
    participant_video_default,
    started_at: new Date().toISOString(),
    ended_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    formatted_code: formatted,
    invite_link: `${origin}/join/${code}`,
    host: null,
    participant_count: 1,
  };
}

function getLocalMeetings(): Meeting[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("zoom_local_meetings");
    if (!raw) {
      const initial: Meeting[] = [
        createMockMeeting(
          101,
          "5001234567",
          "Weekly Team Standup",
          "scheduled",
          new Date(Date.now() + 3600000).toISOString(),
          30
        ),
      ];
      localStorage.setItem("zoom_local_meetings", JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalMeeting(meeting: Meeting): void {
  if (typeof window === "undefined") return;
  try {
    const list = getLocalMeetings();
    const idx = list.findIndex((m) => m.id === meeting.id || m.meeting_code === meeting.meeting_code);
    if (idx >= 0) {
      list[idx] = meeting;
    } else {
      list.unshift(meeting);
    }
    localStorage.setItem("zoom_local_meetings", JSON.stringify(list));
  } catch {
    // Ignore storage write error
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const primaryBase = getApiBaseUrl();

  // If no backend is configured or accessible on remote deployment, directly throw to trigger local fallback
  if (!primaryBase) {
    throw new ApiError("No remote backend configured; using local storage fallback", 404);
  }

  const url = `${primaryBase}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
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
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch (netErr) {
    clearTimeout(timer);
    // If direct connect failed, retry via Next.js proxy rewrite if base was nonempty
    if (typeof window !== "undefined" && primaryBase !== "" && !endpoint.startsWith("http")) {
      try {
        const retryController = new AbortController();
        const retryTimer = setTimeout(() => retryController.abort(), 2000);
        response = await fetch(endpoint, {
          ...options,
          headers,
          signal: retryController.signal,
        });
        clearTimeout(retryTimer);
      } catch {
        throw netErr;
      }
    } else {
      throw netErr;
    }
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
    try {
      return await request<Meeting[]>(`/api/v1/meetings?filter=${filter}`);
    } catch {
      return getLocalMeetings();
    }
  },

  async getMeetingById(id: number): Promise<Meeting> {
    try {
      return await request<Meeting>(`/api/v1/meetings/${id}`);
    } catch {
      const list = getLocalMeetings();
      const found = list.find((m) => m.id === id);
      if (found) return found;
      throw new Error("Meeting not found");
    }
  },

  async createInstantMeeting(data?: MeetingCreateInstant): Promise<{
    meeting: Meeting;
    invite_link: string;
    host_participant_id: number;
  }> {
    try {
      return await request("/api/v1/meetings/instant", {
        method: "POST",
        body: JSON.stringify(data || {}),
      });
    } catch {
      const u = getStoredUser();
      const code = String(Math.floor(1000000000 + Math.random() * 9000000000));
      const meeting = createMockMeeting(
        Date.now(),
        code,
        data?.title || "Instant Meeting",
        "instant",
        null,
        40,
        null,
        data?.host_video_default ?? true,
        data?.participant_video_default ?? true
      );
      meeting.host_id = u.id || 1;
      saveLocalMeeting(meeting);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      return {
        meeting,
        invite_link: `${origin}/join/${code}`,
        host_participant_id: 1,
      };
    }
  },

  async createScheduledMeeting(data: MeetingCreateScheduled): Promise<{
    meeting: Meeting;
    invite_link: string;
  }> {
    try {
      return await request("/api/v1/meetings/schedule", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch {
      const u = getStoredUser();
      const code = String(Math.floor(1000000000 + Math.random() * 9000000000));
      const meeting = createMockMeeting(
        Date.now(),
        code,
        data.title || "Scheduled Meeting",
        "scheduled",
        data.scheduled_start,
        data.duration_minutes || 30,
        data.passcode || null,
        data.host_video_default ?? true,
        data.participant_video_default ?? true
      );
      meeting.host_id = u.id || 1;
      meeting.description = data.description || null;
      meeting.waiting_room = data.waiting_room ?? false;
      saveLocalMeeting(meeting);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      return {
        meeting,
        invite_link: `${origin}/join/${code}`,
      };
    }
  },

  async updateMeeting(id: number, data: MeetingUpdate): Promise<Meeting> {
    try {
      return await request<Meeting>(`/api/v1/meetings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    } catch {
      const list = getLocalMeetings();
      const found = list.find((m) => m.id === id);
      if (found) {
        const updated = { ...found, ...data, updated_at: new Date().toISOString() };
        saveLocalMeeting(updated);
        return updated;
      }
      throw new Error("Meeting not found");
    }
  },

  async cancelMeeting(id: number): Promise<{ message: string }> {
    try {
      return await request<{ message: string }>(`/api/v1/meetings/${id}`, {
        method: "DELETE",
      });
    } catch {
      if (typeof window !== "undefined") {
        const list = getLocalMeetings().filter((m) => m.id !== id);
        localStorage.setItem("zoom_local_meetings", JSON.stringify(list));
      }
      return { message: "Meeting cancelled" };
    }
  },

  async validateMeetingCode(code: string): Promise<MeetingValidationResponse> {
    try {
      return await request<MeetingValidationResponse>(`/api/v1/meetings/code/${encodeURIComponent(code)}/validate`);
    } catch {
      const meetings = getLocalMeetings();
      const clean = code.replace(/\D/g, "");
      const found = meetings.find((m) => m.meeting_code.replace(/\D/g, "") === clean);
      return {
        exists: true,
        status: "live",
        title: found?.title || "Zoom Meeting",
        host_name: "Host",
        has_passcode: !!found?.passcode,
        passcode: found?.passcode || null,
        waiting_room: false,
        formatted_code: code,
      };
    }
  },

  async joinMeeting(code: string, data: ParticipantJoinRequest): Promise<ParticipantJoinResponse> {
    try {
      return await request<ParticipantJoinResponse>(`/api/v1/meetings/code/${encodeURIComponent(code)}/join`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch {
      const meetings = getLocalMeetings();
      const clean = code.replace(/\D/g, "");
      const found = meetings.find((m) => m.meeting_code.replace(/\D/g, "") === clean);
      const meetingId = found?.id || Date.now();
      const meetingTitle = found?.title || "Zoom Meeting";

      const participant: Participant = {
        id: Date.now(),
        meeting_id: meetingId,
        user_id: data.user_id || 1,
        display_name: data.display_name,
        role: "participant",
        is_muted: data.is_muted ?? false,
        is_video_off: data.is_video_off ?? false,
        is_hand_raised: false,
        is_removed: false,
        joined_at: new Date().toISOString(),
        left_at: null,
      };

      return {
        participant,
        meeting_id: meetingId,
        meeting_code: code,
        title: meetingTitle,
        is_host: false,
      };
    }
  },

  async leaveMeeting(code: string, participantId: number): Promise<{ message: string }> {
    try {
      return await request<{ message: string }>(
        `/api/v1/meetings/code/${encodeURIComponent(code)}/leave?participant_id=${participantId}`,
        { method: "POST" }
      );
    } catch {
      return { message: "Left meeting" };
    }
  },

  async endMeeting(code: string): Promise<{ message: string }> {
    try {
      return await request<{ message: string }>(`/api/v1/meetings/code/${encodeURIComponent(code)}/end`, {
        method: "POST",
      });
    } catch {
      return { message: "Meeting ended" };
    }
  },

  async getParticipants(code: string): Promise<Participant[]> {
    try {
      return await request<Participant[]>(`/api/v1/meetings/code/${encodeURIComponent(code)}/participants`);
    } catch {
      const u = getStoredUser();
      return [
        {
          id: 1,
          meeting_id: 1,
          user_id: u.id,
          display_name: `${u.name} (Host, me)`,
          role: "host",
          is_muted: false,
          is_video_off: false,
          is_hand_raised: false,
          is_removed: false,
          joined_at: new Date().toISOString(),
          left_at: null,
        },
      ];
    }
  },

  async muteAllParticipants(code: string): Promise<Participant[]> {
    try {
      return await request<Participant[]>(`/api/v1/meetings/code/${encodeURIComponent(code)}/mute-all`, {
        method: "POST",
      });
    } catch {
      return [];
    }
  },

  // Participant Host Controls & Flags
  async muteParticipant(participantId: number, isMuted: boolean = true): Promise<Participant> {
    try {
      return await request<Participant>(`/api/v1/participants/${participantId}/mute?is_muted=${isMuted}`, {
        method: "POST",
      });
    } catch {
      return {
        id: participantId,
        meeting_id: 1,
        user_id: null,
        display_name: "Participant",
        role: "participant",
        is_muted: isMuted,
        is_video_off: false,
        is_hand_raised: false,
        is_removed: false,
        joined_at: new Date().toISOString(),
        left_at: null,
      };
    }
  },

  async removeParticipant(participantId: number): Promise<Participant> {
    try {
      return await request<Participant>(`/api/v1/participants/${participantId}/remove`, {
        method: "POST",
      });
    } catch {
      return {
        id: participantId,
        meeting_id: 1,
        user_id: null,
        display_name: "Participant",
        role: "participant",
        is_muted: false,
        is_video_off: false,
        is_hand_raised: false,
        is_removed: true,
        joined_at: new Date().toISOString(),
        left_at: new Date().toISOString(),
      };
    }
  },

  async updateParticipantFlags(
    participantId: number,
    flags: { is_muted?: boolean; is_video_off?: boolean; is_hand_raised?: boolean }
  ): Promise<Participant> {
    try {
      return await request<Participant>(`/api/v1/participants/${participantId}/flags`, {
        method: "PATCH",
        body: JSON.stringify(flags),
      });
    } catch {
      return {
        id: participantId,
        meeting_id: 1,
        user_id: null,
        display_name: "Participant",
        role: "participant",
        is_muted: flags.is_muted ?? false,
        is_video_off: flags.is_video_off ?? false,
        is_hand_raised: flags.is_hand_raised ?? false,
        is_removed: false,
        joined_at: new Date().toISOString(),
        left_at: null,
      };
    }
  },

  // In-Meeting Chat
  async getChatMessages(code: string): Promise<ChatMessage[]> {
    try {
      return await request<ChatMessage[]>(`/api/v1/meetings/code/${encodeURIComponent(code)}/messages`);
    } catch {
      if (typeof window === "undefined") return [];
      try {
        const raw = localStorage.getItem(`zoom_local_chat_${code}`);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
  },

  async sendChatMessage(
    code: string,
    data: { content: string; participant_id: number }
  ): Promise<ChatMessage> {
    try {
      return await request<ChatMessage>(`/api/v1/meetings/code/${encodeURIComponent(code)}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch {
      const u = getStoredUser();
      const msg: ChatMessage = {
        id: Date.now(),
        meeting_id: 1,
        participant_id: data.participant_id,
        content: data.content,
        created_at: new Date().toISOString(),
        sender_name: u.name,
      };
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(`zoom_local_chat_${code}`);
          const list: ChatMessage[] = raw ? JSON.parse(raw) : [];
          list.push(msg);
          localStorage.setItem(`zoom_local_chat_${code}`, JSON.stringify(list));
        } catch {
          // Ignore storage write error
        }
      }
      return msg;
    }
  },
};
