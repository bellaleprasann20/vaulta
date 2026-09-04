"""
Share model — grants a specific user (shared_with) a role (viewer/editor)
on a specific file OR folder. Exactly one of file_id / folder_id is set.
"""

import enum

from sqlalchemy import Column, ForeignKey, Enum, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models import UUIDPKMixin, TimestampMixin


class ShareRole(str, enum.Enum):
    VIEWER = "viewer"
    EDITOR = "editor"


class Share(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "shares"
    __table_args__ = (
        CheckConstraint(
            "(file_id IS NOT NULL AND folder_id IS NULL) OR "
            "(file_id IS NULL AND folder_id IS NOT NULL)",
            name="share_target_exactly_one",
        ),
    )

    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), nullable=True, index=True)
    folder_id = Column(UUID(as_uuid=True), ForeignKey("folders.id", ondelete="CASCADE"), nullable=True, index=True)

    shared_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    shared_with_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    role = Column(Enum(ShareRole), default=ShareRole.VIEWER, nullable=False)

    # ---------- Relationships ----------
    file = relationship("File", back_populates="shares")
    folder = relationship("Folder", back_populates="shares")
    shared_by = relationship("User", back_populates="shares_created", foreign_keys=[shared_by_id])
    shared_with = relationship("User", back_populates="shares_received", foreign_keys=[shared_with_id])

    def __repr__(self) -> str:
        return f"<Share {self.role} target={self.file_id or self.folder_id}>"