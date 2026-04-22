"""Public promo-status endpoint (no auth needed).
Frontend polls this to decide whether to show the 'Free Pro\!' banner."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.promo import promo_expiry

router = APIRouter(prefix="/promo", tags=["promo"])


@router.get("/status")
def status(db: Session = Depends(get_db)):
    exp = promo_expiry(db)
    return {
        "active": exp is not None,
        "expires_at": exp.isoformat() if exp else None,
    }
