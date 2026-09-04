"""
Permission helpers — single source of truth for "can this user access this
file/folder, and at what role" (owner / editor / viewer / none).

file_service.py and folder_service.py originally had near-identical
get_access_role / _require_access functions inlined (written before this
file existed). They're refactored below to import from here instead —
same behavior, no more duplication.
"""

from typing import Literal, Union

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.file import File
from app.models.folder import Folder
from app.models.share import Share
from app.models.user import User

Target = Union[File, Folder]
Role = Literal["owner", "editor", "viewer"]

_ROLE_RANK = {"viewer": 0, "editor": 1, "owner": 2}


def get_access_role(db: Session, user: User, target: Target) -> Role | None:
    """Returns 'owner' | 'editor' | 'viewer' | None (no access at all)."""
    if target.owner_id == user.id:
        return "owner"

    query = db.query(Share).filter(Share.shared_with_id == user.id)
    if isinstance(target, File):
        query = query.filter(Share.file_id == target.id)
    else:
        query = query.filter(Share.folder_id == target.id)

    share = query.first()
    if not share:
        return None
    return share.role.value if hasattr(share.role, "value") else share.role


def require_access(db: Session, user: User, target: Target, min_role: Role = "viewer") -> Role:
    """
    Raises 404 if the user has no access at all (so we don't leak that a
    resource exists to someone who isn't shared on it), or 403 if they have
    access but below the required role.
    """
    role = get_access_role(db, user, target)
    if role is None:
        kind = "File" if isinstance(target, File) else "Folder"
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"{kind} not found")

    if _ROLE_RANK[role] < _ROLE_RANK[min_role]:
        if min_role == "owner":
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the owner can perform this action")
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"{min_role.capitalize()} access required")

    return role


def is_owner(user: User, target: Target) -> bool:
    return target.owner_id == user.id