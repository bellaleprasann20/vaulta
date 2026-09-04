"""
Auth routes — register, login, refresh, current-user.
Business logic lives in app.services.auth_service; routes stay thin.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import create_access_token, create_refresh_token, decode_refresh_token
from app.schemas.auth import (
    RegisterRequest, LoginRequest, RefreshRequest, TokenPair, AuthResponse,
)
from app.schemas.user import UserRead
from app.services import auth_service

router = APIRouter()

# HttpOnly cookie name for the access token (used by the dependency layer
# as a fallback when the frontend can't/doesn't send an Authorization header).
ACCESS_COOKIE = "access_token"


def _set_access_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=ACCESS_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # set True in production behind HTTPS
        max_age=60 * 30,
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    existing = auth_service.get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "An account with this email already exists")

    user = auth_service.create_user(db, payload)

    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    _set_access_cookie(response, access_token)

    return AuthResponse(
        tokens=TokenPair(access_token=access_token, refresh_token=refresh_token),
        user=UserRead.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is disabled")

    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    _set_access_cookie(response, access_token)

    return AuthResponse(
        tokens=TokenPair(access_token=access_token, refresh_token=refresh_token),
        user=UserRead.model_validate(user),
    )


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, response: Response, db: Session = Depends(get_db)):
    decoded = decode_refresh_token(payload.refresh_token)
    if not decoded:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")

    user_id = decoded.get("sub")
    user = auth_service.get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer valid")

    new_access = create_access_token(subject=str(user.id))
    new_refresh = create_refresh_token(subject=str(user.id))
    _set_access_cookie(response, new_access)

    return TokenPair(access_token=new_access, refresh_token=new_refresh)


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(ACCESS_COOKIE)
    return {"success": True, "message": "Logged out"}


@router.get("/me", response_model=UserRead)
def me(current_user=Depends(get_current_user)):
    return current_user