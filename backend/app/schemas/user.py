"""Pydantic schemas for User resources."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    name: str
    email: EmailStr
    avatar_url: str | None = None
    personal_meeting_id: str
    timezone: str = "Asia/Kolkata"


class UserCreate(UserBase):
    pass


class UserRead(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
