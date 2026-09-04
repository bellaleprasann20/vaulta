"""
File helpers — small pure-function utilities for working with file
metadata. No DB access here; this mirrors what the frontend's
formatFileSize.js / fileTypes.js will need, kept server-side too for
API responses, logging, and email/notification text.
"""

import os

_SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"]

_MIME_CATEGORY_MAP = {
    "image/": "image",
    "video/": "video",
    "audio/": "audio",
    "application/pdf": "pdf",
    "application/zip": "archive",
    "application/x-zip-compressed": "archive",
    "text/": "text",
    "application/msword": "document",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
    "application/vnd.ms-excel": "spreadsheet",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "spreadsheet",
}


def format_file_size(size_bytes: int) -> str:
    """1536 -> '1.5 KB'. Mirrors the frontend's formatFileSize.js output format."""
    if size_bytes <= 0:
        return "0 B"

    size = float(size_bytes)
    unit_index = 0
    while size >= 1024 and unit_index < len(_SIZE_UNITS) - 1:
        size /= 1024
        unit_index += 1

    formatted = f"{size:.1f}".rstrip("0").rstrip(".")
    return f"{formatted} {_SIZE_UNITS[unit_index]}"


def get_file_extension(file_name: str) -> str:
    """'photo.JPG' -> 'jpg' (lowercased, no dot)."""
    _, ext = os.path.splitext(file_name)
    return ext.lstrip(".").lower()


def get_file_category(mime_type: str) -> str:
    """Maps a MIME type to a coarse category used for icons/grouping in the UI."""
    for prefix, category in _MIME_CATEGORY_MAP.items():
        if mime_type.startswith(prefix):
            return category
    return "file"


def strip_extension(file_name: str) -> str:
    """'report.final.pdf' -> 'report.final' — used when suggesting a rename default."""
    name, _ = os.path.splitext(file_name)
    return name


def make_copy_name(original_name: str) -> str:
    """'notes.txt' -> 'notes (copy).txt' — used for duplicate/copy actions."""
    name, ext = os.path.splitext(original_name)
    return f"{name} (copy){ext}"