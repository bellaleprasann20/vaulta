"""
Storage service — generates signed upload/download URLs and deletes
objects, abstracting over the two supported providers (Supabase Storage
or AWS S3) behind one interface so the rest of the app never branches
on `settings.STORAGE_PROVIDER` itself.
"""

import re
import unicodedata
import uuid
from datetime import timedelta

from app.core.config import settings

# Provider SDKs are optional at import time — only the one you actually
# configure needs to be installed. Mirrors the guarded-import pattern in main.py.
try:
    import boto3
    from botocore.client import Config as BotoConfig
except ImportError:
    boto3 = None

try:
    from supabase import create_client, Client as SupabaseClient
except ImportError:
    create_client = None
    SupabaseClient = None


_UPLOAD_URL_TTL_SECONDS = 300
_DOWNLOAD_URL_TTL_SECONDS = 300

# Supabase Storage (and S3) object keys reject non-ASCII characters and
# most punctuation beyond a small safe set. A filename like
# "Report – Draft (final).docx" has an em dash (–, U+2013) that fails
# validation with "Invalid key" even though it's a perfectly normal
# filename. Anything outside this set gets collapsed to "_".
_UNSAFE_KEY_CHARS = re.compile(r"[^a-zA-Z0-9._-]")


def _sanitize_for_storage_key(file_name: str) -> str:
    # NFKD + ascii-encode drops accents/dashes/curly-quotes down to their
    # closest plain-ASCII form (e.g. "é" -> "e") before the final regex
    # strip, so accented filenames degrade gracefully instead of turning
    # into a wall of underscores.
    normalized = unicodedata.normalize("NFKD", file_name).encode("ascii", "ignore").decode("ascii")
    safe = _UNSAFE_KEY_CHARS.sub("_", normalized)
    return safe.strip("_") or "file"


def build_storage_key(owner_id: uuid.UUID, file_name: str) -> str:
    """
    Namespaces every object under the owner's id so a bucket listing alone
    can never leak one user's files to another, and appends a UUID so two
    uploads named 'resume.pdf' never collide.

    Only the storage key (the object's path in the bucket) is sanitized
    here — the original file_name the user typed is stored as-is in the
    files.name DB column and is what's actually displayed in the UI, so
    nothing user-visible changes because of this.
    """
    unique_suffix = uuid.uuid4().hex[:12]
    safe_name = _sanitize_for_storage_key(file_name)
    return f"{owner_id}/{unique_suffix}_{safe_name}"


# ---------------------------------------------------------------------------
# S3 backend
# ---------------------------------------------------------------------------

def _s3_client():
    if boto3 is None:
        raise RuntimeError("boto3 is not installed — run `pip install boto3` for S3 storage")
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
        config=BotoConfig(signature_version="s3v4"),
    )


def _s3_generate_upload_url(storage_key: str, mime_type: str) -> str:
    client = _s3_client()
    return client.generate_presigned_url(
        ClientMethod="put_object",
        Params={"Bucket": settings.AWS_BUCKET_NAME, "Key": storage_key, "ContentType": mime_type},
        ExpiresIn=_UPLOAD_URL_TTL_SECONDS,
    )


def _s3_generate_download_url(storage_key: str, download_name: str | None = None) -> str:
    client = _s3_client()
    params = {"Bucket": settings.AWS_BUCKET_NAME, "Key": storage_key}
    if download_name:
        params["ResponseContentDisposition"] = f'attachment; filename="{download_name}"'
    return client.generate_presigned_url(
        ClientMethod="get_object", Params=params, ExpiresIn=_DOWNLOAD_URL_TTL_SECONDS,
    )


def _s3_delete_object(storage_key: str) -> None:
    client = _s3_client()
    client.delete_object(Bucket=settings.AWS_BUCKET_NAME, Key=storage_key)


# ---------------------------------------------------------------------------
# Supabase Storage backend
# ---------------------------------------------------------------------------

def _supabase_client():
    if create_client is None:
        raise RuntimeError(
            "supabase-py is not installed — run `pip install supabase` for Supabase storage"
        )
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL / SUPABASE_KEY are not configured")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


def _supabase_generate_upload_url(storage_key: str, mime_type: str) -> str:
    client = _supabase_client()
    result = client.storage.from_(settings.SUPABASE_BUCKET).create_signed_upload_url(storage_key)
    return result["signed_url"]


def _supabase_generate_download_url(storage_key: str) -> str:
    client = _supabase_client()
    result = client.storage.from_(settings.SUPABASE_BUCKET).create_signed_url(
        storage_key, _DOWNLOAD_URL_TTL_SECONDS
    )
    return result["signedURL"]


def _supabase_delete_object(storage_key: str) -> None:
    client = _supabase_client()
    client.storage.from_(settings.SUPABASE_BUCKET).remove([storage_key])


# ---------------------------------------------------------------------------
# Public interface — everything else in the app calls these three functions
# ---------------------------------------------------------------------------

def generate_upload_url(storage_key: str, mime_type: str) -> str:
    if settings.STORAGE_PROVIDER == "s3":
        return _s3_generate_upload_url(storage_key, mime_type)
    return _supabase_generate_upload_url(storage_key, mime_type)


def generate_download_url(storage_key: str, download_name: str | None = None) -> str:
    if settings.STORAGE_PROVIDER == "s3":
        return _s3_generate_download_url(storage_key, download_name)
    return _supabase_generate_download_url(storage_key)


def delete_object(storage_key: str) -> None:
    if settings.STORAGE_PROVIDER == "s3":
        _s3_delete_object(storage_key)
    else:
        _supabase_delete_object(storage_key)