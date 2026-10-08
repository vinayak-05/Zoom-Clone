"""Tests for settings, auth, and AI assistant endpoints."""

import random
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


def test_auth_check_email(client):
    # Existing email
    res1 = client.post("/api/v1/auth/check-email", json={"email": "vinayak@zoomclone.com"})
    assert res1.status_code == 200
    assert res1.json()["exists"] is True

    # Non-existing email
    res2 = client.post("/api/v1/auth/check-email", json={"email": "nonexistent_random_user@zoomclone.com"})
    assert res2.status_code == 200
    assert res2.json()["exists"] is False


def test_login_nonexistent_email_fails(client):
    res = client.post("/api/v1/auth/login", json={"email": "nobody_exists_here@unknown.com"})
    assert res.status_code == 404
    assert "Please sign up first" in res.json()["detail"]


def test_signup_and_duplicate_handling(client):
    rand_email = f"test_user_{random.randint(10000, 99999)}@example.com"
    # Successful signup
    res1 = client.post("/api/v1/auth/signup", json={"email": rand_email, "name": "New Tester"})
    assert res1.status_code == 200
    assert res1.json()["user"]["email"] == rand_email

    # Duplicate signup fails
    res2 = client.post("/api/v1/auth/signup", json={"email": rand_email, "name": "New Tester"})
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


def test_oauth_login(client):
    res = client.post("/api/v1/auth/oauth", json={
        "provider": "google",
        "email": "oauth_user@gmail.com",
        "name": "Google User",
    })
    assert res.status_code == 200
    assert res.json()["user"]["email"] == "oauth_user@gmail.com"
    assert "google" in res.json()["access_token"]


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
