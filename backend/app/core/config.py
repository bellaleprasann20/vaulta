"""
Application configuration.
Loads all environment variables into a single validated Settings object.
Import `settings` anywhere in the app instead of calling os.getenv directly.
"""

import json
from functools import lru_cache
from typing import List

from pydantic import Field, AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ---------- App ----------
    APP_NAME: str = "Vaulta"
    ENVIRONMENT: str = Field(default="development")  # development | staging | production
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # ---------- Security / JWT ----------
    SECRET_KEY: str = Field(..., description="Used to sign JWT access tokens")
    REFRESH_SECRET_KEY: str = Field(..., description="Used to sign JWT refresh tokens")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ---------- Database ----------
    DATABASE_URL: str = Field(
        ..., description="postgresql+psycopg2://user:pass@host:port/dbname"
    )

    # ---------- CORS ----------
    # Changed to accept either a string or a list so Pydantic doesn't crash on startup
    CORS_ORIGINS: str | List[str] = ["http://localhost:5173", "http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | List[str]) -> List[str]:
        if isinstance(v, str):
            # If it looks like a JSON array, parse it safely
            if v.startswith("["):
                try:
                    return json.loads(v)
                except ValueError:
                    return []
            # Otherwise, treat it as a standard comma-separated string
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # ---------- Storage (Supabase / S3) ----------
    STORAGE_PROVIDER: str = "supabase"  # "supabase" | "s3"
    SUPABASE_URL: str | None = None
    SUPABASE_KEY: str | None = None
    SUPABASE_BUCKET: str = "vaulta-files"

    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_REGION: str | None = None
    AWS_BUCKET_NAME: str | None = None

    # ---------- Uploads ----------
    MAX_UPLOAD_SIZE_MB: int = 100
    ALLOWED_FILE_TYPES: List[str] = [
        "image/png", "image/jpeg", "image/gif", "image/webp",
        "application/pdf", "text/plain",
        "application/zip", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    # ---------- OAuth (Google) ----------
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None

    # ---------- Rate limiting ----------
    RATE_LIMIT_PER_MINUTE: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — avoids re-reading .env on every import."""
    return Settings()


settings = get_settings()