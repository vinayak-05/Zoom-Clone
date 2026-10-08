"""User ORM model."""

from datetime import datetime, timezone

from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    """Registered user (seeded; the default host + sample users)."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    personal_meeting_id: Mapped[str] = mapped_column(
        String(11), unique=True, nullable=False,
        comment="10-digit personal meeting code"
    )
    timezone: Mapped[str] = mapped_column(String(50), default="Asia/Kolkata")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    hosted_meetings: Mapped[list["Meeting"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Meeting", back_populates="host", lazy="selectin"
    )
    participations: Mapped[list["Participant"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Participant", back_populates="user", lazy="selectin"
    )
