"""Shared API dependencies."""

from fastapi import Depends, Header
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repo import UserRepository


def get_current_user_from_request(
    authorization: str | None = Header(None),
    x_user_email: str | None = Header(None),
    x_user_id: str | None = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """Identify the requesting user via headers (email, id, or bearer token) or fallback to default Guest."""
    user = None

    if x_user_email:
        clean = x_user_email.strip().lower()
        user = db.scalars(select(User).where(User.email == clean)).first()

    if not user and x_user_id:
        try:
            uid = int(x_user_id)
            user = db.get(User, uid)
        except (ValueError, TypeError):
            pass

    if not user and authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1].strip()
        parts = token.split("_")
        # Format: zoom_tok_{user_id}_active or zoom_tok_{user_id}_{provider}
        if len(parts) >= 3 and parts[0] == "zoom" and parts[1] == "tok":
            try:
                uid = int(parts[2])
                user = db.get(User, uid)
            except (ValueError, TypeError):
                pass

    if not user:
        user = UserRepository.get_default_host(db)

    return user
