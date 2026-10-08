"""Meeting service handling business logic for meeting creation, validation, and lifecycle."""

from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.meeting import Meeting, MeetingType, MeetingStatus
from app.models.participant import Participant, ParticipantRole
from app.models.user import User
from app.schemas.meeting import (
    MeetingCreateInstant,
    MeetingCreateScheduled,
    MeetingUpdate,
    MeetingRead,
    MeetingValidationResponse,
)
from app.schemas.user import UserRead
from app.repositories.meeting_repo import MeetingRepository
from app.repositories.participant_repo import ParticipantRepository
from app.utils.meeting_code import generate_meeting_code, format_meeting_code, parse_meeting_code


class MeetingService:
    """Business logic for Meeting workflows."""

    @classmethod
    def _generate_unique_code(cls, db: Session, max_retries: int = 10) -> str:
        """Generate a random 10-digit numeric code with collision retry."""
        for _ in range(max_retries):
            code = generate_meeting_code()
            if not MeetingRepository.code_exists(db, code):
                return code
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate a unique meeting code after multiple attempts.",
        )

    @classmethod
    def _build_invite_link(cls, meeting_code: str, passcode: str | None = None) -> str:
        base_link = f"{settings.FRONTEND_URL}/join/{meeting_code}"
        if passcode:
            return f"{base_link}?pwd={passcode}"
        return base_link

    @classmethod
    def to_read_dto(cls, meeting: Meeting, db: Session) -> MeetingRead:
        active_participants = ParticipantRepository.get_active_participants(db, meeting.id)
        host_dto = UserRead.model_validate(meeting.host) if meeting.host else None
        return MeetingRead(
            id=meeting.id,
            meeting_code=meeting.meeting_code,
            title=meeting.title,
            description=meeting.description,
            host_id=meeting.host_id,
            type=meeting.type,
            status=meeting.status,
            scheduled_start=meeting.scheduled_start,
            duration_minutes=meeting.duration_minutes,
            timezone=meeting.timezone,
            passcode=meeting.passcode,
            waiting_room=meeting.waiting_room,
            host_video_default=meeting.host_video_default,
            participant_video_default=meeting.participant_video_default,
            started_at=meeting.started_at,
            ended_at=meeting.ended_at,
            created_at=meeting.created_at,
            updated_at=meeting.updated_at,
            formatted_code=format_meeting_code(meeting.meeting_code),
            invite_link=cls._build_invite_link(meeting.meeting_code, meeting.passcode),
            host=host_dto,
            participant_count=len(active_participants),
        )

    @classmethod
    def create_instant_meeting(
        cls,
        db: Session,
        host_user: User,
        data: MeetingCreateInstant,
    ) -> dict:
        """Create an instant meeting, set status to LIVE, and add host participant."""
        code = cls._generate_unique_code(db)
        now = datetime.now(timezone.utc)

        meeting = Meeting(
            meeting_code=code,
            title=data.title or f"{host_user.name}'s Instant Meeting",
            description=None,
            host_id=host_user.id,
            type=MeetingType.INSTANT.value,
            status=MeetingStatus.LIVE.value,
            timezone=host_user.timezone,
            host_video_default=data.host_video_default,
            participant_video_default=data.participant_video_default,
            started_at=now,
        )
        meeting = MeetingRepository.create(db, meeting)

        # Host automatically joins
        host_participant = Participant(
            meeting_id=meeting.id,
            user_id=host_user.id,
            display_name=host_user.name,
            role=ParticipantRole.HOST.value,
            is_muted=False,
            is_video_off=not data.host_video_default,
            joined_at=now,
        )
        host_participant = ParticipantRepository.create(db, host_participant)

        invite_link = cls._build_invite_link(code, meeting.passcode)
        return {
            "meeting": cls.to_read_dto(meeting, db),
            "invite_link": invite_link,
            "host_participant_id": host_participant.id,
        }

    @classmethod
    def create_scheduled_meeting(
        cls,
        db: Session,
        host_user: User,
        data: MeetingCreateScheduled,
    ) -> dict:
        """Create a scheduled meeting."""
        code = cls._generate_unique_code(db)
        meeting = Meeting(
            meeting_code=code,
            title=data.title,
            description=data.description,
            host_id=host_user.id,
            type=MeetingType.SCHEDULED.value,
            status=MeetingStatus.SCHEDULED.value,
            scheduled_start=data.scheduled_start,
            duration_minutes=data.duration_minutes,
            timezone=data.timezone,
            passcode=data.passcode,
            waiting_room=data.waiting_room,
            host_video_default=data.host_video_default,
            participant_video_default=data.participant_video_default,
        )
        meeting = MeetingRepository.create(db, meeting)
        invite_link = cls._build_invite_link(code, meeting.passcode)
        return {
            "meeting": cls.to_read_dto(meeting, db),
            "invite_link": invite_link,
        }

    @classmethod
    def list_meetings(
        cls,
        db: Session,
        host_id: int,
        filter_type: str = "upcoming",
    ) -> list[MeetingRead]:
        """List meetings filtered by upcoming, recent, or all."""
        filter_type = filter_type.lower()
        if filter_type == "upcoming":
            meetings = MeetingRepository.list_upcoming(db, host_id)
        elif filter_type == "recent":
            meetings = MeetingRepository.list_recent(db, host_id)
        else:
            meetings = MeetingRepository.list_all(db, host_id)

        return [cls.to_read_dto(m, db) for m in meetings]

    @classmethod
    def get_meeting_by_id(cls, db: Session, meeting_id: int) -> MeetingRead:
        meeting = MeetingRepository.get_by_id(db, meeting_id)
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting with ID {meeting_id} not found.",
            )
        return cls.to_read_dto(meeting, db)

    @classmethod
    def get_meeting_by_code(cls, db: Session, code: str) -> Meeting:
        parsed_code = parse_meeting_code(code) or code
        meeting = MeetingRepository.get_by_code(db, parsed_code)
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting with code '{code}' not found.",
            )
        return meeting

    @classmethod
    def validate_meeting_code(cls, db: Session, code: str) -> MeetingValidationResponse:
        """Validate a meeting code or invite link.

        Returns 404 for non-existent code, 410 for ended/cancelled meeting.
        """
        parsed_code = parse_meeting_code(code)
        if not parsed_code:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid meeting ID format.",
            )

        meeting = MeetingRepository.get_by_code(db, parsed_code)
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found. Please check the meeting ID.",
            )

        if meeting.status in (MeetingStatus.ENDED.value, MeetingStatus.CANCELLED.value):
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail=f"This meeting has already {meeting.status}.",
            )

        host_name = meeting.host.name if meeting.host else "Host"
        return MeetingValidationResponse(
            exists=True,
            status=meeting.status,
            title=meeting.title,
            host_name=host_name,
            has_passcode=bool(meeting.passcode),
            passcode=meeting.passcode,
            waiting_room=meeting.waiting_room,
            formatted_code=format_meeting_code(meeting.meeting_code),
        )

    @classmethod
    def update_meeting(cls, db: Session, meeting_id: int, data: MeetingUpdate) -> MeetingRead:
        meeting = MeetingRepository.get_by_id(db, meeting_id)
        if not meeting:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
        update_dict = data.model_dump(exclude_unset=True)
        updated = MeetingRepository.update(db, meeting, update_dict)
        return cls.to_read_dto(updated, db)

    @classmethod
    def delete_meeting(cls, db: Session, meeting_id: int) -> dict[str, str]:
        meeting = MeetingRepository.get_by_id(db, meeting_id)
        if not meeting:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
        # Mark as cancelled instead of hard deleting to preserve integrity
        MeetingRepository.update(db, meeting, {"status": MeetingStatus.CANCELLED.value})
        return {"message": "Meeting successfully cancelled."}

    @classmethod
    def end_meeting(cls, db: Session, code: str) -> dict[str, str]:
        """End the meeting for all participants (host only)."""
        parsed_code = parse_meeting_code(code) or code
        meeting = MeetingRepository.get_by_code(db, parsed_code)
        if not meeting:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")

        now = datetime.now(timezone.utc)
        MeetingRepository.update(
            db,
            meeting,
            {
                "status": MeetingStatus.ENDED.value,
                "ended_at": now,
            },
        )
        ParticipantRepository.mark_all_left(db, meeting.id)
        return {"message": "Meeting ended for all participants."}
