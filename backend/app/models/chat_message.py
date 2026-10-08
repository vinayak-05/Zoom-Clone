"""Chat message ORM model (bonus feature)."""

from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ChatMessage(Base):
    """In-meeting chat message."""

    __tablename__ = "chat_messages"
    __table_args__ = (
        Index("ix_chat_messages_meeting_id", "meeting_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), nullable=False)
    participant_id: Mapped[int] = mapped_column(ForeignKey("participants.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="chat_messages")  # type: ignore[name-defined]  # noqa: F821
    participant: Mapped["Participant"] = relationship("Participant", back_populates="messages")  # type: ignore[name-defined]  # noqa: F821
