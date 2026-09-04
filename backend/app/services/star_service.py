"""
Star service — powers the "Starred" sidebar page (combined files + folders).

Note: this file isn't in the original services/ list you sent (which had
auth, file, folder, storage, sharing, search, activity) — routes/stars.py
needs a combined starred-items query that doesn't naturally belong in
file_service or folder_service alone, so it's added here to keep that
route working. Folder- and file-level star *toggling* still live in
folder_service.set_starred / file_service.set_starred as before.
"""

from sqlalchemy.orm import Session

from app.models.file import File
from app.models.folder import Folder
from app.models.user import User


def list_starred(db: Session, user: User) -> tuple[list[File], list[Folder]]:
    files = (
        db.query(File)
        .filter(File.owner_id == user.id, File.is_starred == True, File.is_trashed == False)  # noqa: E712
        .order_by(File.name.asc())
        .all()
    )
    folders = (
        db.query(Folder)
        .filter(Folder.owner_id == user.id, Folder.is_starred == True, Folder.is_trashed == False)  # noqa: E712
        .order_by(Folder.name.asc())
        .all()
    )
    return files, folders