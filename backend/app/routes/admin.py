"""Admin-only aggregate stats + promo controls. Gated by user.is_admin."""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models_db import AIGeneration, Attempt, Subscription, User
from app.promo import promo_expiry, set_promo_expiry

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return user


@router.get("/stats")
def stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin),
):
    """Aggregate counts for the admin dashboard."""
    now = datetime.utcnow()
    d1 = now - timedelta(days=1)
    d7 = now - timedelta(days=7)
    d30 = now - timedelta(days=30)

    total_users = db.query(func.count(User.id)).scalar() or 0
    new_users_7d = db.query(func.count(User.id)).filter(User.created_at >= d7).scalar() or 0
    new_users_30d = db.query(func.count(User.id)).filter(User.created_at >= d30).scalar() or 0

    active_1d = db.query(func.count(func.distinct(Attempt.user_id))).filter(
        Attempt.created_at >= d1
    ).scalar() or 0
    active_7d = db.query(func.count(func.distinct(Attempt.user_id))).filter(
        Attempt.created_at >= d7
    ).scalar() or 0
    active_30d = db.query(func.count(func.distinct(Attempt.user_id))).filter(
        Attempt.created_at >= d30
    ).scalar() or 0

    plan_rows = db.query(User.plan, func.count(User.id)).group_by(User.plan).all()
    plan_counts = {plan: cnt for plan, cnt in plan_rows}

    active_subs = db.query(func.count(Subscription.id)).filter(
        Subscription.status == "active"
    ).scalar() or 0

    total_attempts = db.query(func.count(Attempt.id)).scalar() or 0
    attempts_7d = db.query(func.count(Attempt.id)).filter(
        Attempt.created_at >= d7
    ).scalar() or 0

    total_ai_gens = db.query(func.count(AIGeneration.id)).scalar() or 0
    ai_gens_7d = db.query(func.count(AIGeneration.id)).filter(
        AIGeneration.created_at >= d7
    ).scalar() or 0

    recent = (
        db.query(User)
        .order_by(User.created_at.desc())
        .limit(10)
        .all()
    )
    recent_signups = [
        {
            "id": u.id,
            "email": u.email,
            "name": u.name or "",
            "plan": u.plan,
            "exam_target": u.exam_target,
            "lang_pref": u.lang_pref,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in recent
    ]

    signups_series = []
    for i in range(13, -1, -1):
        day_start = (now - timedelta(days=i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        day_end = day_start + timedelta(days=1)
        cnt = db.query(func.count(User.id)).filter(
            User.created_at >= day_start, User.created_at < day_end
        ).scalar() or 0
        signups_series.append({"date": day_start.strftime("%Y-%m-%d"), "count": cnt})

    promo_exp = promo_expiry(db)

    return {
        "generated_at": now.isoformat(),
        "users": {
            "total": total_users,
            "new_7d": new_users_7d,
            "new_30d": new_users_30d,
            "by_plan": plan_counts,
        },
        "active": {
            "dau": active_1d,
            "wau": active_7d,
            "mau": active_30d,
        },
        "engagement": {
            "total_attempts": total_attempts,
            "attempts_7d": attempts_7d,
            "total_ai_generations": total_ai_gens,
            "ai_generations_7d": ai_gens_7d,
        },
        "revenue": {
            "active_subscriptions": active_subs,
        },
        "promo": {
            "active": promo_exp is not None,
            "expires_at": promo_exp.isoformat() if promo_exp else None,
        },
        "recent_signups": recent_signups,
        "signups_series": signups_series,
    }


@router.post("/reseed")
def reseed(
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin),
):
    """Force-re-run the lessons seed. Idempotent - safe to hit repeatedly."""
    from app.content.seed import seed_all
    from app.models_db import Lesson
    before = db.query(func.count(Lesson.id)).scalar() or 0
    try:
        seed_all()
    except Exception as e:  # noqa: BLE001
        raise HTTPException(500, f"Seed failed: {type(e).__name__}: {e}")
    after = db.query(func.count(Lesson.id)).scalar() or 0
    return {"ok": True, "lessons_before": before, "lessons_after": after,
            "inserted": max(0, after - before)}


# --- Global free-Pro promo ----------------------------------------
class PromoIn(BaseModel):
    days: int = Field(default=7, ge=1, le=365)


@router.get("/promo")
def get_promo(
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin),
):
    exp = promo_expiry(db)
    return {
        "active": exp is not None,
        "expires_at": exp.isoformat() if exp else None,
    }


@router.post("/promo")
def start_promo(
    data: PromoIn,
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin),
):
    """Turn on a global free-Pro promo for `days` days from now.
    Hitting this again extends / resets the expiry."""
    when = datetime.utcnow() + timedelta(days=data.days)
    set_promo_expiry(db, when)
    return {"ok": True, "active": True, "expires_at": when.isoformat()}


@router.delete("/promo")
def end_promo(
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin),
):
    """End the promo immediately - all non-paying users revert to Free."""
    set_promo_expiry(db, None)
    return {"ok": True, "active": False, "expires_at": None}
