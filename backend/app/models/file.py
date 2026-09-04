"""
File model — metadata for uploaded objects. The actual bytes live in
object storage (Supabase Storage / S3); this row stores the pointer
(storage_key) plus everything needed for listing, search, and permissions.
"""

from sqlalchemy import Column, String, ForeignKey, Boolean, BigInteger, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models import UUIDPKMixin, TimestampMixin


class File(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "files"

    name = Column(String(255), nullable=False)
    mime_type = Column(String(150), nullable=False)
    size_bytes = Column(BigInteger, nullable=False, default=0)

    # Key/path inside the storage bucket — NOT a public URL.
    storage_key = Column(String(1000), nullable=False, unique=True)

    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    folder_id = Column(UUID(as_uuid=True), ForeignKey("folders.id", ondelete="CASCADE"), nullable=True, index=True)

    is_starred = Column(Boolean, default=False, nullable=False)
    is_trashed = Column(Boolean, default=False, nullable=False)
    trashed_at = Column(DateTime(timezone=True), nullable=True)

    # ---------- Relationships ----------
    owner = relationship("User", back_populates="files")
    folder = relationship("Folder", back_populates="files")

    versions = relationship(
        "FileVersion", back_populates="file", cascade="all, delete-orphan",
        order_by="desc(FileVersion.created_at)",
    )
    shares = relationship("Share", back_populates="file", cascade="all, delete-orphan")
    link_shares = relationship("LinkShare", back_populates="file", cascade="all, delete-orphan")
    stars = relationship("Star", back_populates="file", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<File {self.name}>"