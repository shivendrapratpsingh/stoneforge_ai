"""Global 'free Pro' promo helpers.

Lets an admin unlock all Pro features for every user until a given expiry date.
State is stored in the `app_settings` table under key 'promo_pro_until'
(value = ISO8601 UTC datetime string, or empty to disable).
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models_db import AppSetting, User

PROMO_KEY = "promo_pro_until"


def _get_raw(db: Session) -> str:
    row = db.query(AppSetting).filter(AppSetting.key == PROMO_KEY).first()
    return (row.value if row else "") or ""


def promo_expiry(db: Session) -> Optional[datetime]:
    """Return the promo expiry (UTC) if still in the future, else None."""
    raw = _get_raw(db)
    if not raw:
        return None
    try:
        dt = datetime.fromisoformat(raw)
    except ValueError:
        return None
    if dt <= datetime.utcnow():
        return None
    return dt


def promo_active(db: Session) -> bool:
    return promo_expiry(db) is not None


def set_promo_expiry(db: Session, when: Optional[datetime]) -> None:
    """Write (or clear) the promo expiry. Pass None to disable immediately."""
    row = db.query(AppSetting).filter(AppSetting.key == PROMO_KEY).first()
    value = when.isoformat() if when else ""
    if row:
        row.value = value
        row.updated_at = datetime.utcnow()
    else:
        row = AppSetting(key=PROMO_KEY, value=value, updated_at=datetime.utcnow())
        db.add(row)
    db.commit()


def has_pro_access(user: Optional[User], db: Session) -> bool:
    """True if the user should be treated as Pro — either they paid,
    or the global free-Pro promo is active."""
    if user is not None and user.plan in ("pro", "institute"):
        return True
    return promo_active(db)
