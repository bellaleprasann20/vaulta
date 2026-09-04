"""
Models package.
 
Exposes a shared `Base` (re-exported from core.database) plus common
mixins used across every table: a UUID primary key and created/updated
timestamps. Import models from here so Alembic's autogenerate can see
every table via a single entrypoint: `from app.models import *`
"""
 
import uuid
from datetime import datetime, timezone
 
from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import UUID
 
from app.core.database import Base  # noqa: F401  (re-exported)
 
 
class UUIDPKMixin:
    """Adds a UUID primary key column `id`, generated server-side... 
    actually generated app-side via Python default for portability."""
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
 
 
class TimestampMixin:
    """Adds created_at / updated_at columns, auto-managed."""
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
 
 
# Import order matters for relationship() string resolution — SQLAlchemy
# resolves lazily so order here is mostly cosmetic, but keep parents first.
from app.models.user import User  # noqa: E402, F401
from app.models.folder import Folder  # noqa: E402, F401
from app.models.file import File  # noqa: E402, F401
from app.models.file_version import FileVersion  # noqa: E402, F401
from app.models.share import Share  # noqa: E402, F401
from app.models.link_share import LinkShare  # noqa: E402, F401
from app.models.star import Star  # noqa: E402, F401
from app.models.activity import Activity  # noqa: E402, F401
 
__all__ = [
    "Base",
    "UUIDPKMixin",
    "TimestampMixin",
    "User",
    "Folder",
    "File",
    "FileVersion",
    "Share",
    "LinkShare",
    "Star",
    "Activity",
]