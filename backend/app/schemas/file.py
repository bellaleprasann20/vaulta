"""
File schemas — upload lifecycle (init/complete), read, update, and
signed-URL response for downloads.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas import ORMBase


class InitUploadRequest(BaseModel):
    """Client asks the backend for a signed upload URL before sending bytes."""
    file_name: str = Field(min_length=1, max_length=255)
    mime_type: str
    size_bytes: int = Field(gt=0)
    folder_id: uuid.UUID | None = None


class InitUploadResponse(BaseModel):
    upload_url: str
    storage_key: str
    expires_in_seconds: int = 300


class CompleteUploadRequest(BaseModel):
    """Client confirms the upload finished so we can persist file metadata."""
    storage_key: str
    file_name: str = Field(min_length=1, max_length=255)
    mime_type: str
    size_bytes: int = Field(gt=0)
    folder_id: uuid.UUID | None = None


class FileRead(ORMBase):
    id: uuid.UUID
    name: str
    mime_type: str
    size_bytes: int
    owner_id: uuid.UUID
    folder_id: uuid.UUID | None = None
    is_starred: bool
    is_trashed: bool
    created_at: datetime
    updated_at: datetime


class FileUpdate(BaseModel):
    """Rename and/or move a file."""
    name: str | None = Field(default=None, min_length=1, max_length=255)
    folder_id: uuid.UUID | None = None


class FileDownloadResponse(BaseModel):
    download_url: str
    expires_in_seconds: int = 300


class FileVersionRead(ORMBase):
    id: uuid.UUID
    file_id: uuid.UUID
    version_number: int
    size_bytes: int
    uploaded_by_id: uuid.UUID | None = None
    created_at: datetime