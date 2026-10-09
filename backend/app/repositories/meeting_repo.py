"""Meeting repository for database access."""

from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, and_, desc, asc
from app.models.meeting import Meeting, MeetingStatus


class MeetingRepository:
    """Encapsulates all database operations for Meeting records."""

    @staticmethod
    def get_by_id(db: Session, meeting_id: int) -> Meeting | None:
        return db.get(Meeting, meeting_id)

    @staticmethod
    def get_by_code(db: Session, meeting_code: str) -> Meeting | None:
        stmt = select(Meeting).where(Meeting.meeting_code == meeting_code)
        return db.scalars(stmt).first()

    @staticmethod
    def code_exists(db: Session, meeting_code: str) -> bool:
        stmt = select(Meeting.id).where(Meeting.meeting_code == meeting_code)
        return db.scalars(stmt).first() is not None

    @staticmethod
    def create(db: Session, meeting: Meeting) -> Meeting:
        db.add(meeting)
        db.commit()
        db.refresh(meeting)
        return meeting

    @staticmethod
    def update(db: Session, meeting: Meeting, update_data: dict) -> Meeting:
        for key, value in update_data.items():
            if hasattr(meeting, key):
                setattr(meeting, key, value)
        meeting.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(meeting)
        return meeting

    @staticmethod
    def delete(db: Session, meeting: Meeting) -> None:
        db.delete(meeting)
        db.commit()

    @staticmethod
    def list_upcoming(db: Session, host_id: int) -> list[Meeting]:
        """Upcoming meetings: status in [scheduled, live], scheduled_start >= now or is live/personal."""
        now = datetime.now(timezone.utc)
        stmt = (
            select(Meeting)
            .distinct()
            .where(
                Meeting.host_id == host_id,
                Meeting.status.in_([MeetingStatus.SCHEDULED.value, MeetingStatus.LIVE.value]),
                or_(
                    Meeting.scheduled_start >= now,
                    Meeting.scheduled_start.is_(None),  # Personal rooms or instant
                    Meeting.status == MeetingStatus.LIVE.value,
                ),
            )
            .order_by(
                asc(Meeting.scheduled_start.is_(None)),  # Scheduled ones first
                asc(Meeting.scheduled_start),
                asc(Meeting.created_at),
            )
        )
        seen = set()
        results = []
        for m in db.scalars(stmt).all():
            if m.id not in seen:
                seen.add(m.id)
                results.append(m)
        return results

    @staticmethod
    def list_recent(db: Session, host_id: int) -> list[Meeting]:
        """Recent meetings: status == ended, sorted by ended_at/started_at descending."""
        stmt = (
            select(Meeting)
            .distinct()
            .where(
                Meeting.host_id == host_id,
                Meeting.status == MeetingStatus.ENDED.value,
            )
            .order_by(
                desc(Meeting.ended_at),
                desc(Meeting.started_at),
                desc(Meeting.created_at),
            )
        )
        seen = set()
        results = []
        for m in db.scalars(stmt).all():
            if m.id not in seen:
                seen.add(m.id)
                results.append(m)
        return results

    @staticmethod
    def list_all(db: Session, host_id: int) -> list[Meeting]:
        stmt = (
            select(Meeting)
            .distinct()
            .where(Meeting.host_id == host_id)
            .order_by(desc(Meeting.created_at))
        )
        seen = set()
        results = []
        for m in db.scalars(stmt).all():
            if m.id not in seen:
                seen.add(m.id)
                results.append(m)
        return results
