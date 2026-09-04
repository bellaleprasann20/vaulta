"""
LinkShare model — public shareable links with optional expiry & password.
Anyone holding the token can access the file without an account (Public User role).
"""

import secrets

from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models import UUIDPKMixin, TimestampMixin


def generate_token() -> str:
    return secrets.token_urlsafe(24)


class LinkShare(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "link_shares"

    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    token = Column(String(64), unique=True, index=True, default=generate_token, nullable=False)

    # Optional password protection — stored as a bcrypt hash, not plaintext.
    hashed_password = Column(String(255), nullable=True)

    expires_at = Column(DateTime(timezone=True), nullable=True)  # null = never expires
    is_revoked = Column(Boolean, default=False, nullable=False)

    # ---------- Relationships ----------
    file = relationship("File", back_populates="link_shares")
    created_by = relationship("User")

    def __repr__(self) -> str:
        return f"<LinkShare token={self.token[:8]}...>"