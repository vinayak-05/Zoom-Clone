"""User setting ORM model."""

from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserSetting(Base):
    """User-configurable settings persisted in the database."""

    __tablename__ = "user_settings"
    __table_args__ = (
        UniqueConstraint("user_id", "key", name="uq_user_setting_key"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    key: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", lazy="selectin")  # type: ignore[name-defined]  # noqa: F821
