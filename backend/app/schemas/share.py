"""
Share schemas — user-to-user sharing of a file or folder.
"""

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.schemas import ORMBase


class ShareRole(str, Enum):
    VIEWER = "viewer"
    EDITOR = "editor"


class ShareCreate(BaseModel):
    """Exactly one of file_id / folder_id must be set."""
    file_id: uuid.UUID | None = None
    folder_id: uuid.UUID | None = None
    shared_with_email: EmailStr
    role: ShareRole = ShareRole.VIEWER

    @model_validator(mode="after")
    def exactly_one_target(self):
        if bool(self.file_id) == bool(self.folder_id):
            raise ValueError("Provide exactly one of file_id or folder_id")
        return self


class ShareUpdate(BaseModel):
    role: ShareRole


class ShareRead(ORMBase):
    id: uuid.UUID
    file_id: uuid.UUID | None = None
    folder_id: uuid.UUID | None = None
    shared_by_id: uuid.UUID
    shared_with_id: uuid.UUID
    role: ShareRole
    created_at: datetime


class SharedUserInfo(BaseModel):
    """Lightweight user info shown in the 'Shared with' list on the ShareModal."""
    id: uuid.UUID
    email: EmailStr
    full_name: str | None = None
    avatar_url: str | None = None
    role: ShareRole