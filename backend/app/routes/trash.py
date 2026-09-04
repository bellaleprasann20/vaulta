"""
Trash routes — list soft-deleted files/folders, restore them, or empty
the trash (permanent delete of everything currently trashed).

Individual permanent-delete of a single item is handled by
DELETE /files/{id}?permanent=true and DELETE /folders/{id}?permanent=true
(see routes/files.py, routes/folders.py) — this router covers the
trash-specific bulk actions.
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.file import FileRead
from app.schemas.folder import FolderRead
from app.schemas import APIResponse
from app.services import file_service, folder_service

router = APIRouter()


class TrashContents(BaseModel):
    files: list[FileRead] = []
    folders: list[FolderRead] = []


@router.get("", response_model=TrashContents)
def list_trash(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    files = file_service.list_trashed(db, current_user)
    folders = folder_service.list_trashed(db, current_user)
    return TrashContents(files=files, folders=folders)


@router.post("/files/{file_id}/restore", response_model=FileRead)
def restore_file(
    file_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return file_service.restore_file(db, current_user, file_id)


@router.post("/folders/{folder_id}/restore", response_model=FolderRead)
def restore_folder(
    folder_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return folder_service.restore_folder(db, current_user, folder_id)


@router.delete("", response_model=APIResponse)
def empty_trash(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = file_service.empty_trash(db, current_user) + folder_service.empty_trash(db, current_user)
    return APIResponse(message=f"Trash emptied — {count} item(s) permanently deleted")