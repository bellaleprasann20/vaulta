"""
Sharing service — user-to-user Share records and public LinkShare records.
Owns the "who can see this" logic for anything shared, and the anonymous
public-link resolution flow (Public User role from the spec).
"""

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.file import File
from app.models.folder import Folder
from app.models.share import Share
from app.models.link_share import LinkShare
from app.models.user import User
from app.models.activity import ActivityAction, ActivityTargetType
from app.schemas.share import ShareCreate, ShareUpdate, SharedUserInfo
from app.schemas.link_share import LinkShareCreate, LinkShareRead, PublicLinkAccessResponse
from app.services import activity_service, storage_service


# ---------------------------------------------------------------------------
# User-to-user shares
# ---------------------------------------------------------------------------

def create_share(db: Session, current_user: User, payload: ShareCreate) -> Share:
    target_file, target_folder = None, None

    if payload.file_id:
        target_file = db.query(File).filter(File.id == payload.file_id).first()
        if not target_file:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
        if target_file.owner_id != current_user.id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the owner can share this file")
    else:
        target_folder = db.query(Folder).filter(Folder.id == payload.folder_id).first()
        if not target_folder:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Folder not found")
        if target_folder.owner_id != current_user.id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the owner can share this folder")

    shared_with = db.query(User).filter(User.email == payload.shared_with_email.lower()).first()
    if not shared_with:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No user found with that email")
    if shared_with.id == current_user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot share with yourself")

    existing = (
        db.query(Share)
        .filter(
            Share.file_id == payload.file_id,
            Share.folder_id == payload.folder_id,
            Share.shared_with_id == shared_with.id,
        )
        .first()
    )
    if existing:
        existing.role = payload.role
        db.commit()
        db.refresh(existing)
        return existing

    share = Share(
        file_id=payload.file_id,
        folder_id=payload.folder_id,
        shared_by_id=current_user.id,
        shared_with_id=shared_with.id,
        role=payload.role,
    )
    db.add(share)
    db.commit()
    db.refresh(share)

    target = target_file or target_folder
    target_type = ActivityTargetType.FILE if target_file else ActivityTargetType.FOLDER
    activity_service.log_activity(
        db, current_user.id, ActivityAction.SHARE, target_type, target.id, target.name
    )
    return share


def list_shares_for_target(
    db: Session, current_user: User, file_id: uuid.UUID | None, folder_id: uuid.UUID | None
) -> list[SharedUserInfo]:
    if not file_id and not folder_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Provide file_id or folder_id")

    # Ownership check — only the owner sees the full "shared with" list.
    if file_id:
        target = db.query(File).filter(File.id == file_id).first()
    else:
        target = db.query(Folder).filter(Folder.id == folder_id).first()
    if not target or target.owner_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")

    shares = db.query(Share).filter(Share.file_id == file_id, Share.folder_id == folder_id).all()

    results = []
    for share in shares:
        user = db.query(User).filter(User.id == share.shared_with_id).first()
        if user:
            results.append(
                SharedUserInfo(
                    id=user.id, email=user.email, full_name=user.full_name,
                    avatar_url=user.avatar_url, role=share.role,
                )
            )
    return results


def list_shared_with_user(db: Session, current_user: User) -> list[Share]:
    return db.query(Share).filter(Share.shared_with_id == current_user.id).all()


def update_share(db: Session, current_user: User, share_id: uuid.UUID, payload: ShareUpdate) -> Share:
    share = db.query(Share).filter(Share.id == share_id).first()
    if not share:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Share not found")
    if share.shared_by_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the person who shared this can change it")

    share.role = payload.role
    db.commit()
    db.refresh(share)
    return share


def revoke_share(db: Session, current_user: User, share_id: uuid.UUID) -> None:
    share = db.query(Share).filter(Share.id == share_id).first()
    if not share:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Share not found")
    if share.shared_by_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the person who shared this can revoke it")

    db.delete(share)
    db.commit()


# ---------------------------------------------------------------------------
# Public links
# ---------------------------------------------------------------------------

def create_link_share(db: Session, current_user: User, payload: LinkShareCreate) -> LinkShareRead:
    file_obj = db.query(File).filter(File.id == payload.file_id).first()
    if not file_obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    if file_obj.owner_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the owner can create a public link")

    expires_at = None
    if payload.expires_in_hours:
        expires_at = datetime.now(timezone.utc) + timedelta(hours=payload.expires_in_hours)

    link = LinkShare(
        file_id=file_obj.id,
        created_by_id=current_user.id,
        hashed_password=hash_password(payload.password) if payload.password else None,
        expires_at=expires_at,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return LinkShareRead.from_orm_model(link)


def list_link_shares_for_file(db: Session, current_user: User, file_id: uuid.UUID) -> list[LinkShareRead]:
    file_obj = db.query(File).filter(File.id == file_id).first()
    if not file_obj or file_obj.owner_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")

    links = db.query(LinkShare).filter(LinkShare.file_id == file_id).all()
    return [LinkShareRead.from_orm_model(link) for link in links]


def revoke_link_share(db: Session, current_user: User, link_id: uuid.UUID) -> None:
    link = db.query(LinkShare).filter(LinkShare.id == link_id).first()
    if not link:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Link not found")
    if link.created_by_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the creator can revoke this link")

    link.is_revoked = True
    db.commit()


def access_public_link(db: Session, token: str, password: str | None) -> PublicLinkAccessResponse:
    link = db.query(LinkShare).filter(LinkShare.token == token).first()
    if not link or link.is_revoked:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This link is invalid or has been revoked")

    if link.expires_at and link.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_410_GONE, "This link has expired")

    if link.hashed_password:
        if not password or not verify_password(password, link.hashed_password):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect password")

    file_obj = db.query(File).filter(File.id == link.file_id).first()
    if not file_obj or file_obj.is_trashed:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File no longer available")

    download_url = storage_service.generate_download_url(file_obj.storage_key, file_obj.name)

    return PublicLinkAccessResponse(
        file_name=file_obj.name,
        mime_type=file_obj.mime_type,
        size_bytes=file_obj.size_bytes,
        download_url=download_url,
    )