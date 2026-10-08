"""Participant specific endpoints for host controls and state updates."""

from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.participant import ParticipantRead
from app.services.participant_service import ParticipantService

router = APIRouter(prefix="/participants", tags=["Participants"])


class ParticipantFlagsUpdate(BaseModel):
    is_muted: bool | None = None
    is_video_off: bool | None = None
    is_hand_raised: bool | None = None


@router.post("/{id}/mute", response_model=ParticipantRead)
def mute_participant(
    id: int,
    is_muted: bool = Query(True),
    db: Session = Depends(get_db),
) -> ParticipantRead:
    """Mute or unmute an individual participant."""
    return ParticipantService.mute_participant(db, id, is_muted=is_muted)


@router.post("/{id}/remove", response_model=ParticipantRead)
def remove_participant(id: int, db: Session = Depends(get_db)) -> ParticipantRead:
    """Remove a participant from the meeting (host control)."""
    return ParticipantService.remove_participant(db, id)


@router.patch("/{id}/flags", response_model=ParticipantRead)
def update_participant_flags(
    id: int,
    data: ParticipantFlagsUpdate,
    db: Session = Depends(get_db),
) -> ParticipantRead:
    """Update participant's local flags (mute, video, hand raise)."""
    return ParticipantService.update_flags(
        db,
        id,
        is_muted=data.is_muted,
        is_video_off=data.is_video_off,
        is_hand_raised=data.is_hand_raised,
    )
