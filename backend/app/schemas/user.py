"""
User schemas — read/update payloads. Never includes hashed_password.
"""

import uuid
from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas import ORMBase


class UserRead(ORMBase):
    id: uuid.UUID
    email: EmailStr
    full_name: str | None = None
    avatar_url: str | None = None
    is_active: bool
    is_verified: bool
    storage_used_bytes: int
    storage_quota_bytes: int
    created_at: datetime


class UserUpdate(ORMBase):
    full_name: str | None = Field(default=None, max_length=255)
    avatar_url: str | None = None


class UserStorageStats(ORMBase):
    storage_used_bytes: int
    storage_quota_bytes: int

    @property
    def percent_used(self) -> float:
        if self.storage_quota_bytes == 0:
            return 0.0
        return round((self.storage_used_bytes / self.storage_quota_bytes) * 100, 2)