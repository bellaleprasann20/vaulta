"""
Database engine, session factory, and declarative Base.
All ORM models inherit from `Base`. Routes get a DB session via `get_db`.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from app.core.config import settings

# `pool_pre_ping` avoids stale-connection errors on long-lived Postgres pools
# (common with Supabase's connection pooler).
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Session:
    """
    FastAPI dependency — yields a DB session and guarantees it closes,
    even if the request raises. Use as: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()