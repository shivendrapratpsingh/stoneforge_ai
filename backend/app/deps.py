"""FastAPI dependencies: DB session + current user."""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import func, and_
from sqlalchemy.orm import Session

from app.db import get_db
from app.models_db import User, AIGeneration, Attempt
from app.promo import promo_active
from app.security import decode_token
from app.config import get_settings

settings = get_settings()


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED,
                            "Missing Bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_token(token)
        uid = int(payload.get("sub"))
    except (ValueError, TypeError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    user = db.get(User, uid)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not authorization:
        return None
    try:
        return get_current_user(authorization, db)
    except HTTPException:
        return None


def require_pro(user: User = Depends(get_current_user),
                db: Session = Depends(get_db)) -> User:
    if user.plan in ("pro", "institute"):
        return user
    if promo_active(db):  # global free-Pro promo active
        return user
    raise HTTPException(
        status.HTTP_402_PAYMENT_REQUIRED,
        "Upgrade to Pro to use this feature."
    )


def check_free_quota(user: User, db: Session, kind: str,
                     daily_limit: Optional[int] = None) -> None:
    """Raise 402 if a free user exceeds their daily quota for `kind`."""
    if user.plan in ("pro", "institute"):
        return
    if promo_active(db):  # global free-Pro promo active
        return
    limit = daily_limit if daily_limit is not None else settings.free_daily_ai_generations
    since = datetime.utcnow() - timedelta(days=1)
    if kind in ("paragraph", "coach"):
        count = db.query(func.count(AIGeneration.id)).filter(
            and_(AIGeneration.user_id == user.id,
                 AIGeneration.kind == kind,
                 AIGeneration.created_at >= since)
        ).scalar() or 0
    else:  # attempts
        count = db.query(func.count(Attempt.id)).filter(
            and_(Attempt.user_id == user.id,
                 Attempt.created_at >= since)
        ).scalar() or 0
    if count >= limit:
        raise HTTPException(
            status.HTTP_402_PAYMENT_REQUIRED,
            f"Free plan limit reached ({limit}/day). Upgrade to Pro for unlimited access."
        )
