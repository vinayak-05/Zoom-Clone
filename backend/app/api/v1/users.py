"""User endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_user_from_request
from app.schemas.user import UserRead

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
def get_current_user(current_user: User = Depends(get_current_user_from_request)) -> UserRead:
    """Return the currently authenticated user (or default Guest)."""
    return UserRead.model_validate(current_user)
