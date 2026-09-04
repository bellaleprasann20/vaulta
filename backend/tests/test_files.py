"""
Tests for /api/v1/files — upload lifecycle, listing, rename/move,
permissions across owner/other-user, trash/restore, starring.
"""

import uuid


def _upload_test_file(client, headers, name="report.pdf", mime="application/pdf", size=2048, folder_id=None):
    init = client.post(
        "/api/v1/files/init-upload",
        json={"file_name": name, "mime_type": mime, "size_bytes": size, "folder_id": folder_id},
        headers=headers,
    )
    assert init.status_code == 200, init.text
    storage_key = init.json()["storage_key"]

    complete = client.post(
        "/api/v1/files/complete-upload",
        json={
            "storage_key": storage_key, "file_name": name,
            "mime_type": mime, "size_bytes": size, "folder_id": folder_id,
        },
        headers=headers,
    )
    assert complete.status_code == 201, complete.text
    return complete.json()


def test_init_upload_returns_signed_url_and_key(client, registered_user):
    response = client.post(
        "/api/v1/files/init-upload",
        json={"file_name": "photo.png", "mime_type": "image/png", "size_bytes": 1024},
        headers=registered_user["headers"],
    )
    assert response.status_code == 200
    data = response.json()
    assert data["upload_url"].startswith("https://fake-storage.test/upload/")
    assert data["storage_key"]


def test_init_upload_rejects_disallowed_mime_type(client, registered_user):
    response = client.post(
        "/api/v1/files/init-upload",
        json={"file_name": "virus.exe", "mime_type": "application/x-msdownload", "size_bytes": 1024},
        headers=registered_user["headers"],
    )
    assert response.status_code == 400


def test_init_upload_rejects_oversized_file(client, registered_user):
    too_big = 200 * 1024 * 1024  # 200MB > 100MB default limit
    response = client.post(
        "/api/v1/files/init-upload",
        json={"file_name": "huge.zip", "mime_type": "application/zip", "size_bytes": too_big},
        headers=registered_user["headers"],
    )
    assert response.status_code == 400


def test_complete_upload_creates_file_and_updates_quota(client, registered_user):
    file_data = _upload_test_file(client, registered_user["headers"], size=5000)
    assert file_data["name"] == "report.pdf"
    assert file_data["size_bytes"] == 5000
    assert file_data["is_trashed"] is False

    storage = client.get("/api/v1/users/me/storage", headers=registered_user["headers"])
    assert storage.json()["storage_used_bytes"] == 5000


def test_list_files_returns_only_own_non_trashed_files(client, registered_user):
    _upload_test_file(client, registered_user["headers"], name="a.pdf")
    _upload_test_file(client, registered_user["headers"], name="b.pdf")

    response = client.get("/api/v1/files", headers=registered_user["headers"])
    assert response.status_code == 200
    names = {f["name"] for f in response.json()}
    assert names == {"a.pdf", "b.pdf"}


def test_get_file_not_found_for_random_id(client, registered_user):
    response = client.get(f"/api/v1/files/{uuid.uuid4()}", headers=registered_user["headers"])
    assert response.status_code == 404


def test_other_user_cannot_access_unshared_file(client, registered_user, second_user):
    file_data = _upload_test_file(client, registered_user["headers"])
    response = client.get(f"/api/v1/files/{file_data['id']}", headers=second_user["headers"])
    assert response.status_code == 404  # 404, not 403 — existence isn't leaked


def test_rename_file(client, registered_user):
    file_data = _upload_test_file(client, registered_user["headers"], name="old.pdf")
    response = client.patch(
        f"/api/v1/files/{file_data['id']}", json={"name": "new.pdf"}, headers=registered_user["headers"],
    )
    assert response.status_code == 200
    assert response.json()["name"] == "new.pdf"


def test_soft_delete_then_restore(client, registered_user):
    file_data = _upload_test_file(client, registered_user["headers"])
    file_id = file_data["id"]

    delete_resp = client.delete(f"/api/v1/files/{file_id}", headers=registered_user["headers"])
    assert delete_resp.status_code == 200

    trash = client.get("/api/v1/trash", headers=registered_user["headers"])
    assert any(f["id"] == file_id for f in trash.json()["files"])

    restore = client.post(f"/api/v1/trash/files/{file_id}/restore", headers=registered_user["headers"])
    assert restore.status_code == 200
    assert restore.json()["is_trashed"] is False


def test_permanent_delete_frees_quota(client, registered_user):
    file_data = _upload_test_file(client, registered_user["headers"], size=3000)

    client.delete(f"/api/v1/files/{file_data['id']}?permanent=true", headers=registered_user["headers"])

    storage = client.get("/api/v1/users/me/storage", headers=registered_user["headers"])
    assert storage.json()["storage_used_bytes"] == 0


def test_star_and_unstar_file(client, registered_user):
    file_data = _upload_test_file(client, registered_user["headers"])
    file_id = file_data["id"]

    starred = client.post(f"/api/v1/files/{file_id}/star", headers=registered_user["headers"])
    assert starred.json()["is_starred"] is True

    unstarred = client.delete(f"/api/v1/files/{file_id}/star", headers=registered_user["headers"])
    assert unstarred.json()["is_starred"] is False


def test_download_url_endpoint(client, registered_user):
    file_data = _upload_test_file(client, registered_user["headers"])
    response = client.get(f"/api/v1/files/{file_data['id']}/download", headers=registered_user["headers"])
    assert response.status_code == 200
    assert response.json()["download_url"].startswith("https://fake-storage.test/download/")


def test_files_endpoints_require_auth(client):
    response = client.get("/api/v1/files")
    assert response.status_code == 401