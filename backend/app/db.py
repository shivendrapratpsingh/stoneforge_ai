"""SQLAlchemy engine + session factory.

Supports both SQLite (local dev) and Postgres (production on Render).
Render's DATABASE_URL starts with ``postgres://`` which SQLAlchemy no longer
recognises — we normalise it to ``postgresql://`` here.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import get_settings

settings = get_settings()

_url = settings.database_url
# Render gives us postgres://...  SQLAlchemy 2 wants postgresql://...
if _url.startswith("postgres://"):
    _url = _url.replace("postgres://", "postgresql://", 1)

_engine_kwargs: dict = {"future": True}
if _url.startswith("sqlite"):
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Postgres on free tier idles aggressively; recycle + pre_ping keeps
    # us from handing out dead connections after cold starts.
    _engine_kwargs["pool_pre_ping"] = True
    _engine_kwargs["pool_recycle"] = 300

engine = create_engine(_url, **_engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    from app import models_db  # noqa: F401 — register ORM models
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
