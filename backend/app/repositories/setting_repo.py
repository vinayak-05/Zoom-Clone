"""User settings repository for database access."""

from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.setting import UserSetting

DEFAULT_SETTINGS: dict[str, bool] = {
    # Meeting
    "host_video": True,
    "participant_video": True,
    "audio_type": True,
    "join_before_host": False,
    "waiting_room": True,
    "mute_on_entry": True,
    # Clips
    "clips_avatars": True,
    "clips_custom_avatars": True,
    # Canvas
    "canvas_ai_revision": True,
    "canvas_sentence_completion": True,
    # Paper
    "paper_ai_content": False,
    # Sheets
    "sheets_ai_content": False,
    "sheets_ai_formula": True,
    "sheets_ai_function": True,
    # Slides
    "slides_ai_generation": True,
}


class SettingRepository:
    """Encapsulates all database operations for UserSetting records."""

    @staticmethod
    def get_user_settings(db: Session, user_id: int) -> dict[str, bool]:
        """Fetch all settings for a user, merged with defaults."""
        stmt = select(UserSetting).where(UserSetting.user_id == user_id)
        records = db.scalars(stmt).all()

        settings = dict(DEFAULT_SETTINGS)
        for rec in records:
            settings[rec.key] = rec.value
        return settings

    @staticmethod
    def update_setting(db: Session, user_id: int, key: str, value: bool) -> dict[str, bool]:
        """Update or insert a single setting for a user."""
        stmt = select(UserSetting).where(
            UserSetting.user_id == user_id,
            UserSetting.key == key,
        )
        record = db.scalars(stmt).first()

        if record:
            record.value = value
            record.updated_at = datetime.now(timezone.utc)
        else:
            record = UserSetting(
                user_id=user_id,
                key=key,
                value=value,
                updated_at=datetime.now(timezone.utc),
            )
            db.add(record)

        db.commit()
        return SettingRepository.get_user_settings(db, user_id)

    @staticmethod
    def update_bulk(db: Session, user_id: int, updates: dict[str, bool]) -> dict[str, bool]:
        """Update multiple settings in one transaction."""
        for key, value in updates.items():
            stmt = select(UserSetting).where(
                UserSetting.user_id == user_id,
                UserSetting.key == key,
            )
            record = db.scalars(stmt).first()
            if record:
                record.value = value
                record.updated_at = datetime.now(timezone.utc)
            else:
                db.add(UserSetting(
                    user_id=user_id,
                    key=key,
                    value=value,
                    updated_at=datetime.now(timezone.utc),
                ))
        db.commit()
        return SettingRepository.get_user_settings(db, user_id)

    @staticmethod
    def reset_to_defaults(db: Session, user_id: int) -> dict[str, bool]:
        """Reset all user settings back to initial defaults."""
        stmt = select(UserSetting).where(UserSetting.user_id == user_id)
        records = db.scalars(stmt).all()
        for r in records:
            db.delete(r)
        db.commit()
        return dict(DEFAULT_SETTINGS)
