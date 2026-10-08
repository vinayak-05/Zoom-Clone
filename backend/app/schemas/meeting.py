"""Pydantic schemas for Meeting resources."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.user import UserRead
from app.utils.time import utc_now, ensure_utc


class MeetingCreateInstant(BaseModel):
    title: str = "Instant Meeting"
    host_video_default: bool = True
    participant_video_default: bool = True


class MeetingCreateScheduled(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    scheduled_start: datetime
    duration_minutes: int = Field(..., gt=0, le=1440)  # max 24 hours
    timezone: str = "Asia/Kolkata"
    passcode: str | None = Field(default=None, max_length=20)
    waiting_room: bool = False
    host_video_default: bool = True
    participant_video_default: bool = True

    @field_validator("scheduled_start")
    @classmethod
    def validate_future_start(cls, v: datetime) -> datetime:
        v_utc = ensure_utc(v)
        now_utc = utc_now()
        # Allow up to 2 minutes in the past for clock drift
        if v_utc and (now_utc - v_utc).total_seconds() > 120:
            raise ValueError("Meeting start time must be in the future.")
        return v_utc


class MeetingUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    scheduled_start: datetime | None = None
    duration_minutes: int | None = Field(default=None, gt=0)
    passcode: str | None = None
    waiting_room: bool | None = None
    host_video_default: bool | None = None
    participant_video_default: bool | None = None


class MeetingRead(BaseModel):
    id: int
    meeting_code: str
    title: str
    description: str | None
    host_id: int
    type: str
    status: str
    scheduled_start: datetime | None
    duration_minutes: int | None
    timezone: str
    passcode: str | None
    waiting_room: bool
    host_video_default: bool
    participant_video_default: bool
    started_at: datetime | None
    ended_at: datetime | None
    created_at: datetime
    updated_at: datetime
    formatted_code: str = ""
    invite_link: str = ""
    host: UserRead | None = None
    participant_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class MeetingValidationResponse(BaseModel):
    exists: bool
    status: str
    title: str
    host_name: str
    has_passcode: bool
    passcode: str | None = None
    waiting_room: bool = False
    formatted_code: str = ""
