"""
Shared pytest fixtures.

Note: conftest.py wasn't in the tests/ list you sent (init + 5 test files),
but pytest fixtures need a home pytest auto-discovers, and every test file
needs the same DB isolation + auth + storage-mocking setup — so it's added
here rather than duplicated five times. Same pattern as star_service.py
being added earlier: flagged, not silently slipped in.

Each test function gets a fresh in-memory SQLite database (tables created
before, dropped after) so tests never leak state into one another, and the
real Supabase/S3 storage_service calls are monkeypatched to fake URLs so
the suite never needs real cloud credentials or network access to run.
"""

import os
import sys

# Test env vars must be set before any `app.*` module is imported, since
# app.core.config.settings is built once at import time.
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("REFRESH_SECRET_KEY", "test-refresh-secret-key-not-for-production")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("ENVIRONMENT", "development")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.services import storage_service


# ---------------------------------------------------------------------------
# Database — fresh in-memory SQLite per test
# ---------------------------------------------------------------------------

@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass  # db_session fixture owns closing/teardown

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Storage — never hit real Supabase/S3 in tests
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def mock_storage(monkeypatch):
    monkeypatch.setattr(
        storage_service, "generate_upload_url",
        lambda storage_key, mime_type: f"https://fake-storage.test/upload/{storage_key}",
    )
    monkeypatch.setattr(
        storage_service, "generate_download_url",
        lambda storage_key, download_name=None: f"https://fake-storage.test/download/{storage_key}",
    )
    monkeypatch.setattr(storage_service, "delete_object", lambda storage_key: None)


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

DEFAULT_PASSWORD = "TestPassword123"


def _register(client, email: str, full_name: str = "Test User", password: str = DEFAULT_PASSWORD):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": full_name},
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture()
def registered_user(client):
    """A single registered user + auth header, for tests that only need one identity."""
    data = _register(client, "alice@example.com", "Alice Example")
    token = data["tokens"]["access_token"]
    return {
        "user": data["user"],
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
    }


@pytest.fixture()
def second_user(client):
    """A second, distinct registered user — for sharing/permission tests."""
    data = _register(client, "bob@example.com", "Bob Example")
    token = data["tokens"]["access_token"]
    return {
        "user": data["user"],
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
    }


@pytest.fixture()
def auth_headers(registered_user):
    return registered_user["headers"]