import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_optional_user
from app.models_db import Lesson, User
from app.schemas import LessonOut

log = logging.getLogger("stenoforge.lessons")
router = APIRouter(prefix="/lessons", tags=["lessons"])


def _ensure_seeded(db: Session) -> None:
    """If the lessons table is empty, run the seed. Fire-and-forget on errors
    so a broken seed doesn't break the endpoint."""
    try:
        if db.query(Lesson).first() is None:
            from app.content.seed import seed_all
            log.info("[lessons] table empty — running seed_all()")
            seed_all()
    except Exception as e:  # noqa: BLE001
        log.warning(f"[lessons] auto-seed skipped: {type(e).__name__}: {e}")


@router.get("", response_model=list[LessonOut])
def list_lessons(kind: str = "typing", language: str = "en",
                 db: Session = Depends(get_db),
                 user: User = Depends(get_optional_user)):
    _ensure_seeded(db)
    q = (db.query(Lesson)
           .filter(Lesson.kind == kind, Lesson.language == language)
           .order_by(Lesson.order_idx.asc(), Lesson.id.asc()))
    lessons = q.all()
    if not user or user.plan == "free":
        # still return them, but mark non-free ones as content-lite
        for l in lessons:
            if not l.is_free:
                l.content_json = {"locked": True,
                                   "preview": (l.content_json or {}).get("preview", "")}
    return lessons


@router.get("/{slug}", response_model=LessonOut)
def get_lesson(slug: str, db: Session = Depends(get_db),
               user: User = Depends(get_optional_user)):
    _ensure_seeded(db)
    lesson = db.query(Lesson).filter(Lesson.slug == slug).first()
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    if not lesson.is_free and (not user or user.plan == "free"):
        lesson.content_json = {"locked": True,
                                "preview": (lesson.content_json or {}).get("preview", "")}
    return lesson
