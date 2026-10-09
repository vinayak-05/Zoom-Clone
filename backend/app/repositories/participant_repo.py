"""Participant repository for database access."""

from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, update
from app.models.participant import Participant, ParticipantRole


class ParticipantRepository:
    """Encapsulates all database operations for Participant records."""

    @staticmethod
    def get_by_id(db: Session, participant_id: int) -> Participant | None:
        return db.get(Participant, participant_id)

    @staticmethod
    def create(db: Session, participant: Participant) -> Participant:
        db.add(participant)
        db.commit()
        db.refresh(participant)
        return participant

    @staticmethod
    def get_active_participants(db: Session, meeting_id: int) -> list[Participant]:
        """Fetch all currently active participants in a meeting."""
        stmt = (
            select(Participant)
            .where(
                Participant.meeting_id == meeting_id,
                Participant.left_at.is_(None),
                Participant.is_removed.is_(False),
            )
            .order_by(Participant.joined_at.asc())
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_all_by_meeting(db: Session, meeting_id: int) -> list[Participant]:
        stmt = (
            select(Participant)
            .where(Participant.meeting_id == meeting_id)
            .order_by(Participant.joined_at.asc())
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_active_by_user(db: Session, meeting_id: int, user_id: int) -> Participant | None:
        stmt = (
            select(Participant)
            .where(
                Participant.meeting_id == meeting_id,
                Participant.user_id == user_id,
                Participant.left_at.is_(None),
                Participant.is_removed.is_(False),
            )
            .order_by(Participant.joined_at.desc())
        )
        return db.scalars(stmt).first()

    @staticmethod
    def cleanup_duplicate_user_sessions(db: Session, meeting_id: int, user_id: int, keep_id: int) -> None:
        """Mark all other active sessions for this user in this meeting as left."""
        stmt = (
            update(Participant)
            .where(
                Participant.meeting_id == meeting_id,
                Participant.user_id == user_id,
                Participant.id != keep_id,
                Participant.left_at.is_(None),
            )
            .values(left_at=datetime.now(timezone.utc))
        )
        db.execute(stmt)
        db.commit()

    @staticmethod
    def mark_left(db: Session, participant: Participant) -> Participant:
        participant.left_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(participant)
        return participant

    @staticmethod
    def mark_all_left(db: Session, meeting_id: int) -> None:
        now = datetime.now(timezone.utc)
        stmt = (
            update(Participant)
            .where(
                Participant.meeting_id == meeting_id,
                Participant.left_at.is_(None),
            )
            .values(left_at=now)
        )
        db.execute(stmt)
        db.commit()

    @staticmethod
    def remove_participant(db: Session, participant: Participant) -> Participant:
        participant.is_removed = True
        participant.left_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(participant)
        return participant

    @staticmethod
    def mute_participant(db: Session, participant: Participant, is_muted: bool) -> Participant:
        participant.is_muted = is_muted
        db.commit()
        db.refresh(participant)
        return participant

    @staticmethod
    def mute_all_except_host(db: Session, meeting_id: int) -> list[Participant]:
        stmt = (
            select(Participant)
            .where(
                Participant.meeting_id == meeting_id,
                Participant.role != ParticipantRole.HOST.value,
                Participant.left_at.is_(None),
                Participant.is_removed.is_(False),
            )
        )
        participants = list(db.scalars(stmt).all())
        for p in participants:
            p.is_muted = True
        db.commit()
        return participants

    @staticmethod
    def update_flags(
        db: Session,
        participant: Participant,
        is_muted: bool | None = None,
        is_video_off: bool | None = None,
        is_hand_raised: bool | None = None,
    ) -> Participant:
        if is_muted is not None:
            participant.is_muted = is_muted
        if is_video_off is not None:
            participant.is_video_off = is_video_off
        if is_hand_raised is not None:
            participant.is_hand_raised = is_hand_raised
        db.commit()
        db.refresh(participant)
        return participant
