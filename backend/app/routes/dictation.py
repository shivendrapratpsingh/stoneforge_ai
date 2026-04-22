"""Dictation: server returns prompt + recommended speed; audio playback
happens in the browser via the Web Speech API for v1 (free, no server cost)."""
from fastapi import APIRouter
from app.services.ai_client import generate_paragraph

router = APIRouter(prefix="/dictation", tags=["dictation"])


@router.get("/prompt")
def prompt(language: str = "en", wpm: int = 80, difficulty: str = "medium",
           topic: str = "", words: int = 120):
    text = generate_paragraph(language=language, difficulty=difficulty, topic=topic,
                              target_wpm=wpm, exam_style="ssc_steno",
                              word_count=words)
    est_sec = int(len(text.split()) / max(wpm, 40) * 60)
    return {"text": text, "wpm": wpm, "language": language,
            "est_time_sec": est_sec, "difficulty": difficulty}
