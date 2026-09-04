"""
Validators — file size, MIME type, and name checks used before accepting
an upload. Kept independent of FastAPI/SQLAlchemy so they're trivially
unit-testable, and raise HTTPException only at the boundary (init_upload).
"""

import re

from fastapi import HTTPException, status

from app.core.config import settings

# Windows/Unix-unsafe characters, kept conservative since files may later
# be synced to a local filesystem by the user.
_INVALID_FILENAME_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')
_MAX_FILENAME_LENGTH = 255


def validate_file_size(size_bytes: int) -> None:
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if size_bytes <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File size must be greater than zero")
    if size_bytes > max_bytes:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB upload limit",
        )


def validate_mime_type(mime_type: str) -> None:
    if mime_type not in settings.ALLOWED_FILE_TYPES:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"File type '{mime_type}' is not supported",
        )


def validate_file_name(name: str) -> None:
    name = name.strip()
    if not name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File name cannot be empty")
    if len(name) > _MAX_FILENAME_LENGTH:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"File name must be {_MAX_FILENAME_LENGTH} characters or fewer",
        )
    if _INVALID_FILENAME_CHARS.search(name):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            'File name contains invalid characters (< > : " / \\ | ? *)',
        )
    if name in (".", ".."):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid file name")


def validate_upload(name: str, mime_type: str, size_bytes: int) -> None:
    """Convenience wrapper — run all three checks together at the init-upload boundary."""
    validate_file_name(name)
    validate_mime_type(mime_type)
    validate_file_size(size_bytes)