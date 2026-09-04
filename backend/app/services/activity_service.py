"""
Activity service — writes audit-log rows. Called by other services after
a successful action so the Activity table stays a straightforward,
append-only side effect rather than logic scattered everywhere.
"""

import uuid

from sqlalchemy.orm import Session

from app.models.activity import Activity, ActivityAction, ActivityTargetType


def log_activity(
    db: Session,
    user_id: uuid.UUID,
    action: ActivityAction,
    target_type: ActivityTargetType,
    target_id: uuid.UUID,
    target_name: str | None = None,
) -> Activity:
    entry = Activity(
        user_id=user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        target_name_snapshot=target_name,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def list_recent_activity(db: Session, user_id: uuid.UUID, limit: int = 50) -> list[Activity]:
    return (
        db.query(Activity)
        .filter(Activity.user_id == user_id)
        .order_by(Activity.created_at.desc())
        .limit(limit)
        .all()
    )