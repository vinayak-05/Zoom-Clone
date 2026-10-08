"""Integration tests for meetings endpoints, validation, and participant flow."""

from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.base import Base
from app.db.session import engine
from app.db.seed import run_seed


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    run_seed()


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_get_current_user(client):
    response = client.get("/api/v1/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Vinayak"
    assert data["email"] in ("vinayak@zoomclone.com", "vinayak@zoomclone.local")
    assert "personal_meeting_id" in data


def test_list_upcoming_meetings(client):
    response = client.get("/api/v1/meetings?filter=upcoming")
    assert response.status_code == 200
    meetings = response.json()
    assert isinstance(meetings, list)
    assert len(meetings) >= 1
    for m in meetings:
        assert m["status"] in ("scheduled", "live")
        assert "meeting_code" in m
        assert "invite_link" in m


def test_list_recent_meetings(client):
    response = client.get("/api/v1/meetings?filter=recent")
    assert response.status_code == 200
    meetings = response.json()
    assert isinstance(meetings, list)
    assert len(meetings) >= 1
    for m in meetings:
        assert m["status"] == "ended"


def test_create_instant_meeting(client):
    response = client.post("/api/v1/meetings/instant", json={"title": "Test Instant Meeting"})
    assert response.status_code == 201
    data = response.json()
    assert "meeting" in data
    assert "invite_link" in data
    assert data["meeting"]["status"] == "live"
    assert data["meeting"]["type"] == "instant"
    code = data["meeting"]["meeting_code"]
    assert len(code) == 10

    # Validate code
    val_resp = client.get(f"/api/v1/meetings/code/{code}/validate")
    assert val_resp.status_code == 200
    assert val_resp.json()["exists"] is True


def test_create_scheduled_meeting(client):
    start_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    payload = {
        "title": "Architecture Review",
        "description": "Discuss system architecture and WebSockets",
        "scheduled_start": start_time,
        "duration_minutes": 45,
        "timezone": "Asia/Kolkata",
        "passcode": "SECRET12",
        "waiting_room": True,
        "host_video_default": True,
        "participant_video_default": False,
    }
    response = client.post("/api/v1/meetings/schedule", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["meeting"]["title"] == "Architecture Review"
    assert data["meeting"]["passcode"] == "SECRET12"
    assert "SECRET12" in data["invite_link"]


def test_schedule_meeting_invalid_duration(client):
    start_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    payload = {
        "title": "Bad Meeting",
        "scheduled_start": start_time,
        "duration_minutes": 0,  # Invalid
    }
    response = client.post("/api/v1/meetings/schedule", json=payload)
    assert response.status_code == 422


def test_validate_meeting_code_not_found(client):
    response = client.get("/api/v1/meetings/code/0000000000/validate")
    assert response.status_code == 404


def test_join_meeting_flow(client):
    # 1. Create instant meeting
    create_resp = client.post("/api/v1/meetings/instant", json={"title": "Join Test Room"})
    assert create_resp.status_code == 201
    code = create_resp.json()["meeting"]["meeting_code"]

    # 2. Join as guest
    join_payload = {
        "display_name": "Alice Tester",
        "is_muted": True,
        "is_video_off": False,
    }
    join_resp = client.post(f"/api/v1/meetings/code/{code}/join", json=join_payload)
    assert join_resp.status_code == 200
    join_data = join_resp.json()
    assert join_data["participant"]["display_name"] == "Alice Tester"
    assert join_data["participant"]["is_muted"] is True
    pid = join_data["participant"]["id"]

    # 3. Check participants list
    parts_resp = client.get(f"/api/v1/meetings/code/{code}/participants")
    assert parts_resp.status_code == 200
    p_names = [p["display_name"] for p in parts_resp.json()]
    assert "Alice Tester" in p_names

    # 4. Leave meeting
    leave_resp = client.post(f"/api/v1/meetings/code/{code}/leave?participant_id={pid}")
    assert leave_resp.status_code == 200

    # 5. End meeting as host
    end_resp = client.post(f"/api/v1/meetings/code/{code}/end")
    assert end_resp.status_code == 200

    # 6. Validate now returns 410 Gone
    val_ended = client.get(f"/api/v1/meetings/code/{code}/validate")
    assert val_ended.status_code == 410
