"""User endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserRead

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
def get_current_user(db: Session = Depends(get_db)) -> UserRead:
    """Return the default authenticated host user (Vinayak)."""
    user = UserRepository.get_default_host(db)
    return UserRead.model_validate(user)
