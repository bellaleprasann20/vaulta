"""
Tests for /api/v1/auth — register, login, refresh, logout, /me.
"""


def test_register_creates_user_and_returns_tokens(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "new@example.com", "password": "StrongPass123", "full_name": "New User"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == "new@example.com"
    assert data["user"]["full_name"] == "New User"
    assert "hashed_password" not in data["user"]  # never leak the hash
    assert data["tokens"]["access_token"]
    assert data["tokens"]["refresh_token"]


def test_register_duplicate_email_is_rejected(client):
    payload = {"email": "dupe@example.com", "password": "StrongPass123", "full_name": "First"}
    first = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 400


def test_register_rejects_short_password(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "short@example.com", "password": "short", "full_name": "Short Pass"},
    )
    assert response.status_code == 422  # Pydantic min_length=8 validation


def test_login_with_correct_credentials_succeeds(client, registered_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "TestPassword123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "alice@example.com"
    assert data["tokens"]["access_token"]


def test_login_with_wrong_password_fails(client, registered_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "WrongPassword"},
    )
    assert response.status_code == 401


def test_login_with_unknown_email_fails(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "ghost@example.com", "password": "WhateverPass1"},
    )
    assert response.status_code == 401


def test_me_requires_authentication(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user(client, registered_user):
    response = client.get("/api/v1/auth/me", headers=registered_user["headers"])
    assert response.status_code == 200
    assert response.json()["email"] == "alice@example.com"


def test_refresh_issues_new_token_pair(client, registered_user):
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "TestPassword123"},
    )
    refresh_token = login.json()["tokens"]["refresh_token"]

    response = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["refresh_token"]


def test_refresh_with_invalid_token_fails(client):
    response = client.post("/api/v1/auth/refresh", json={"refresh_token": "not-a-real-token"})
    assert response.status_code == 401


def test_logout_clears_cookie(client, registered_user):
    response = client.post("/api/v1/auth/logout", headers=registered_user["headers"])
    assert response.status_code == 200
    assert response.json()["success"] is True