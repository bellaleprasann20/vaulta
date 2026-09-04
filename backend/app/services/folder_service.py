"""
Folder service — create, contents listing (with breadcrumb trail),
rename/move, soft/permanent delete, restore, and starring. Also owns
folder-level permission checks.
"""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.folder import Folder
from app.models.file import File
from app.models.share import Share
from app.models.user import User
from app.models.activity import ActivityAction, ActivityTargetType
from app.schemas.folder import FolderCreate, FolderUpdate, FolderContents, BreadcrumbItem
from app.schemas.file import FileRead
from app.services import activity_service, storage_service
from app.utils.permissions import require_access
from app.utils.validators import validate_file_name


def _require_access(db: Session, user: User, folder: Folder, min_role: str = "viewer") -> str:
    """Thin wrapper kept for call-site brevity within this module."""
    return require_access(db, user, folder, min_role)


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

def create_folder(db: Session, user: User, payload: FolderCreate) -> Folder:
    validate_file_name(payload.name)  # same character/length rules apply to folder names

    if payload.parent_id:
        parent = db.query(Folder).filter(Folder.id == payload.parent_id).first()
        if not parent or parent.owner_id != user.id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Parent folder not found")

    folder = Folder(name=payload.name, owner_id=user.id, parent_id=payload.parent_id)
    db.add(folder)
    db.commit()
    db.refresh(folder)

    activity_service.log_activity(
        db, user.id, ActivityAction.CREATE_FOLDER, ActivityTargetType.FOLDER, folder.id, folder.name
    )
    return folder


# ---------------------------------------------------------------------------
# Read — contents + breadcrumbs
# ---------------------------------------------------------------------------

def _build_breadcrumbs(db: Session, folder: Folder | None) -> list[BreadcrumbItem]:
    trail: list[BreadcrumbItem] = []
    current = folder
    while current is not None:
        trail.insert(0, BreadcrumbItem(id=current.id, name=current.name))
        current = db.query(Folder).filter(Folder.id == current.parent_id).first() if current.parent_id else None
    return trail


def get_folder_contents(db: Session, user: User, folder_id: uuid.UUID | None) -> FolderContents:
    folder = None
    if folder_id is not None:
        folder = db.query(Folder).filter(Folder.id == folder_id).first()
        if not folder:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Folder not found")
        _require_access(db, user, folder, min_role="viewer")

    subfolders = (
        db.query(Folder)
        .filter(Folder.owner_id == user.id, Folder.parent_id == folder_id, Folder.is_trashed == False)  # noqa: E712
        .order_by(Folder.name.asc())
        .all()
    )
    files = (
        db.query(File)
        .filter(File.owner_id == user.id, File.folder_id == folder_id, File.is_trashed == False)  # noqa: E712
        .order_by(File.name.asc())
        .all()
    )

    return FolderContents(
        folder=folder,
        breadcrumbs=_build_breadcrumbs(db, folder),
        subfolders=subfolders,
        files=[FileRead.model_validate(f) for f in files],
    )


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

def _is_descendant(db: Session, candidate_id: uuid.UUID, of_folder_id: uuid.UUID) -> bool:
    """Prevents moving a folder into one of its own children (would create a cycle)."""
    current = db.query(Folder).filter(Folder.id == candidate_id).first()
    while current and current.parent_id:
        if current.parent_id == of_folder_id:
            return True
        current = db.query(Folder).filter(Folder.id == current.parent_id).first()
    return False


def update_folder(db: Session, user: User, folder_id: uuid.UUID, payload: FolderUpdate) -> Folder:
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Folder not found")
    _require_access(db, user, folder, min_role="editor")

    update_data = payload.model_dump(exclude_unset=True)

    if "parent_id" in update_data and update_data["parent_id"] is not None:
        new_parent_id = update_data["parent_id"]
        if new_parent_id == folder.id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "A folder cannot be its own parent")
        if _is_descendant(db, new_parent_id, folder.id):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot move a folder into its own subfolder")
        new_parent = db.query(Folder).filter(Folder.id == new_parent_id).first()
        if not new_parent or new_parent.owner_id != folder.owner_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Destination folder not found")

    action = ActivityAction.RENAME if "name" in update_data else ActivityAction.MOVE
    for field, value in update_data.items():
        setattr(folder, field, value)

    db.commit()
    db.refresh(folder)
    activity_service.log_activity(db, user.id, action, ActivityTargetType.FOLDER, folder.id, folder.name)
    return folder


# ---------------------------------------------------------------------------
# Delete / trash / restore
# ---------------------------------------------------------------------------

def delete_folder(db: Session, user: User, folder_id: uuid.UUID, permanent: bool = False) -> None:
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Folder not found")
    _require_access(db, user, folder, min_role="owner")

    if permanent:
        _permanently_delete_folder(db, folder)
    else:
        folder.is_trashed = True
        folder.trashed_at = datetime.now(timezone.utc)
        db.commit()

    activity_service.log_activity(
        db, user.id, ActivityAction.DELETE, ActivityTargetType.FOLDER, folder_id, folder.name
    )


def _permanently_delete_folder(db: Session, folder: Folder) -> None:
    """Recursively deletes files and subfolders (storage objects included)
    before removing the folder itself — the DB cascade handles rows, but
    object storage needs an explicit walk since it lives outside Postgres."""
    for file_obj in list(folder.files):
        storage_service.delete_object(file_obj.storage_key)
        for version in file_obj.versions:
            storage_service.delete_object(version.storage_key)

    for child in list(folder.children):
        _permanently_delete_folder(db, child)

    db.delete(folder)  # cascades to files/subfolders rows via FK ondelete=CASCADE
    db.commit()


def list_trashed(db: Session, user: User) -> list[Folder]:
    return (
        db.query(Folder)
        .filter(Folder.owner_id == user.id, Folder.is_trashed == True)  # noqa: E712
        .order_by(Folder.trashed_at.desc())
        .all()
    )


def restore_folder(db: Session, user: User, folder_id: uuid.UUID) -> Folder:
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.owner_id == user.id).first()
    if not folder:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Folder not found in trash")
    folder.is_trashed = False
    folder.trashed_at = None
    db.commit()
    db.refresh(folder)
    activity_service.log_activity(
        db, user.id, ActivityAction.RESTORE, ActivityTargetType.FOLDER, folder.id, folder.name
    )
    return folder


def empty_trash(db: Session, user: User) -> int:
    trashed = list_trashed(db, user)
    count = len(trashed)
    for folder in trashed:
        _permanently_delete_folder(db, folder)
    return count


# ---------------------------------------------------------------------------
# Star
# ---------------------------------------------------------------------------

def set_starred(db: Session, user: User, folder_id: uuid.UUID, starred: bool) -> Folder:
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Folder not found")
    _require_access(db, user, folder, min_role="viewer")

    folder.is_starred = starred
    db.commit()
    db.refresh(folder)

    action = ActivityAction.STAR if starred else ActivityAction.UNSTAR
    activity_service.log_activity(db, user.id, action, ActivityTargetType.FOLDER, folder.id, folder.name)
    return folder