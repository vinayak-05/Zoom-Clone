"""Participant ORM model – one row per join session."""

from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import String, Boolean, DateTime, ForeignKey, Index, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ParticipantRole(str, PyEnum):
    HOST = "host"
    CO_HOST = "co_host"
    PARTICIPANT = "participant"


class Participant(Base):
    """A single join-session for a user in a meeting.

    One row is created per join session so that leave/rejoin events
    are tracked individually (useful for attendance logs).
    """

    __tablename__ = "participants"
    __table_args__ = (
        Index("ix_participants_meeting_active", "meeting_id", "left_at"),
        Index("ix_participants_meeting_id", "meeting_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), nullable=False)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True,
        comment="NULL for guest participants who are not registered users"
    )
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default=ParticipantRole.PARTICIPANT.value)

    # State flags
    is_muted: Mapped[bool] = mapped_column(Boolean, default=False)
    is_video_off: Mapped[bool] = mapped_column(Boolean, default=False)
    is_hand_raised: Mapped[bool] = mapped_column(Boolean, default=False)
    is_removed: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamps
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    left_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="participants")  # type: ignore[name-defined]  # noqa: F821
    user: Mapped["User | None"] = relationship("User", back_populates="participations")  # type: ignore[name-defined]  # noqa: F821
    messages: Mapped[list["ChatMessage"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "ChatMessage", back_populates="participant", lazy="selectin"
    )
