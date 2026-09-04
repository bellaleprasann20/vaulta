"""
Folder schemas — create/update/read, plus a breadcrumb helper schema.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas import ORMBase


class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    parent_id: uuid.UUID | None = None


class FolderUpdate(BaseModel):
    """Partial update — rename and/or move (change parent)."""
    name: str | None = Field(default=None, min_length=1, max_length=255)
    parent_id: uuid.UUID | None = None


class FolderRead(ORMBase):
    id: uuid.UUID
    name: str
    owner_id: uuid.UUID
    parent_id: uuid.UUID | None = None
    is_starred: bool
    is_trashed: bool
    created_at: datetime
    updated_at: datetime


class BreadcrumbItem(BaseModel):
    id: uuid.UUID
    name: str


class FolderContents(BaseModel):
    """Response for GET /folders/{id} — the folder itself plus its listing."""
    folder: FolderRead | None = None  # None when listing root
    breadcrumbs: list[BreadcrumbItem] = []
    subfolders: list[FolderRead] = []
    files: list["FileRead"] = []  # forward ref, resolved below


from app.schemas.file import FileRead  # noqa: E402

FolderContents.model_rebuild()