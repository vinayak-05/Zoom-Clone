"""Chat service for handling in-meeting messages."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.chat_message import ChatMessage
from app.schemas.chat_message import ChatMessageCreate, ChatMessageRead
from app.repositories.meeting_repo import MeetingRepository
from app.repositories.participant_repo import ParticipantRepository
from app.repositories.chat_repo import ChatRepository
from app.utils.meeting_code import parse_meeting_code


class ChatService:
    """Business logic for In-Meeting Chat."""

    @classmethod
    def send_message(
        cls,
        db: Session,
        code: str,
        data: ChatMessageCreate,
    ) -> ChatMessageRead:
        parsed_code = parse_meeting_code(code) or code
        meeting = MeetingRepository.get_by_code(db, parsed_code)
        if not meeting:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")

        participant = ParticipantRepository.get_by_id(db, data.participant_id)
        if not participant or participant.meeting_id != meeting.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid participant for this meeting.",
            )

        msg = ChatMessage(
            meeting_id=meeting.id,
            participant_id=participant.id,
            content=data.content.strip(),
        )
        msg = ChatRepository.create(db, msg)

        return ChatMessageRead(
            id=msg.id,
            meeting_id=msg.meeting_id,
            participant_id=msg.participant_id,
            content=msg.content,
            created_at=msg.created_at,
            sender_name=participant.display_name,
        )

    @classmethod
    def get_messages(cls, db: Session, code: str) -> list[ChatMessageRead]:
        parsed_code = parse_meeting_code(code) or code
        meeting = MeetingRepository.get_by_code(db, parsed_code)
        if not meeting:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")

        messages = ChatRepository.list_by_meeting(db, meeting.id)
        results = []
        for m in messages:
            results.append(
                ChatMessageRead(
                    id=m.id,
                    meeting_id=m.meeting_id,
                    participant_id=m.participant_id,
                    content=m.content,
                    created_at=m.created_at,
                    sender_name=m.participant.display_name if m.participant else "Unknown",
                )
            )
        return results
