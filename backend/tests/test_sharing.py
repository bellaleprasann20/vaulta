"""
Tests for /api/v1/shares and /api/v1/public-links — user-to-user sharing
with viewer/editor roles, and anonymous public-link access.
"""

import uuid


def _upload_test_file(client, headers, name="shared.pdf"):
    init = client.post(
        "/api/v1/files/init-upload",
        json={"file_name": name, "mime_type": "application/pdf", "size_bytes": 1000},
        headers=headers,
    )
    storage_key = init.json()["storage_key"]
    complete = client.post(
        "/api/v1/files/complete-upload",
        json={"storage_key": storage_key, "file_name": name, "mime_type": "application/pdf", "size_bytes": 1000},
        headers=headers,
    )
    return complete.json()


# ---------------------------------------------------------------------------
# User-to-user shares
# ---------------------------------------------------------------------------

def test_share_file_as_viewer_grants_read_access(client, registered_user, second_user):
    file_data = _upload_test_file(client, registered_user["headers"])

    share = client.post(
        "/api/v1/shares",
        json={"file_id": file_data["id"], "shared_with_email": "bob@example.com", "role": "viewer"},
        headers=registered_user["headers"],
    )
    assert share.status_code == 201
    assert share.json()["role"] == "viewer"

    # Bob (second_user) can now read the file.
    read = client.get(f"/api/v1/files/{file_data['id']}", headers=second_user["headers"])
    assert read.status_code == 200


def test_viewer_cannot_rename_shared_file(client, registered_user, second_user):
    file_data = _upload_test_file(client, registered_user["headers"])
    client.post(
        "/api/v1/shares",
        json={"file_id": file_data["id"], "shared_with_email": "bob@example.com", "role": "viewer"},
        headers=registered_user["headers"],
    )

    rename = client.patch(
        f"/api/v1/files/{file_data['id']}", json={"name": "hacked.pdf"}, headers=second_user["headers"],
    )
    assert rename.status_code == 403


def test_editor_can_rename_shared_file(client, registered_user, second_user):
    file_data = _upload_test_file(client, registered_user["headers"])
    client.post(
        "/api/v1/shares",
        json={"file_id": file_data["id"], "shared_with_email": "bob@example.com", "role": "editor"},
        headers=registered_user["headers"],
    )

    rename = client.patch(
        f"/api/v1/files/{file_data['id']}", json={"name": "edited.pdf"}, headers=second_user["headers"],
    )
    assert rename.status_code == 200
    assert rename.json()["name"] == "edited.pdf"


def test_share_requires_exactly_one_target(client, registered_user):
    response = client.post(
        "/api/v1/shares",
        json={"shared_with_email": "bob@example.com", "role": "viewer"},  # neither file_id nor folder_id
        headers=registered_user["headers"],
    )
    assert response.status_code == 422  # Pydantic model_validator catches it


def test_non_owner_cannot_share_a_file(client, registered_user, second_user):
    file_data = _upload_test_file(client, registered_user["headers"])
    # Bob (not the owner) tries to share Alice's file with himself as a third party.
    response = client.post(
        "/api/v1/shares",
        json={"file_id": file_data["id"], "shared_with_email": "bob@example.com", "role": "viewer"},
        headers=second_user["headers"],
    )
    assert response.status_code == 403


def test_only_sharer_can_revoke_share(client, registered_user, second_user):
    file_data = _upload_test_file(client, registered_user["headers"])
    share = client.post(
        "/api/v1/shares",
        json={"file_id": file_data["id"], "shared_with_email": "bob@example.com", "role": "viewer"},
        headers=registered_user["headers"],
    ).json()

    # Bob (the recipient, not the sharer) tries to revoke it himself.
    revoke_attempt = client.delete(f"/api/v1/shares/{share['id']}", headers=second_user["headers"])
    assert revoke_attempt.status_code == 403

    revoke = client.delete(f"/api/v1/shares/{share['id']}", headers=registered_user["headers"])
    assert revoke.status_code == 200


def test_shared_with_me_lists_received_shares(client, registered_user, second_user):
    file_data = _upload_test_file(client, registered_user["headers"])
    client.post(
        "/api/v1/shares",
        json={"file_id": file_data["id"], "shared_with_email": "bob@example.com", "role": "viewer"},
        headers=registered_user["headers"],
    )

    response = client.get("/api/v1/shares/with-me", headers=second_user["headers"])
    assert response.status_code == 200
    assert any(s["file_id"] == file_data["id"] for s in response.json())


# ---------------------------------------------------------------------------
# Public links
# ---------------------------------------------------------------------------

def test_create_and_access_public_link_without_password(client, registered_user):
    file_data = _upload_test_file(client, registered_user["headers"])

    link = client.post(
        "/api/v1/public-links", json={"file_id": file_data["id"]}, headers=registered_user["headers"],
    )
    assert link.status_code == 201
    token = link.json()["token"]
    assert link.json()["has_password"] is False

    # Anonymous access — no auth header at all.
    access = client.post(f"/api/v1/public-links/access/{token}", json={})
    assert access.status_code == 200
    assert access.json()["download_url"].startswith("https://fake-storage.test/download/")


def test_password_protected_link_requires_correct_password(client, registered_user):
    file_data = _upload_test_file(client, registered_user["headers"])

    link = client.post(
        "/api/v1/public-links",
        json={"file_id": file_data["id"], "password": "letmein123"},
        headers=registered_user["headers"],
    )
    token = link.json()["token"]
    assert link.json()["has_password"] is True

    wrong = client.post(f"/api/v1/public-links/access/{token}", json={"password": "wrong"})
    assert wrong.status_code == 401

    correct = client.post(f"/api/v1/public-links/access/{token}", json={"password": "letmein123"})
    assert correct.status_code == 200


def test_revoked_link_is_no_longer_accessible(client, registered_user):
    file_data = _upload_test_file(client, registered_user["headers"])
    link = client.post(
        "/api/v1/public-links", json={"file_id": file_data["id"]}, headers=registered_user["headers"],
    ).json()

    client.delete(f"/api/v1/public-links/{link['id']}", headers=registered_user["headers"])

    access = client.post(f"/api/v1/public-links/access/{link['token']}", json={})
    assert access.status_code == 404


def test_access_unknown_token_404s(client):
    response = client.post(f"/api/v1/public-links/access/{uuid.uuid4().hex}", json={})
    assert response.status_code == 404


def test_only_owner_can_create_public_link(client, registered_user, second_user):
    file_data = _upload_test_file(client, registered_user["headers"])
    response = client.post(
        "/api/v1/public-links", json={"file_id": file_data["id"]}, headers=second_user["headers"],
    )
    assert response.status_code == 403