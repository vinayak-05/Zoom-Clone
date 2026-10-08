"""Tests for settings, auth, and AI assistant endpoints."""

import pytest
from starlette.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_auth_login_vinayak(client):
    res = client.post("/api/v1/auth/login", json={"email": "vinayak@zoomclone.com"})
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["name"] == "Vinayak"
    assert "access_token" in data


def test_auth_logout(client):
    res = client.post("/api/v1/auth/logout")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_get_settings(client):
    res = client.get("/api/v1/settings")
    assert res.status_code == 200
    data = res.json()
    assert "host_video" in data
    assert "clips_avatars" in data
    assert data["clips_avatars"] is True


def test_update_single_setting(client):
    res = client.patch("/api/v1/settings", json={"key": "clips_avatars", "value": False})
    assert res.status_code == 200
    data = res.json()
    assert data["clips_avatars"] is False

    # Restore
    client.patch("/api/v1/settings", json={"key": "clips_avatars", "value": True})


def test_ai_assistant_chat(client):
    res = client.post("/api/v1/assistant/chat", json={"message": "How do I configure my settings?"})
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data["reply"]) > 5
