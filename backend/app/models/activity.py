"""
Activity model — lightweight audit log of user actions (Phase 2: Activity logs).
Kept generic (action + target type/id) so one table covers files, folders, shares, etc.
"""

import enum

from sqlalchemy import Column, ForeignKey, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models import UUIDPKMixin, TimestampMixin


class ActivityAction(str, enum.Enum):
    UPLOAD = "upload"
    DOWNLOAD = "download"
    RENAME = "rename"
    MOVE = "move"
    DELETE = "delete"
    RESTORE = "restore"
    SHARE = "share"
    UNSHARE = "unshare"
    STAR = "star"
    UNSTAR = "unstar"
    CREATE_FOLDER = "create_folder"


class ActivityTargetType(str, enum.Enum):
    FILE = "file"
    FOLDER = "folder"


class Activity(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "activities"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    action = Column(Enum(ActivityAction), nullable=False)
    target_type = Column(Enum(ActivityTargetType), nullable=False)
    target_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Human-readable snapshot (e.g. filename at time of action) so the log
    # still reads sensibly even after the target itself is deleted.
    target_name_snapshot = Column(String(255), nullable=True)

    # ---------- Relationships ----------
    user = relationship("User", back_populates="activities")

    def __repr__(self) -> str:
        return f"<Activity {self.action} {self.target_type}={self.target_id}>"