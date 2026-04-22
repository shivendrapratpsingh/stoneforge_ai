"""Idempotent seed of typing + shorthand lessons into the DB."""
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models_db import Lesson
from app.content.lessons_en import TYPING_LESSONS_EN, SHORTHAND_LESSONS_EN
from app.content.lessons_hi import TYPING_LESSONS_HI, SHORTHAND_LESSONS_HI


def _upsert(db: Session, kind: str, language: str, items: list[dict]) -> int:
    count = 0
    for idx, it in enumerate(items):
        existing = db.query(Lesson).filter(Lesson.slug == it["slug"]).first()
        # First 3 of each set are free; the rest require Pro.
        is_free = idx < 3
        content = {"text": it.get("text"), "body": it.get("body"),
                   "preview": (it.get("text") or it.get("body", ""))[:120]}
        if existing:
            existing.title = it["title"]
            existing.content_json = content
            existing.order_idx = idx
            existing.is_free = is_free
        else:
            db.add(Lesson(
                kind=kind, language=language,
                slug=it["slug"], title=it["title"],
                content_json=content,
                order_idx=idx, is_free=is_free,
            ))
            count += 1
    db.commit()
    return count


def seed_all() -> None:
    db = SessionLocal()
    try:
        n = 0
        n += _upsert(db, "typing", "en", TYPING_LESSONS_EN)
        n += _upsert(db, "typing", "hi", TYPING_LESSONS_HI)
        n += _upsert(db, "steno",  "en", SHORTHAND_LESSONS_EN)
        n += _upsert(db, "steno",  "hi", SHORTHAND_LESSONS_HI)
        if n:
            print(f"[seed] inserted {n} new lessons")
    finally:
        db.close()


if __name__ == "__main__":
    seed_all()
