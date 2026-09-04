"""
Auth service — user lookup/creation and password verification.
Routes call these; this layer is the only place that touches the User
table directly for auth purposes.
"""

import uuid

from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.schemas.user import UserUpdate


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.lower()).first()


def get_user_by_id(db: Session, user_id: str | uuid.UUID) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, payload: RegisterRequest) -> User:
    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user or not user.hashed_password:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def update_user(db: Session, user: User, payload: UserUpdate) -> User:
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def adjust_storage_used(db: Session, user: User, delta_bytes: int) -> User:
    """Positive delta on upload, negative on permanent delete."""
    user.storage_used_bytes = max(0, user.storage_used_bytes + delta_bytes)
    db.commit()
    db.refresh(user)
    return user