"""
Search service — name-based and type-based search across the current
user's own (non-trashed) files and folders.
"""

from sqlalchemy.orm import Session

from app.models.file import File
from app.models.folder import Folder
from app.models.user import User


def search(
    db: Session, user: User, query: str, file_type: str | None = None
) -> tuple[list[File], list[File]]:
    """Returns (files, folders) matching the query for this user."""
    file_q = (
        db.query(File)
        .filter(
            File.owner_id == user.id,
            File.is_trashed == False,  # noqa: E712
            File.name.ilike(f"%{query}%"),
        )
    )
    if file_type:
        file_q = file_q.filter(File.mime_type.ilike(f"{file_type}%"))
    files = file_q.order_by(File.name.asc()).all()

    # Folders have no mime type, so a file_type filter simply excludes them
    # from the results (matches the spec's "type-based" search behavior).
    folders: list[Folder] = []
    if not file_type:
        folders = (
            db.query(Folder)
            .filter(
                Folder.owner_id == user.id,
                Folder.is_trashed == False,  # noqa: E712
                Folder.name.ilike(f"%{query}%"),
            )
            .order_by(Folder.name.asc())
            .all()
        )

    return files, folders