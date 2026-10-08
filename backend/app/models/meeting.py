"""Meeting ORM model."""

from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MeetingType(str, PyEnum):
    INSTANT = "instant"
    SCHEDULED = "scheduled"
    PERSONAL = "personal"


class MeetingStatus(str, PyEnum):
    SCHEDULED = "scheduled"
    LIVE = "live"
    ENDED = "ended"
    CANCELLED = "cancelled"


class Meeting(Base):
    """A video-conference meeting."""

    __tablename__ = "meetings"
    __table_args__ = (
        Index("ix_meetings_meeting_code", "meeting_code", unique=True),
        Index("ix_meetings_host_id", "host_id"),
        Index("ix_meetings_status", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    meeting_code: Mapped[str] = mapped_column(
        String(11), unique=True, nullable=False,
        comment="Unique 10-11 digit numeric code, displayed as 'XXX XXXX XXXX'"
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False, default="Zoom Meeting")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False, default=MeetingType.INSTANT.value)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=MeetingStatus.SCHEDULED.value)

    # Scheduling
    scheduled_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), default="Asia/Kolkata")

    # Security & defaults
    passcode: Mapped[str | None] = mapped_column(String(20), nullable=True)
    waiting_room: Mapped[bool] = mapped_column(Boolean, default=False)
    host_video_default: Mapped[bool] = mapped_column(Boolean, default=True)
    participant_video_default: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    host: Mapped["User"] = relationship("User", back_populates="hosted_meetings")  # type: ignore[name-defined]  # noqa: F821
    participants: Mapped[list["Participant"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Participant", back_populates="meeting", lazy="selectin", cascade="all, delete-orphan"
    )
    chat_messages: Mapped[list["ChatMessage"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "ChatMessage", back_populates="meeting", lazy="selectin", cascade="all, delete-orphan"
    )
