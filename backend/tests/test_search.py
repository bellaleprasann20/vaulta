"""
Tests for /api/v1/search — name matching, MIME-type filtering, and that
results are scoped to the requesting user and exclude trashed items.
"""


def _upload(client, headers, name, mime="application/pdf", size=1000):
    init = client.post(
        "/api/v1/files/init-upload",
        json={"file_name": name, "mime_type": mime, "size_bytes": size},
        headers=headers,
    )
    storage_key = init.json()["storage_key"]
    complete = client.post(
        "/api/v1/files/complete-upload",
        json={"storage_key": storage_key, "file_name": name, "mime_type": mime, "size_bytes": size},
        headers=headers,
    )
    return complete.json()


def _create_folder(client, headers, name):
    response = client.post("/api/v1/folders", json={"name": name, "parent_id": None}, headers=headers)
    return response.json()


def test_search_matches_file_name_substring(client, registered_user):
    headers = registered_user["headers"]
    _upload(client, headers, "quarterly-report.pdf")
    _upload(client, headers, "vacation-photo.png", mime="image/png")

    response = client.get("/api/v1/search?q=report", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["files"]) == 1
    assert data["files"][0]["name"] == "quarterly-report.pdf"


def test_search_matches_folder_name(client, registered_user):
    headers = registered_user["headers"]
    _create_folder(client, headers, "Tax Documents 2026")

    response = client.get("/api/v1/search?q=tax", headers=headers)
    assert response.status_code == 200
    assert len(response.json()["folders"]) == 1


def test_search_is_case_insensitive(client, registered_user):
    headers = registered_user["headers"]
    _upload(client, headers, "MyResume.pdf")

    response = client.get("/api/v1/search?q=myresume", headers=headers)
    assert len(response.json()["files"]) == 1


def test_search_filters_by_mime_type_prefix(client, registered_user):
    headers = registered_user["headers"]
    _upload(client, headers, "photo1.png", mime="image/png")
    _upload(client, headers, "photo1-notes.pdf", mime="application/pdf")

    response = client.get("/api/v1/search?q=photo1&file_type=image/", headers=headers)
    data = response.json()
    assert len(data["files"]) == 1
    assert data["files"][0]["name"] == "photo1.png"
    # Folders are excluded entirely when a type filter is applied.
    assert data["folders"] == []


def test_search_excludes_trashed_files(client, registered_user):
    headers = registered_user["headers"]
    file_data = _upload(client, headers, "temporary.pdf")
    client.delete(f"/api/v1/files/{file_data['id']}", headers=headers)

    response = client.get("/api/v1/search?q=temporary", headers=headers)
    assert response.json()["files"] == []


def test_search_does_not_leak_other_users_files(client, registered_user, second_user):
    _upload(client, registered_user["headers"], "alice-private.pdf")

    response = client.get("/api/v1/search?q=alice-private", headers=second_user["headers"])
    assert response.json()["files"] == []


def test_search_requires_auth(client):
    response = client.get("/api/v1/search?q=anything")
    assert response.status_code == 401


def test_search_requires_nonempty_query(client, registered_user):
    response = client.get("/api/v1/search?q=", headers=registered_user["headers"])
    assert response.status_code == 422  # Query(min_length=1)