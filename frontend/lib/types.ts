/**
 * TypeScript types mirroring backend Pydantic schemas.
 * Strict typing with no any.
 */

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  personal_meeting_id: string;
  timezone: string;
  created_at: string;
}

export type MeetingType = "instant" | "scheduled" | "personal";
export type MeetingStatus = "scheduled" | "live" | "ended" | "cancelled";
export type ParticipantRole = "host" | "co_host" | "participant";

export interface Meeting {
  id: number;
  meeting_code: string;
  title: string;
  description: string | null;
  host_id: number;
  type: MeetingType;
  status: MeetingStatus;
  scheduled_start: string | null;
  duration_minutes: number | null;
  timezone: string;
  passcode: string | null;
  waiting_room: boolean;
  host_video_default: boolean;
  participant_video_default: boolean;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  formatted_code: string;
  invite_link: string;
  host: User | null;
  participant_count: number;
}

export interface Participant {
  id: number;
  meeting_id: number;
  user_id: number | null;
  display_name: string;
  role: ParticipantRole;
  is_muted: boolean;
  is_video_off: boolean;
  is_hand_raised: boolean;
  is_removed: boolean;
  joined_at: string;
  left_at: string | null;
}

export interface ChatMessage {
  id: number;
  meeting_id: number;
  participant_id: number;
  content: string;
  created_at: string;
  sender_name: string;
}

export interface MeetingValidationResponse {
  exists: boolean;
  status: MeetingStatus;
  title: string;
  host_name: string;
  has_passcode: boolean;
  passcode: string | null;
  waiting_room: boolean;
  formatted_code: string;
}

export interface MeetingCreateInstant {
  title?: string;
  host_video_default?: boolean;
  participant_video_default?: boolean;
}

export interface MeetingCreateScheduled {
  title: string;
  description?: string;
  scheduled_start: string;
  duration_minutes: number;
  timezone?: string;
  passcode?: string;
  waiting_room?: boolean;
  host_video_default?: boolean;
  participant_video_default?: boolean;
}

export interface MeetingUpdate {
  title?: string;
  description?: string;
  scheduled_start?: string;
  duration_minutes?: number;
  passcode?: string;
  waiting_room?: boolean;
  host_video_default?: boolean;
  participant_video_default?: boolean;
}

export interface ParticipantJoinRequest {
  display_name: string;
  user_id?: number | null;
  passcode?: string;
  is_muted?: boolean;
  is_video_off?: boolean;
}

export interface ParticipantJoinResponse {
  participant: Participant;
  meeting_id: number;
  meeting_code: string;
  title: string;
  is_host: boolean;
}

export interface ApiError {
  detail: string;
  code?: string;
}
