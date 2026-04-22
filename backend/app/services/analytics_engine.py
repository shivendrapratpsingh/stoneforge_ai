"""Per-user analytics aggregation."""
from __future__ import annotations
from datetime import datetime, timedelta, date
from collections import Counter
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models_db import Attempt


def _streak_days(dates: list[date]) -> int:
    if not dates:
        return 0
    unique = sorted(set(dates), reverse=True)
    today = datetime.utcnow().date()
    if unique[0] not in (today, today - timedelta(days=1)):
        return 0
    streak, expected = 0, unique[0]
    for d in unique:
        if d == expected:
            streak += 1
            expected -= timedelta(days=1)
        else:
            break
    return streak


def user_analytics(db: Session, user_id: int, days: int = 30) -> dict:
    since = datetime.utcnow() - timedelta(days=days)
    rows = (db.query(Attempt)
              .filter(Attempt.user_id == user_id, Attempt.created_at >= since)
              .order_by(Attempt.created_at.asc())
              .all())

    if not rows:
        return {
            "total_attempts": 0, "best_wpm": 0.0, "avg_wpm": 0.0,
            "avg_accuracy": 0.0, "streak_days": 0,
            "progress": [], "weak_areas": [],
        }

    best_wpm  = max(r.wpm for r in rows)
    avg_wpm   = sum(r.wpm for r in rows) / len(rows)
    avg_acc   = sum(r.accuracy for r in rows) / len(rows)

    by_day: dict[date, list[Attempt]] = {}
    for r in rows:
        by_day.setdefault(r.created_at.date(), []).append(r)

    progress = [{
        "date": d.isoformat(),
        "wpm": round(sum(a.wpm for a in v) / len(v), 2),
        "accuracy": round(sum(a.accuracy for a in v) / len(v), 2),
        "attempts": len(v),
    } for d, v in sorted(by_day.items())]

    # Weak areas: most frequent prompt slices that were wrong
    err_counter: Counter = Counter()
    for r in rows:
        errs = r.errors_json or {}
        if isinstance(errs, dict):
            errs = errs.get("errors", [])
        for e in errs or []:
            slice_ = (e.get("prompt_slice") or "").strip()
            if 1 < len(slice_) < 20:
                err_counter[slice_] += 1

    weak_areas = [w for w, _ in err_counter.most_common(5)]
    streak = _streak_days(list(by_day.keys()))

    return {
        "total_attempts": len(rows),
        "best_wpm":       round(best_wpm, 2),
        "avg_wpm":        round(avg_wpm, 2),
        "avg_accuracy":   round(avg_acc, 2),
        "streak_days":    streak,
        "progress":       progress,
        "weak_areas":     weak_areas,
    }
