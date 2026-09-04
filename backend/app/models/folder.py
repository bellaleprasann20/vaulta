"""
Folder model — supports nested hierarchy via self-referential parent_id,
soft delete (trash), and starring.
"""

from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models import UUIDPKMixin, TimestampMixin


class Folder(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "folders"

    name = Column(String(255), nullable=False)

    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("folders.id", ondelete="CASCADE"), nullable=True, index=True)

    is_starred = Column(Boolean, default=False, nullable=False)
    is_trashed = Column(Boolean, default=False, nullable=False)
    trashed_at = Column(DateTime(timezone=True), nullable=True)

    # ---------- Relationships ----------
    owner = relationship("User", back_populates="folders")

    # Self-referential nested folders: parent <-> children
    parent = relationship("Folder", remote_side="Folder.id", back_populates="children")
    children = relationship("Folder", back_populates="parent", cascade="all, delete-orphan")

    files = relationship("File", back_populates="folder", cascade="all, delete-orphan")
    shares = relationship("Share", back_populates="folder", cascade="all, delete-orphan")
    stars = relationship("Star", back_populates="folder", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Folder {self.name}>"