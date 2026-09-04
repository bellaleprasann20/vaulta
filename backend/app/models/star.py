"""
Star model — lets a user favorite a file or folder for quick access.
Exactly one of file_id / folder_id is set per row.
"""

from sqlalchemy import Column, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models import UUIDPKMixin, TimestampMixin


class Star(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "stars"
    __table_args__ = (
        CheckConstraint(
            "(file_id IS NOT NULL AND folder_id IS NULL) OR "
            "(file_id IS NULL AND folder_id IS NOT NULL)",
            name="star_target_exactly_one",
        ),
        UniqueConstraint("user_id", "file_id", "folder_id", name="uq_star_per_user_target"),
    )

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), nullable=True)
    folder_id = Column(UUID(as_uuid=True), ForeignKey("folders.id", ondelete="CASCADE"), nullable=True)

    # ---------- Relationships ----------
    user = relationship("User", back_populates="stars")
    file = relationship("File", back_populates="stars")
    folder = relationship("Folder", back_populates="stars")

    def __repr__(self) -> str:
        return f"<Star user={self.user_id} target={self.file_id or self.folder_id}>"