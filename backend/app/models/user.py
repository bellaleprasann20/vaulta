"""
User model — auth identity + storage quota.
"""

import enum

from sqlalchemy import Column, String, Boolean, BigInteger, Enum
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models import UUIDPKMixin, TimestampMixin


class AuthProvider(str, enum.Enum):
    EMAIL = "email"
    GOOGLE = "google"


class User(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # null if OAuth-only
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)

    auth_provider = Column(Enum(AuthProvider), default=AuthProvider.EMAIL, nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Storage quota tracking (bytes)
    storage_used_bytes = Column(BigInteger, default=0, nullable=False)
    storage_quota_bytes = Column(BigInteger, default=15 * 1024 * 1024 * 1024, nullable=False)  # 15 GB

    # ---------- Relationships ----------
    folders = relationship("Folder", back_populates="owner", cascade="all, delete-orphan")
    files = relationship("File", back_populates="owner", cascade="all, delete-orphan")
    shares_created = relationship(
        "Share", back_populates="shared_by", foreign_keys="Share.shared_by_id"
    )
    shares_received = relationship(
        "Share", back_populates="shared_with", foreign_keys="Share.shared_with_id"
    )
    stars = relationship("Star", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User {self.email}>"