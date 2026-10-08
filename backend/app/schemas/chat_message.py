"""Pydantic schemas for ChatMessage resources."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    participant_id: int


class ChatMessageRead(BaseModel):
    id: int
    meeting_id: int
    participant_id: int
    content: str
    created_at: datetime
    sender_name: str = ""

    model_config = ConfigDict(from_attributes=True)
