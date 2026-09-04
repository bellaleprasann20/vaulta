"""
Share routes — share a file or folder with another user by email,
list who a target is shared with, update role, revoke.
"""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.share import ShareCreate, ShareUpdate, ShareRead, SharedUserInfo
from app.schemas import APIResponse
from app.services import sharing_service

router = APIRouter()


@router.post("", response_model=ShareRead, status_code=status.HTTP_201_CREATED)
def create_share(
    payload: ShareCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return sharing_service.create_share(db, current_user, payload)


@router.get("", response_model=list[SharedUserInfo])
def list_shares(
    file_id: uuid.UUID | None = Query(default=None),
    folder_id: uuid.UUID | None = Query(default=None),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return sharing_service.list_shares_for_target(db, current_user, file_id, folder_id)


@router.get("/with-me", response_model=list[ShareRead])
def list_shared_with_me(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Powers the 'Shared' sidebar page."""
    return sharing_service.list_shared_with_user(db, current_user)


@router.patch("/{share_id}", response_model=ShareRead)
def update_share(
    share_id: uuid.UUID,
    payload: ShareUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return sharing_service.update_share(db, current_user, share_id, payload)


@router.delete("/{share_id}", response_model=APIResponse)
def revoke_share(
    share_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sharing_service.revoke_share(db, current_user, share_id)
    return APIResponse(message="Share removed")