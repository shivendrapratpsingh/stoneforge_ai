import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
from app.db import get_db
from app.models_db import User
from app.schemas import SignupIn, LoginIn, TokenOut, UserOut
from app.security import hash_password, verify_password, create_access_token
from app.deps import get_current_user
from app.config import get_settings

log = logging.getLogger("stenoforge.auth")
router = APIRouter(prefix="/auth", tags=["auth"])


def _is_admin_email(email: str) -> bool:
    raw = get_settings().admin_emails or ""
    allowed = {e.strip().lower() for e in raw.split(",") if e.strip()}
    return email.lower() in allowed


@router.post("/signup", response_model=TokenOut)
def signup(data: SignupIn, db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    try:
        pw_hash = hash_password(data.password)
    except Exception as e:
        log.exception("hash failed")
        raise HTTPException(500, f"Hashing unavailable: {e}")
    user = User(
        email=email,
        name=(data.name or "").strip(),
        phone=(data.phone or "").strip(),
        password_hash=pw_hash,
        lang_pref=data.lang_pref,
        exam_target=data.exam_target,
        plan="free",
        is_admin=_is_admin_email(email),
    )
    try:
        db.add(user); db.commit(); db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Email already registered")
    except SQLAlchemyError as e:
        db.rollback()
        log.exception("signup db error")
        raise HTTPException(500, f"DB error: {e.__class__.__name__}")
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer",
            "user": UserOut.model_validate(user)}


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    # Auto-promote to admin if the email was added to ADMIN_EMAILS *after* signup.
    if _is_admin_email(email) and not user.is_admin:
        user.is_admin = True
        db.commit(); db.refresh(user)
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer",
            "user": UserOut.model_validate(user)}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
