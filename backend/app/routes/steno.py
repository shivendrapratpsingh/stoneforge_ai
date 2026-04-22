from fastapi import APIRouter, Query
from app.schemas import StenoEvaluateIn, StenoEvaluateOut, StenoOutlineOut
from app.services.steno_engine import evaluate_steno, outline_for, search_outlines

router = APIRouter(prefix="/steno", tags=["steno"])


@router.post("/evaluate", response_model=StenoEvaluateOut)
def evaluate(data: StenoEvaluateIn):
    return evaluate_steno(data.shorthand, data.typed, data.language)


@router.get("/outline", response_model=StenoOutlineOut)
def outline(word: str, language: str = "en"):
    return outline_for(word, language)


@router.get("/search")
def search(q: str = Query(..., min_length=1), language: str = "en", limit: int = 20):
    return {"results": search_outlines(q, language, limit)}
