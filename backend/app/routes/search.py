"""
Search routes — name-based and type-based search across the user's
own files and folders (not trashed).
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.file import FileRead
from app.schemas.folder import FolderRead
from pydantic import BaseModel
from app.services import search_service

router = APIRouter()


class SearchResults(BaseModel):
    files: list[FileRead] = []
    folders: list[FolderRead] = []


@router.get("", response_model=SearchResults)
def search(
    q: str = Query(min_length=1, description="Search term (matches file/folder name)"),
    file_type: str | None = Query(default=None, description="Filter by mime type prefix, e.g. 'image/'"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    files, folders = search_service.search(db, current_user, query=q, file_type=file_type)
    return SearchResults(files=files, folders=folders)