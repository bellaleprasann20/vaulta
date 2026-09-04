"""
LinkShare schemas — public shareable links with optional expiry & password.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas import ORMBase


class LinkShareCreate(BaseModel):
    file_id: uuid.UUID
    password: str | None = Field(default=None, min_length=4, max_length=128)
    expires_in_hours: int | None = Field(default=None, gt=0, description="Null = never expires")


class LinkShareRead(ORMBase):
    id: uuid.UUID
    file_id: uuid.UUID
    token: str
    has_password: bool
    expires_at: datetime | None = None
    is_revoked: bool
    created_at: datetime

    @classmethod
    def from_orm_model(cls, link_share) -> "LinkShareRead":
        """
        LinkShare's ORM model stores `hashed_password`, not `has_password` —
        build the schema explicitly rather than relying on from_attributes
        to guess the mapping.
        """
        return cls(
            id=link_share.id,
            file_id=link_share.file_id,
            token=link_share.token,
            has_password=bool(link_share.hashed_password),
            expires_at=link_share.expires_at,
            is_revoked=link_share.is_revoked,
            created_at=link_share.created_at,
        )


class PublicLinkAccessRequest(BaseModel):
    """Sent by an anonymous visitor if the link is password-protected."""
    password: str | None = None


class PublicLinkAccessResponse(BaseModel):
    file_name: str
    mime_type: str
    size_bytes: int
    download_url: str
    expires_in_seconds: int = 300