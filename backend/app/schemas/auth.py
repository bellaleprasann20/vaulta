"""
Auth schemas — register, login, tokens, refresh.
"""

from pydantic import BaseModel, EmailStr, Field

from app.schemas import ORMBase
from app.schemas.user import UserRead


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthResponse(BaseModel):
    """Returned on successful register/login: tokens + the user payload."""
    success: bool = True
    tokens: TokenPair
    user: UserRead


class GoogleAuthRequest(BaseModel):
    """Frontend sends the Google ID token it received from Google Identity Services."""
    id_token: str