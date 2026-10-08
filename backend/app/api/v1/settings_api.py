"""Settings API endpoints."""

from typing import Any
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_user_from_request
from app.repositories.setting_repo import SettingRepository

router = APIRouter(prefix="/settings", tags=["Settings"])


class SettingUpdatePayload(BaseModel):
    key: str | None = None
    value: bool | None = None
    settings: dict[str, bool] | None = None


@router.get("", response_model=dict[str, bool])
def get_settings(
    current_user: User = Depends(get_current_user_from_request),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    """Get all settings for the active user."""
    return SettingRepository.get_user_settings(db, current_user.id)


@router.patch("", response_model=dict[str, bool])
def update_settings(
    payload: SettingUpdatePayload,
    current_user: User = Depends(get_current_user_from_request),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    """Update a single setting or multiple settings."""
    if payload.settings:
        return SettingRepository.update_bulk(db, current_user.id, payload.settings)

    if payload.key is not None and payload.value is not None:
        return SettingRepository.update_setting(db, current_user.id, payload.key, payload.value)

    return SettingRepository.get_user_settings(db, current_user.id)


@router.post("/reset", response_model=dict[str, bool])
def reset_settings(
    current_user: User = Depends(get_current_user_from_request),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    """Reset all settings to default values."""
    return SettingRepository.reset_to_defaults(db, current_user.id)
