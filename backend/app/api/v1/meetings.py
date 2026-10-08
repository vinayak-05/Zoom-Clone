"""Meeting endpoints."""

from typing import Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.user_repo import UserRepository
from app.schemas.meeting import (
    MeetingCreateInstant,
    MeetingCreateScheduled,
    MeetingUpdate,
    MeetingRead,
    MeetingValidationResponse,
)
from app.schemas.participant import (
    ParticipantJoinRequest,
    ParticipantJoinResponse,
    ParticipantRead,
)
from app.schemas.chat_message import ChatMessageCreate, ChatMessageRead
from app.services.meeting_service import MeetingService
from app.services.participant_service import ParticipantService
from app.services.chat_service import ChatService

router = APIRouter(prefix="/meetings", tags=["Meetings"])


@router.post("/instant", status_code=status.HTTP_201_CREATED)
def create_instant_meeting(
    data: MeetingCreateInstant = MeetingCreateInstant(),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Create an instant meeting, set status to live, and return host participant and invite link."""
    host_user = UserRepository.get_default_host(db)
    return MeetingService.create_instant_meeting(db, host_user, data)


@router.post("/schedule", status_code=status.HTTP_201_CREATED)
def schedule_meeting(
    data: MeetingCreateScheduled,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Schedule a future meeting with validation on start datetime and duration."""
    host_user = UserRepository.get_default_host(db)
    return MeetingService.create_scheduled_meeting(db, host_user, data)


@router.get("", response_model=list[MeetingRead])
def list_meetings(
    filter: str = Query("upcoming", pattern="^(upcoming|recent|all)$"),
    db: Session = Depends(get_db),
) -> list[MeetingRead]:
    """List meetings for current user, filtered by upcoming, recent, or all."""
    host_user = UserRepository.get_default_host(db)
    return MeetingService.list_meetings(db, host_user.id, filter)


@router.get("/{id}", response_model=MeetingRead)
def get_meeting(id: int, db: Session = Depends(get_db)) -> MeetingRead:
    """Get meeting details by primary key ID."""
    return MeetingService.get_meeting_by_id(db, id)


@router.patch("/{id}", response_model=MeetingRead)
def update_meeting(
    id: int,
    data: MeetingUpdate,
    db: Session = Depends(get_db),
) -> MeetingRead:
    """Update meeting configuration."""
    return MeetingService.update_meeting(db, id, data)


@router.delete("/{id}")
def cancel_meeting(id: int, db: Session = Depends(get_db)) -> dict[str, str]:
    """Cancel a scheduled meeting."""
    return MeetingService.delete_meeting(db, id)


@router.get("/code/{code}/validate", response_model=MeetingValidationResponse)
def validate_meeting_code(code: str, db: Session = Depends(get_db)) -> MeetingValidationResponse:
    """Validate meeting code or invite link.

    Returns 404 if code does not exist, 410 if meeting has ended/cancelled.
    """
    return MeetingService.validate_meeting_code(db, code)


@router.post("/code/{code}/join", response_model=ParticipantJoinResponse)
def join_meeting(
    code: str,
    data: ParticipantJoinRequest,
    db: Session = Depends(get_db),
) -> ParticipantJoinResponse:
    """Join a meeting session. Creates a participant row for this join session."""
    return ParticipantService.join_meeting(db, code, data)


@router.post("/code/{code}/leave")
def leave_meeting(
    code: str,
    participant_id: int = Query(...),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Leave the meeting session."""
    return ParticipantService.leave_meeting(db, code, participant_id)


@router.post("/code/{code}/end")
def end_meeting(code: str, db: Session = Depends(get_db)) -> dict[str, str]:
    """End the meeting for all participants (host only action)."""
    return MeetingService.end_meeting(db, code)


@router.get("/code/{code}/participants", response_model=list[ParticipantRead])
def get_participants(code: str, db: Session = Depends(get_db)) -> list[ParticipantRead]:
    """Get active participants in the meeting."""
    return ParticipantService.get_participants(db, code)


@router.post("/code/{code}/mute-all", response_model=list[ParticipantRead])
def mute_all_participants(code: str, db: Session = Depends(get_db)) -> list[ParticipantRead]:
    """Mute all participants except host."""
    return ParticipantService.mute_all(db, code)


@router.get("/code/{code}/messages", response_model=list[ChatMessageRead])
def get_chat_messages(code: str, db: Session = Depends(get_db)) -> list[ChatMessageRead]:
    """Retrieve chat history for this meeting."""
    return ChatService.get_messages(db, code)


@router.post("/code/{code}/messages", response_model=ChatMessageRead, status_code=status.HTTP_201_CREATED)
def send_chat_message(
    code: str,
    data: ChatMessageCreate,
    db: Session = Depends(get_db),
) -> ChatMessageRead:
    """Send an in-meeting chat message."""
    return ChatService.send_message(db, code, data)
