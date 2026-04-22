"""Pydantic request/response schemas (separate from ORM models)."""
from datetime import datetime
from typing import Optional, Literal, Any
from pydantic import BaseModel, EmailStr, Field


# ── Auth ──
class SignupIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = ""
    phone: str = ""
    lang_pref: Literal["en", "hi"] = "en"
    exam_target: str = "general"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
    phone: str = ""
    lang_pref: str
    exam_target: str
    plan: str
    is_admin: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


# ── Typing ──
class TypingEvaluateIn(BaseModel):
    prompt_text: str
    typed_text: str
    duration_sec: float = Field(gt=0)
    language: Literal["en", "hi"] = "en"
    test_id: Optional[int] = None


class TypingEvaluateOut(BaseModel):
    wpm: float
    gross_wpm: float
    accuracy: float
    errors: list[dict]
    error_rate: float
    correct_chars: int
    incorrect_chars: int
    duration_sec: float
    attempt_id: Optional[int] = None


# ── Steno ──
class StenoEvaluateIn(BaseModel):
    shorthand: str
    typed: str
    language: Literal["en", "hi"] = "en"


class StenoEvaluateOut(BaseModel):
    expected: str
    is_correct: bool
    hint: Optional[str] = None


class StenoOutlineOut(BaseModel):
    word: str
    outline: str
    notes: str = ""


# ── AI ──
class ParagraphGenIn(BaseModel):
    language: Literal["en", "hi"] = "en"
    topic: str = ""
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    target_wpm: int = 40
    exam_style: str = "ssc_steno"
    word_count: int = Field(default=120, ge=30, le=400)


class ParagraphGenOut(BaseModel):
    text: str
    word_count: int
    language: str
    difficulty: str
    topic: str
    est_time_sec: int


class CoachIn(BaseModel):
    language: Literal["en", "hi"] = "en"
    recent_wpm: float = 0
    recent_accuracy: float = 0
    common_errors: list[str] = []
    weak_chapters: list[str] = []


class CoachOut(BaseModel):
    summary: str
    drills: list[dict]


# ── Payments ──
class CreateOrderIn(BaseModel):
    plan_code: Literal["pro_monthly", "pro_yearly", "institute_monthly"]


class CreateOrderOut(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str
    plan_code: str
    razorpay_sub_id: str = ""


class VerifyPaymentIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_code: str


# ── Lessons ──
class LessonOut(BaseModel):
    id: int
    kind: str
    language: str
    slug: str
    title: str
    order_idx: int
    is_free: bool
    content_json: dict

    class Config:
        from_attributes = True


# ── Analytics ──
class ProgressPoint(BaseModel):
    date: str
    wpm: float
    accuracy: float
    attempts: int


class AnalyticsOut(BaseModel):
    total_attempts: int
    best_wpm: float
    avg_wpm: float
    avg_accuracy: float
    streak_days: int
    progress: list[ProgressPoint]
    weak_areas: list[str]


TokenOut.model_rebuild()
