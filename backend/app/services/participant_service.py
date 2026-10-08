"""Participant service handling joining, leaving, host controls, and state flags."""

from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.meeting import Meeting, MeetingStatus
from app.models.participant import Participant, ParticipantRole
from app.models.user import User
from app.schemas.participant import (
    ParticipantJoinRequest,
    ParticipantJoinResponse,
    ParticipantRead,
)
from app.repositories.meeting_repo import MeetingRepository
from app.repositories.participant_repo import ParticipantRepository
from app.utils.meeting_code import parse_meeting_code


class ParticipantService:
    """Business logic for Participant actions."""

    @classmethod
    def join_meeting(
        cls,
        db: Session,
        code: str,
        data: ParticipantJoinRequest,
    ) -> ParticipantJoinResponse:
        """Process a participant joining a meeting session."""
        parsed_code = parse_meeting_code(code) or code
        meeting = MeetingRepository.get_by_code(db, parsed_code)
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting does not exist.",
            )

        if meeting.status in (MeetingStatus.ENDED.value, MeetingStatus.CANCELLED.value):
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail=f"Cannot join. This meeting has {meeting.status}.",
            )

        # Validate passcode if meeting has one configured
        if meeting.passcode:
            if not data.passcode or data.passcode.strip() != meeting.passcode.strip():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invalid meeting passcode.",
                )

        now = datetime.now(timezone.utc)

        # If meeting was scheduled, transition to LIVE when host or first user enters
        if meeting.status == MeetingStatus.SCHEDULED.value:
            meeting.status = MeetingStatus.LIVE.value
            if not meeting.started_at:
                meeting.started_at = now
            db.commit()

        # Safely resolve user_id against database foreign key
        actual_user_id = data.user_id
        if actual_user_id is not None:
            user_rec = db.get(User, actual_user_id) if actual_user_id > 0 else None
            if not user_rec:
                # If display name matches host name, link to host_id
                if meeting.host and data.display_name.strip().lower() == meeting.host.name.lower():
                    actual_user_id = meeting.host_id
                else:
                    actual_user_id = None
            else:
                actual_user_id = user_rec.id

        # Determine role
        is_host = (actual_user_id is not None and actual_user_id == meeting.host_id)
        if not is_host and meeting.host:
            is_host = (data.display_name.strip().lower() == meeting.host.name.lower())
        role = ParticipantRole.HOST.value if is_host else ParticipantRole.PARTICIPANT.value

        # Reuse existing active session if user already joined this meeting
        if actual_user_id is not None:
            existing = ParticipantRepository.get_active_by_user(db, meeting.id, actual_user_id)
            if existing:
                existing.display_name = data.display_name.strip()
                existing.is_muted = data.is_muted
                existing.is_video_off = data.is_video_off
                existing.role = role
                db.commit()
                db.refresh(existing)
                ParticipantRepository.cleanup_duplicate_user_sessions(db, meeting.id, actual_user_id, existing.id)
                return ParticipantJoinResponse(
                    participant=ParticipantRead.model_validate(existing),
                    meeting_id=meeting.id,
                    meeting_code=meeting.meeting_code,
                    title=meeting.title,
                    is_host=is_host,
                )

        # Create new join session row
        participant = Participant(
            meeting_id=meeting.id,
            user_id=actual_user_id,
            display_name=data.display_name.strip(),
            role=role,
            is_muted=data.is_muted,
            is_video_off=data.is_video_off,
            joined_at=now,
        )
        participant = ParticipantRepository.create(db, participant)

        return ParticipantJoinResponse(
            participant=ParticipantRead.model_validate(participant),
            meeting_id=meeting.id,
            meeting_code=meeting.meeting_code,
            title=meeting.title,
            is_host=is_host,
        )

    @classmethod
    def leave_meeting(cls, db: Session, code: str, participant_id: int) -> dict[str, str]:
        participant = ParticipantRepository.get_by_id(db, participant_id)
        if not participant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Participant not found.",
            )
        ParticipantRepository.mark_left(db, participant)
        return {"message": "Successfully left the meeting."}

    @classmethod
    def get_participants(cls, db: Session, code: str) -> list[ParticipantRead]:
        parsed_code = parse_meeting_code(code) or code
        meeting = MeetingRepository.get_by_code(db, parsed_code)
        if not meeting:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
        participants = ParticipantRepository.get_active_participants(db, meeting.id)
        return [ParticipantRead.model_validate(p) for p in participants]

    @classmethod
    def mute_participant(cls, db: Session, participant_id: int, is_muted: bool = True) -> ParticipantRead:
        participant = ParticipantRepository.get_by_id(db, participant_id)
        if not participant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found.")
        updated = ParticipantRepository.mute_participant(db, participant, is_muted=is_muted)
        return ParticipantRead.model_validate(updated)

    @classmethod
    def remove_participant(cls, db: Session, participant_id: int) -> ParticipantRead:
        participant = ParticipantRepository.get_by_id(db, participant_id)
        if not participant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found.")
        updated = ParticipantRepository.remove_participant(db, participant)
        return ParticipantRead.model_validate(updated)

    @classmethod
    def mute_all(cls, db: Session, code: str) -> list[ParticipantRead]:
        parsed_code = parse_meeting_code(code) or code
        meeting = MeetingRepository.get_by_code(db, parsed_code)
        if not meeting:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
        muted_list = ParticipantRepository.mute_all_except_host(db, meeting.id)
        return [ParticipantRead.model_validate(p) for p in muted_list]

    @classmethod
    def update_flags(
        cls,
        db: Session,
        participant_id: int,
        is_muted: bool | None = None,
        is_video_off: bool | None = None,
        is_hand_raised: bool | None = None,
    ) -> ParticipantRead:
        participant = ParticipantRepository.get_by_id(db, participant_id)
        if not participant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found.")
        updated = ParticipantRepository.update_flags(
            db,
            participant,
            is_muted=is_muted,
            is_video_off=is_video_off,
            is_hand_raised=is_hand_raised,
        )
        return ParticipantRead.model_validate(updated)
