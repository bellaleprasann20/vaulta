"""
Star routes — powers the "Starred" sidebar page (list everything the user
has starred), plus the folder star toggle. File starring lives alongside
the rest of the file actions in routes/files.py to avoid splitting a
single resource's actions across two routers.
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.file import FileRead
from app.schemas.folder import FolderRead
from app.services import folder_service, star_service

router = APIRouter()


class StarredItems(BaseModel):
    files: list[FileRead] = []
    folders: list[FolderRead] = []


@router.get("", response_model=StarredItems)
def list_starred(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    files, folders = star_service.list_starred(db, current_user)
    return StarredItems(files=files, folders=folders)


@router.post("/folders/{folder_id}", response_model=FolderRead)
def star_folder(
    folder_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return folder_service.set_starred(db, current_user, folder_id, starred=True)


@router.delete("/folders/{folder_id}", response_model=FolderRead)
def unstar_folder(
    folder_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return folder_service.set_starred(db, current_user, folder_id, starred=False)