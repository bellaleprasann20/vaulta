"""
Tests for /api/v1/folders — create, nested contents + breadcrumbs,
rename/move, cycle prevention, trash/restore, starring.
"""

import uuid


def _create_folder(client, headers, name="My Folder", parent_id=None):
    response = client.post(
        "/api/v1/folders", json={"name": name, "parent_id": parent_id}, headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_create_root_folder(client, registered_user):
    folder = _create_folder(client, registered_user["headers"], name="Documents")
    assert folder["name"] == "Documents"
    assert folder["parent_id"] is None


def test_create_folder_rejects_invalid_name(client, registered_user):
    response = client.post(
        "/api/v1/folders", json={"name": "bad/name"}, headers=registered_user["headers"],
    )
    assert response.status_code == 400


def test_root_contents_lists_top_level_folders(client, registered_user):
    _create_folder(client, registered_user["headers"], name="Work")
    _create_folder(client, registered_user["headers"], name="Personal")

    response = client.get("/api/v1/folders/root", headers=registered_user["headers"])
    assert response.status_code == 200
    names = {f["name"] for f in response.json()["subfolders"]}
    assert names == {"Work", "Personal"}
    assert response.json()["breadcrumbs"] == []


def test_nested_folder_breadcrumbs(client, registered_user):
    headers = registered_user["headers"]
    parent = _create_folder(client, headers, name="Parent")
    child = _create_folder(client, headers, name="Child", parent_id=parent["id"])

    response = client.get(f"/api/v1/folders/{child['id']}", headers=headers)
    assert response.status_code == 200
    breadcrumbs = response.json()["breadcrumbs"]
    assert [b["name"] for b in breadcrumbs] == ["Parent", "Child"]


def test_get_nonexistent_folder_404s(client, registered_user):
    response = client.get(f"/api/v1/folders/{uuid.uuid4()}", headers=registered_user["headers"])
    assert response.status_code == 404


def test_rename_folder(client, registered_user):
    folder = _create_folder(client, registered_user["headers"], name="Old Name")
    response = client.patch(
        f"/api/v1/folders/{folder['id']}", json={"name": "New Name"}, headers=registered_user["headers"],
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


def test_folder_cannot_be_moved_into_itself(client, registered_user):
    headers = registered_user["headers"]
    folder = _create_folder(client, headers, name="Loop")
    response = client.patch(
        f"/api/v1/folders/{folder['id']}", json={"parent_id": folder["id"]}, headers=headers,
    )
    assert response.status_code == 400


def test_folder_cannot_be_moved_into_own_child(client, registered_user):
    headers = registered_user["headers"]
    parent = _create_folder(client, headers, name="Parent")
    child = _create_folder(client, headers, name="Child", parent_id=parent["id"])

    # Try to make Parent a child of Child — would create a cycle.
    response = client.patch(
        f"/api/v1/folders/{parent['id']}", json={"parent_id": child["id"]}, headers=headers,
    )
    assert response.status_code == 400


def test_other_user_cannot_see_unshared_folder(client, registered_user, second_user):
    folder = _create_folder(client, registered_user["headers"], name="Private")
    response = client.get(f"/api/v1/folders/{folder['id']}", headers=second_user["headers"])
    assert response.status_code == 404


def test_soft_delete_then_restore_folder(client, registered_user):
    headers = registered_user["headers"]
    folder = _create_folder(client, headers, name="ToTrash")

    delete_resp = client.delete(f"/api/v1/folders/{folder['id']}", headers=headers)
    assert delete_resp.status_code == 200

    trash = client.get("/api/v1/trash", headers=headers)
    assert any(f["id"] == folder["id"] for f in trash.json()["folders"])

    restore = client.post(f"/api/v1/trash/folders/{folder['id']}/restore", headers=headers)
    assert restore.status_code == 200
    assert restore.json()["is_trashed"] is False


def test_star_and_unstar_folder(client, registered_user):
    headers = registered_user["headers"]
    folder = _create_folder(client, headers, name="Favorites")

    starred = client.post(f"/api/v1/stars/folders/{folder['id']}", headers=headers)
    assert starred.json()["is_starred"] is True

    starred_list = client.get("/api/v1/stars", headers=headers)
    assert any(f["id"] == folder["id"] for f in starred_list.json()["folders"])

    unstarred = client.delete(f"/api/v1/stars/folders/{folder['id']}", headers=headers)
    assert unstarred.json()["is_starred"] is False