"""User repository for database access."""

from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.user import User


class UserRepository:
    """Encapsulates all database operations for User records."""

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> User | None:
        return db.get(User, user_id)

    @staticmethod
    def get_by_email(db: Session, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return db.scalars(stmt).first()

    @staticmethod
    def get_default_host(db: Session) -> User:
        """Fetch the default host user (Guest)."""
        stmt = select(User).where(
            User.email.in_([
                "guest@zoomclone.com",
                "guest@zomclone.com",
                "guest@zoomclone.local",
            ])
        )
        user = db.scalars(stmt).first()
        if not user:
            user = db.scalars(select(User).where(User.name == "Guest")).first()
        if not user:
            # Fallback to the first available user in DB
            user = db.scalars(select(User)).first()
        if not user:
            raise RuntimeError("Database not seeded: default user not found.")
        return user

    @staticmethod
    def create(db: Session, user: User) -> User:
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
