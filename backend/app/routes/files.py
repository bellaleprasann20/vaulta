"""
File routes — upload (init/complete), get/list, rename/move, delete,
download URL, version history, star toggle.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.file import (
    InitUploadRequest, InitUploadResponse,
    CompleteUploadRequest, FileRead, FileUpdate,
    FileDownloadResponse, FileVersionRead,
)
from app.schemas import APIResponse
from app.services import file_service

router = APIRouter()


@router.post("/init-upload", response_model=InitUploadResponse)
def init_upload(
    payload: InitUploadRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_service.check_quota(current_user, payload.size_bytes)
    upload_url, storage_key = file_service.init_upload(db, current_user, payload)
    return InitUploadResponse(upload_url=upload_url, storage_key=storage_key)


@router.post("/complete-upload", response_model=FileRead, status_code=status.HTTP_201_CREATED)
def complete_upload(
    payload: CompleteUploadRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_obj = file_service.complete_upload(db, current_user, payload)
    return file_obj


@router.get("", response_model=list[FileRead])
def list_files(
    folder_id: uuid.UUID | None = Query(default=None),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return file_service.list_files(db, current_user, folder_id)


@router.get("/{file_id}", response_model=FileRead)
def get_file(
    file_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_obj = file_service.get_file_or_404(db, current_user, file_id)
    return file_obj


@router.patch("/{file_id}", response_model=FileRead)
def update_file(
    file_id: uuid.UUID,
    payload: FileUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return file_service.update_file(db, current_user, file_id, payload)


@router.delete("/{file_id}", response_model=APIResponse)
def delete_file(
    file_id: uuid.UUID,
    permanent: bool = Query(default=False),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_service.delete_file(db, current_user, file_id, permanent=permanent)
    msg = "File permanently deleted" if permanent else "File moved to trash"
    return APIResponse(message=msg)


@router.get("/{file_id}/download", response_model=FileDownloadResponse)
def get_download_url(
    file_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    url = file_service.get_download_url(db, current_user, file_id)
    return FileDownloadResponse(download_url=url)


@router.get("/{file_id}/versions", response_model=list[FileVersionRead])
def list_versions(
    file_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return file_service.list_versions(db, current_user, file_id)


@router.post("/{file_id}/star", response_model=FileRead)
def star_file(
    file_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return file_service.set_starred(db, current_user, file_id, starred=True)


@router.delete("/{file_id}/star", response_model=FileRead)
def unstar_file(
    file_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return file_service.set_starred(db, current_user, file_id, starred=False)