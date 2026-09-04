"""
File service — the core business logic for files: upload lifecycle,
listing, rename/move, soft/permanent delete, download URLs, version
history, and starring. Also owns file-level permission checks used by
routes and by sharing_service.
"""

import re
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.file import File
from app.models.file_version import FileVersion
from app.models.folder import Folder
from app.models.share import Share
from app.models.user import User
from app.models.activity import ActivityAction, ActivityTargetType
from app.schemas.file import InitUploadRequest, CompleteUploadRequest, FileUpdate
from app.services import storage_service, activity_service, auth_service
from app.utils.permissions import require_access, get_access_role  # noqa: F401
from app.utils.validators import validate_upload

MAX_UPLOAD_SIZE_BYTES_DEFAULT = 100 * 1024 * 1024  # fallback if settings unavailable


def _require_access(db: Session, user: User, file: File, min_role: str = "viewer") -> str:
    """Thin wrapper kept for call-site brevity within this module."""
    return require_access(db, user, file, min_role)


# ---------------------------------------------------------------------------
# Quota
# ---------------------------------------------------------------------------

def check_quota(user: User, incoming_size_bytes: int) -> None:
    if user.storage_used_bytes + incoming_size_bytes > user.storage_quota_bytes:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "This upload would exceed your storage quota",
        )


# ---------------------------------------------------------------------------
# Upload lifecycle
# ---------------------------------------------------------------------------

def init_upload(db: Session, user: User, payload: InitUploadRequest) -> tuple[str, str]:
    validate_upload(payload.file_name, payload.mime_type, payload.size_bytes)

    if payload.folder_id:
        folder = db.query(Folder).filter(Folder.id == payload.folder_id).first()
        if not folder or folder.owner_id != user.id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Destination folder not found")

    # THIS IS THE FIX: Clean the filename for the storage key ONLY
    safe_filename = re.sub(r'[^a-zA-Z0-9.\-_]', '_', payload.file_name)

    # Use safe_filename for Supabase, but the original payload.file_name gets saved to the DB later!
    storage_key = storage_service.build_storage_key(user.id, safe_filename)
    upload_url = storage_service.generate_upload_url(storage_key, payload.mime_type)
    return upload_url, storage_key


def complete_upload(db: Session, user: User, payload: CompleteUploadRequest) -> File:
    check_quota(user, payload.size_bytes)

    file_obj = File(
        name=payload.file_name, # The database keeps your original filename with spaces!
        mime_type=payload.mime_type,
        size_bytes=payload.size_bytes,
        storage_key=payload.storage_key,
        owner_id=user.id,
        folder_id=payload.folder_id,
    )
    db.add(file_obj)
    auth_service.adjust_storage_used(db, user, payload.size_bytes)
    db.commit()
    db.refresh(file_obj)

    activity_service.log_activity(
        db, user.id, ActivityAction.UPLOAD, ActivityTargetType.FILE, file_obj.id, file_obj.name
    )
    return file_obj


# ---------------------------------------------------------------------------
# Read / list
# ---------------------------------------------------------------------------

def get_file_or_404(db: Session, user: User, file_id: uuid.UUID) -> File:
    file_obj = db.query(File).filter(File.id == file_id).first()
    if not file_obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    _require_access(db, user, file_obj, min_role="viewer")
    return file_obj


def list_files(db: Session, user: User, folder_id: uuid.UUID | None) -> list[File]:
    return (
        db.query(File)
        .filter(File.owner_id == user.id, File.folder_id == folder_id, File.is_trashed == False)  # noqa: E712
        .order_by(File.name.asc())
        .all()
    )


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

