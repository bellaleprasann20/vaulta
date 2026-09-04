"""
Public link routes.

Two audiences in one router:
- Authenticated owner: create / list / revoke links for their files.
- Anonymous "Public User": resolve a token into a temporary download URL,
  optionally gated by a password. These endpoints do NOT require login —
  that's the entire point of a public link.
"""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.link_share import (
    LinkShareCreate, LinkShareRead,
    PublicLinkAccessRequest, PublicLinkAccessResponse,
)
from app.schemas import APIResponse
from app.services import sharing_service

router = APIRouter()


# ---------------------------------------------------------------------------
# Owner-facing (authenticated)
# ---------------------------------------------------------------------------

@router.post("", response_model=LinkShareRead, status_code=status.HTTP_201_CREATED)
def create_public_link(
    payload: LinkShareCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return sharing_service.create_link_share(db, current_user, payload)


@router.get("/file/{file_id}", response_model=list[LinkShareRead])
def list_public_links_for_file(
    file_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return sharing_service.list_link_shares_for_file(db, current_user, file_id)


@router.delete("/{link_id}", response_model=APIResponse)
def revoke_public_link(
    link_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sharing_service.revoke_link_share(db, current_user, link_id)
    return APIResponse(message="Public link revoked")


# ---------------------------------------------------------------------------
# Public-facing (no auth — token IS the credential)
# ---------------------------------------------------------------------------

@router.post("/access/{token}", response_model=PublicLinkAccessResponse)
def access_public_link(
    token: str,
    payload: PublicLinkAccessRequest,
    db: Session = Depends(get_db),
):
    """
    Resolves a public link token (+ optional password) into a short-lived
    download URL. No authentication required — this is the anonymous
    'Public User' access path described in the spec's role model.
    """
    return sharing_service.access_public_link(db, token, payload.password)