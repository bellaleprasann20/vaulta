"""
FileVersion model — Phase 2 feature: keeps prior copies of a file so
users can view/restore version history instead of losing overwritten data.
"""

from sqlalchemy import Column, String, ForeignKey, BigInteger, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models import UUIDPKMixin, TimestampMixin


class FileVersion(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "file_versions"

    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), nullable=False, index=True)

    version_number = Column(Integer, nullable=False)
    storage_key = Column(String(1000), nullable=False, unique=True)
    size_bytes = Column(BigInteger, nullable=False, default=0)

    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # ---------- Relationships ----------
    file = relationship("File", back_populates="versions")
    uploaded_by = relationship("User")

    def __repr__(self) -> str:
        return f"<FileVersion file={self.file_id} v{self.version_number}>"