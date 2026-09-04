"""
User routes — update own profile, view storage quota usage.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.user import UserRead, UserUpdate, UserStorageStats
from app.services import auth_service

router = APIRouter()


@router.get("/me", response_model=UserRead)
def get_my_profile(current_user=Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserRead)
def update_my_profile(
    payload: UserUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updated = auth_service.update_user(db, current_user, payload)
    return updated


@router.get("/me/storage", response_model=UserStorageStats)
def get_my_storage_stats(current_user=Depends(get_current_user)):
    return UserStorageStats.model_validate(current_user)