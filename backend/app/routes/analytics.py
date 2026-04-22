from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models_db import User
from app.schemas import AnalyticsOut
from app.services.analytics_engine import user_analytics

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/me", response_model=AnalyticsOut)
def my_analytics(
    days: int = 30,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return user_analytics(db, user.id, days=days)
