"""
Folder routes — create, get contents (with breadcrumbs), rename/move, delete.
GET / with no id returns the root ("My Drive") listing.
"""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.folder import FolderCreate, FolderUpdate, FolderRead, FolderContents
from app.schemas import APIResponse
from app.services import folder_service

router = APIRouter()


@router.post("", response_model=FolderRead, status_code=status.HTTP_201_CREATED)
def create_folder(
    payload: FolderCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return folder_service.create_folder(db, current_user, payload)


@router.get("/root", response_model=FolderContents)
def get_root_contents(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """My Drive — top-level listing (parent_id is null)."""
    return folder_service.get_folder_contents(db, current_user, folder_id=None)


@router.get("/{folder_id}", response_model=FolderContents)
def get_folder(
    folder_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return folder_service.get_folder_contents(db, current_user, folder_id=folder_id)


@router.patch("/{folder_id}", response_model=FolderRead)
def update_folder(
    folder_id: uuid.UUID,
    payload: FolderUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return folder_service.update_folder(db, current_user, folder_id, payload)


@router.delete("/{folder_id}", response_model=APIResponse)
def delete_folder(
    folder_id: uuid.UUID,
    permanent: bool = Query(default=False),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder_service.delete_folder(db, current_user, folder_id, permanent=permanent)
    msg = "Folder permanently deleted" if permanent else "Folder moved to trash"
    return APIResponse(message=msg)