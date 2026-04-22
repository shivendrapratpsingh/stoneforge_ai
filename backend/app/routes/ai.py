from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user, check_free_quota
from app.models_db import AIGeneration, User
from app.schemas import (ParagraphGenIn, ParagraphGenOut,
                         CoachIn, CoachOut)
from app.services.ai_client import generate_paragraph, generate_coach

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/paragraph", response_model=ParagraphGenOut)
def paragraph(
    data: ParagraphGenIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    check_free_quota(user, db, kind="paragraph")
    text = generate_paragraph(
        language=data.language, difficulty=data.difficulty,
        topic=data.topic, target_wpm=data.target_wpm,
        exam_style=data.exam_style, word_count=data.word_count,
    )
    wc = len(text.split())
    est_time = int(wc / max(data.target_wpm, 20) * 60)

    db.add(AIGeneration(
        user_id=user.id, kind="paragraph",
        params_json=data.model_dump(), output_text=text,
        tokens=wc,
    ))
    db.commit()

    return {"text": text, "word_count": wc, "language": data.language,
            "difficulty": data.difficulty, "topic": data.topic,
            "est_time_sec": est_time}


@router.post("/coach", response_model=CoachOut)
def coach(
    data: CoachIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    check_free_quota(user, db, kind="coach")
    out = generate_coach(
        language=data.language,
        recent_wpm=data.recent_wpm, recent_accuracy=data.recent_accuracy,
        common_errors=data.common_errors, weak_chapters=data.weak_chapters,
    )
    db.add(AIGeneration(
        user_id=user.id, kind="coach",
        params_json=data.model_dump(),
        output_text=str(out)[:4000], tokens=0,
    ))
    db.commit()
    return out
