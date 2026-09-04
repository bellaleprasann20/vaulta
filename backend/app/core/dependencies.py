"""
Reusable FastAPI dependencies:
- get_current_user: decodes the JWT from the Authorization header / cookie
- require_role: factory for role-gated routes (Owner / Editor / Viewer)
"""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token

# tokenUrl is only used for the interactive /docs "Authorize" button
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def _extract_token(request: Request, bearer_token: str | None) -> str | None:
    """Accept the token from either the Authorization header or an HttpOnly cookie."""
    if bearer_token:
        return bearer_token
    return request.cookies.get("access_token")


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme),
):
    # Imported here (not top-level) to avoid a circular import with app.models.user,
    # which itself may import things from app.core.
    from app.models.user import User

    raw_token = _extract_token(request, token)
    if not raw_token:
        raise credentials_exception

    payload = decode_access_token(raw_token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    return user


def get_current_active_user(current_user=Depends(get_current_user)):
    return current_user


def require_roles(*allowed_roles: str):
    """
    Usage:
        @router.delete("/files/{id}")
        def delete_file(user=Depends(require_roles("owner", "editor"))): ...
    """

    def role_checker(current_user=Depends(get_current_user)):
        user_role = getattr(current_user, "role", None)
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user

    return role_checker