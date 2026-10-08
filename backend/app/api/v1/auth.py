"""Authentication API endpoints for Zoom Clone."""

import random
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserRead
from app.repositories.user_repo import UserRepository

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None


class SignupRequest(BaseModel):
    name: str
    email: str
    password: Optional[str] = None


class AuthResponse(BaseModel):
    user: UserRead
    access_token: str
    token_type: str = "bearer"
    message: str = "Success"


def generate_pmi() -> str:
    """Generate a unique 10-digit Personal Meeting ID."""
    return f"{random.randint(100, 999)}{random.randint(1000, 9999)}{random.randint(100, 999)}"


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    """Authenticate user with email or auto-provision if not found."""
    cleaned_email = payload.email.strip().lower()

    # Fast match for "vinayak" or default user
    if "vinayak" in cleaned_email:
        user = UserRepository.get_default_host(db)
        return AuthResponse(
            user=UserRead.model_validate(user),
            access_token=f"zoom_tok_{user.id}_active",
            message="Logged in as host",
        )

    # Search by email
    stmt = select(User).where(User.email == cleaned_email)
    user = db.scalars(stmt).first()

    if not user:
        # Create a new user account seamlessly
        display_name = cleaned_email.split("@")[0].replace(".", " ").title()
        pmi = generate_pmi()
        user = User(
            name=display_name,
            email=cleaned_email,
            personal_meeting_id=pmi,
            timezone="Asia/Kolkata",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return AuthResponse(
        user=UserRead.model_validate(user),
        access_token=f"zoom_tok_{user.id}_active",
        message="Logged in successfully",
    )


@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> AuthResponse:
    """Register a new user."""
    cleaned_email = payload.email.strip().lower()

    stmt = select(User).where(User.email == cleaned_email)
    existing = db.scalars(stmt).first()
    if existing:
        return AuthResponse(
            user=UserRead.model_validate(existing),
            access_token=f"zoom_tok_{existing.id}_active",
            message="Account already exists, logged in",
        )

    pmi = generate_pmi()
    user = User(
        name=payload.name.strip(),
        email=cleaned_email,
        personal_meeting_id=pmi,
        timezone="Asia/Kolkata",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return AuthResponse(
        user=UserRead.model_validate(user),
        access_token=f"zoom_tok_{user.id}_active",
        message="Account created successfully",
    )


@router.get("/me", response_model=UserRead)
def get_current_user(db: Session = Depends(get_db)) -> UserRead:
    """Get currently active authenticated user."""
    user = UserRepository.get_default_host(db)
    return UserRead.model_validate(user)


@router.post("/logout")
def logout() -> dict[str, str]:
    """Logout endpoint."""
    return {"status": "ok", "message": "Logged out successfully"}
