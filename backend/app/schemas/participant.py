"""Pydantic schemas for Participant resources."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ParticipantJoinRequest(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=100)
    user_id: int | None = None
    passcode: str | None = None
    is_muted: bool = False
    is_video_off: bool = False


class ParticipantRead(BaseModel):
    id: int
    meeting_id: int
    user_id: int | None
    display_name: str
    role: str
    is_muted: bool
    is_video_off: bool
    is_hand_raised: bool
    is_removed: bool
    joined_at: datetime
    left_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class ParticipantJoinResponse(BaseModel):
    participant: ParticipantRead
    meeting_id: int
    meeting_code: str
    title: str
    is_host: bool