def update_file(db: Session, user: User, file_id: uuid.UUID, payload: FileUpdate) -> File:
    file_obj = db.query(File).filter(File.id == file_id).first()
    if not file_obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    _require_access(db, user, file_obj, min_role="editor")

    update_data = payload.model_dump(exclude_unset=True)
    action = ActivityAction.RENAME if "name" in update_data else ActivityAction.MOVE

    if "folder_id" in update_data and update_data["folder_id"] is not None:
        folder = db.query(Folder).filter(Folder.id == update_data["folder_id"]).first()
        if not folder or folder.owner_id != file_obj.owner_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Destination folder not found")

    for field, value in update_data.items():
        setattr(file_obj, field, value)

    db.commit()
    db.refresh(file_obj)
    activity_service.log_activity(db, user.id, action, ActivityTargetType.FILE, file_obj.id, file_obj.name)
    return file_obj


# ---------------------------------------------------------------------------
# Delete / trash / restore
# ---------------------------------------------------------------------------

def delete_file(db: Session, user: User, file_id: uuid.UUID, permanent: bool = False) -> None:
    file_obj = db.query(File).filter(File.id == file_id).first()
    if not file_obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    _require_access(db, user, file_obj, min_role="owner")

    if permanent:
        _permanently_delete(db, file_obj)
    else:
        file_obj.is_trashed = True
        file_obj.trashed_at = datetime.now(timezone.utc)
        db.commit()

    activity_service.log_activity(
        db, user.id, ActivityAction.DELETE, ActivityTargetType.FILE, file_id, file_obj.name
    )


def _permanently_delete(db: Session, file_obj: File) -> None:
    owner = db.query(User).filter(User.id == file_obj.owner_id).first()
    storage_service.delete_object(file_obj.storage_key)
    for version in file_obj.versions:
        storage_service.delete_object(version.storage_key)
    if owner:
        auth_service.adjust_storage_used(db, owner, -file_obj.size_bytes)
    db.delete(file_obj)
    db.commit()


def list_trashed(db: Session, user: User) -> list[File]:
    return (
        db.query(File)
        .filter(File.owner_id == user.id, File.is_trashed == True)  # noqa: E712
        .order_by(File.trashed_at.desc())
        .all()
    )


def restore_file(db: Session, user: User, file_id: uuid.UUID) -> File:
    file_obj = db.query(File).filter(File.id == file_id, File.owner_id == user.id).first()
    if not file_obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found in trash")
    file_obj.is_trashed = False
    file_obj.trashed_at = None
    db.commit()
    db.refresh(file_obj)
    activity_service.log_activity(
        db, user.id, ActivityAction.RESTORE, ActivityTargetType.FILE, file_obj.id, file_obj.name
    )
    return file_obj


def empty_trash(db: Session, user: User) -> int:
    trashed = list_trashed(db, user)
    count = len(trashed)
    for file_obj in trashed:
        _permanently_delete(db, file_obj)
    return count


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------

def get_download_url(db: Session, user: User, file_id: uuid.UUID) -> str:
    file_obj = get_file_or_404(db, user, file_id)
    url = storage_service.generate_download_url(file_obj.storage_key, file_obj.name)
    activity_service.log_activity(
        db, user.id, ActivityAction.DOWNLOAD, ActivityTargetType.FILE, file_obj.id, file_obj.name
    )
    return url


# ---------------------------------------------------------------------------
# Versions
# ---------------------------------------------------------------------------

def list_versions(db: Session, user: User, file_id: uuid.UUID) -> list[FileVersion]:
    file_obj = get_file_or_404(db, user, file_id)
    return file_obj.versions


# ---------------------------------------------------------------------------
# Star
# ---------------------------------------------------------------------------

def set_starred(db: Session, user: User, file_id: uuid.UUID, starred: bool) -> File:
    file_obj = db.query(File).filter(File.id == file_id).first()
    if not file_obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    _require_access(db, user, file_obj, min_role="viewer")

    file_obj.is_starred = starred
    db.commit()
    db.refresh(file_obj)

    action = ActivityAction.STAR if starred else ActivityAction.UNSTAR
    activity_service.log_activity(db, user.id, action, ActivityTargetType.FILE, file_obj.id, file_obj.name)
    return file_obj