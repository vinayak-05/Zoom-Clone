"""Idempotent seed script populating users, upcoming meetings, recent meetings, and personal room."""

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User
from app.models.meeting import Meeting, MeetingType, MeetingStatus
from app.models.participant import Participant, ParticipantRole
from app.models.chat_message import ChatMessage


def run_seed() -> None:
    """Populate initial database records if users table is empty."""
    db: Session = SessionLocal()
    try:
        # Check if already seeded
        existing_user = db.query(User).first()
        if existing_user is not None:
            return

        now = datetime.now(timezone.utc)

        # 1. Seed Users (Default user Vinayak + 5 team members)
        host_user = User(
            name="Vinayak",
            email="vinayak@zoomclone.com",
            avatar_url=None,
            personal_meeting_id="3829148201",
            timezone="Asia/Kolkata",
        )
        db.add(host_user)

        sample_users = [
            User(
                name="Sarah Connor",
                email="sarah.c@techcorp.io",
                avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
                personal_meeting_id="4920183921",
                timezone="America/Los_Angeles",
            ),
            User(
                name="Alex Chen",
                email="alex.chen@techcorp.io",
                avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
                personal_meeting_id="5819204910",
                timezone="America/New_York",
            ),
            User(
                name="Priya Sharma",
                email="priya.s@techcorp.io",
                avatar_url="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
                personal_meeting_id="6729104921",
                timezone="Asia/Kolkata",
            ),
            User(
                name="David Miller",
                email="david.m@techcorp.io",
                avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
                personal_meeting_id="7192840192",
                timezone="Europe/London",
            ),
            User(
                name="Elena Rostova",
                email="elena.r@techcorp.io",
                avatar_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
                personal_meeting_id="8192048102",
                timezone="Europe/Berlin",
            ),
        ]
        db.add_all(sample_users)
        db.flush()  # Obtain IDs

        # 2. Personal Meeting Room for Vinayak
        personal_room = Meeting(
            meeting_code=host_user.personal_meeting_id,
            title="Vinayak's Personal Meeting Room",
            description="My personal meeting room. Permanent meeting link for recurring 1:1s and quick syncs.",
            host_id=host_user.id,
            type=MeetingType.PERSONAL.value,
            status=MeetingStatus.SCHEDULED.value,
            timezone=host_user.timezone,
            passcode="2026PMI",
            waiting_room=True,
            host_video_default=True,
            participant_video_default=True,
        )
        db.add(personal_room)

        # 3. Upcoming Scheduled Meetings (Today and next 7 days)
        upcoming_meetings = [
            Meeting(
                meeting_code="8492018392",
                title="Weekly Engineering Standup",
                description="Cross-functional sync on sprint objectives, blockers, and milestone progress.",
                host_id=host_user.id,
                type=MeetingType.SCHEDULED.value,
                status=MeetingStatus.SCHEDULED.value,
                scheduled_start=now + timedelta(hours=1, minutes=30),
                duration_minutes=45,
                timezone="Asia/Kolkata",
                passcode="STANDUP1",
                waiting_room=False,
                host_video_default=True,
                participant_video_default=True,
            ),
            Meeting(
                meeting_code="9182736450",
                title="Product & Design Review",
                description="Review new high-fidelity Figma components and flow for Zoom Clone Phase 2.",
                host_id=host_user.id,
                type=MeetingType.SCHEDULED.value,
                status=MeetingStatus.SCHEDULED.value,
                scheduled_start=now + timedelta(days=1, hours=4),
                duration_minutes=60,
                timezone="Asia/Kolkata",
                passcode="DESIGN",
                waiting_room=True,
                host_video_default=True,
                participant_video_default=False,
            ),
            Meeting(
                meeting_code="4729103829",
                title="Sprint Planning - Q4 Deliverables",
                description="Refining the backlog, estimating story points, and committing to sprint velocity.",
                host_id=host_user.id,
                type=MeetingType.SCHEDULED.value,
                status=MeetingStatus.SCHEDULED.value,
                scheduled_start=now + timedelta(days=2, hours=2),
                duration_minutes=90,
                timezone="Asia/Kolkata",
                passcode="SPRINT",
                waiting_room=False,
                host_video_default=True,
                participant_video_default=True,
            ),
            Meeting(
                meeting_code="6291048201",
                title="1:1 with Engineering Manager",
                description="Bi-weekly career development, feedback, and architecture roadmapping.",
                host_id=host_user.id,
                type=MeetingType.SCHEDULED.value,
                status=MeetingStatus.SCHEDULED.value,
                scheduled_start=now + timedelta(days=3, hours=5),
                duration_minutes=30,
                timezone="Asia/Kolkata",
                passcode="ONEONONE",
                waiting_room=True,
                host_video_default=True,
                participant_video_default=True,
            ),
            Meeting(
                meeting_code="7391029482",
                title="Full-Stack Architecture Deep Dive",
                description="Evaluating WebSocket vs WebRTC data channels for low-latency host controls.",
                host_id=host_user.id,
                type=MeetingType.SCHEDULED.value,
                status=MeetingStatus.SCHEDULED.value,
                scheduled_start=now + timedelta(days=5, hours=3),
                duration_minutes=60,
                timezone="Asia/Kolkata",
                passcode="ARCH2026",
                waiting_room=False,
                host_video_default=True,
                participant_video_default=True,
            ),
        ]
        db.add_all(upcoming_meetings)

        # 4. Ended / Previous Meetings in past 2 weeks with participants and chat messages
        past_meetings_data = [
            (
                "Sprint Retrospective",
                "Review of what went well and areas for continuous improvement in sprint 12.",
                now - timedelta(days=1, hours=3),
                50,
                "5829104920",
                [host_user, sample_users[0], sample_users[1], sample_users[2]],
            ),
            (
                "WebRTC Signaling Refactoring",
                "Technical spike on mesh connection renegotiation and ICE candidate handling.",
                now - timedelta(days=3, hours=2),
                40,
                "3910294819",
                [host_user, sample_users[1], sample_users[3]],
            ),
            (
                "Security & Passcode Policy Review",
                "Compliance check on waiting room enforcement and role authorization.",
                now - timedelta(days=5, hours=4),
                30,
                "2019482019",
                [host_user, sample_users[0], sample_users[4]],
            ),
            (
                "Client Onboarding Demo",
                "Interactive walkthrough of the new Zoom Clone web interface and meeting features.",
                now - timedelta(days=8, hours=6),
                60,
                "8391029471",
                [host_user, sample_users[2], sample_users[3], sample_users[4]],
            ),
            (
                "Bug Bash & QA Sync",
                "Triage of reported UI layout regressions and responsive mobile fixes.",
                now - timedelta(days=11, hours=2),
                45,
                "7492018394",
                [host_user, sample_users[0], sample_users[1]],
            ),
            (
                "Kickoff: SDE Full-Stack Project",
                "Initial alignment on system requirements, schema design, and milestone schedule.",
                now - timedelta(days=13, hours=5),
                60,
                "9381029481",
                [host_user, sample_users[0], sample_users[1], sample_users[2], sample_users[3]],
            ),
        ]

        for title, desc, start_time, duration, code, participants in past_meetings_data:
            past_meeting = Meeting(
                meeting_code=code,
                title=title,
                description=desc,
                host_id=host_user.id,
                type=MeetingType.SCHEDULED.value,
                status=MeetingStatus.ENDED.value,
                scheduled_start=start_time,
                duration_minutes=duration,
                timezone="Asia/Kolkata",
                passcode="ZOOM26",
                waiting_room=False,
                started_at=start_time,
                ended_at=start_time + timedelta(minutes=duration),
            )
            db.add(past_meeting)
            db.flush()

            for p_user in participants:
                is_host = (p_user.id == host_user.id)
                participant = Participant(
                    meeting_id=past_meeting.id,
                    user_id=p_user.id,
                    display_name=p_user.name,
                    role=ParticipantRole.HOST.value if is_host else ParticipantRole.PARTICIPANT.value,
                    is_muted=not is_host,
                    is_video_off=False,
                    joined_at=start_time + timedelta(minutes=1),
                    left_at=start_time + timedelta(minutes=duration),
                )
                db.add(participant)
                db.flush()

                # Add sample chat message for some participants
                if not is_host:
                    db.add(ChatMessage(
                        meeting_id=past_meeting.id,
                        participant_id=participant.id,
                        content=f"Thanks for organizing, {host_user.name}! Notes look great.",
                        created_at=start_time + timedelta(minutes=duration - 5),
                    ))

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    from app.db.base import Base
    from app.db.session import engine
    Base.metadata.create_all(bind=engine)
    run_seed()
    print("Database seeded successfully.")
