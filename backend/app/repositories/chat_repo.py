"""Chat repository for database access."""

from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.chat_message import ChatMessage


class ChatRepository:
    """Encapsulates all database operations for ChatMessage records."""

    @staticmethod
    def create(db: Session, message: ChatMessage) -> ChatMessage:
        db.add(message)
        db.commit()
        db.refresh(message)
        return message

    @staticmethod
    def list_by_meeting(db: Session, meeting_id: int) -> list[ChatMessage]:
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.meeting_id == meeting_id)
            .order_by(ChatMessage.created_at.asc())
        )
        return list(db.scalars(stmt).all())
