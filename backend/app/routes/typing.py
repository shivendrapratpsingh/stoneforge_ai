from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_optional_user, check_free_quota
from app.models_db import Attempt, Test
from app.schemas import TypingEvaluateIn, TypingEvaluateOut
from app.services.typing_engine import evaluate_typing

router = APIRouter(prefix="/typing", tags=["typing"])


@router.post("/evaluate", response_model=TypingEvaluateOut)
def evaluate(
    data: TypingEvaluateIn,
    db: Session = Depends(get_db),
    user=Depends(get_optional_user),
):
    result = evaluate_typing(data.prompt_text, data.typed_text, data.duration_sec)

    attempt_id = None
    if user:
        check_free_quota(user, db, kind="attempt",
                         daily_limit=3 if user.plan == "free" else 10_000)

        test = None
        if data.test_id:
            test = db.get(Test, data.test_id)
        if test is None:
            test = Test(
                user_id=user.id, kind="typing",
                language=data.language,
                duration_sec=int(data.duration_sec),
                prompt_text=data.prompt_text,
                target_wpm=40,
            )
            db.add(test); db.flush()

        attempt = Attempt(
            test_id=test.id,
            user_id=user.id,
            typed_text=data.typed_text,
            wpm=result["wpm"],
            gross_wpm=result["gross_wpm"],
            accuracy=result["accuracy"],
            errors_json={"errors": result["errors"]},
            duration_sec=int(data.duration_sec),
        )
        db.add(attempt); db.commit(); db.refresh(attempt)
        attempt_id = attempt.id

    return {**result, "attempt_id": attempt_id}
