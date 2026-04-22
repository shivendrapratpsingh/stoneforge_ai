"""StenoForge AI - FastAPI entrypoint."""
import logging, traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.config import get_settings
from app.db import init_db, SessionLocal

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("stenoforge")
settings = get_settings()


@asynccontextmanager
async def lifespan(app):
    init_db()
    try:
        from app.content.seed import seed_all
        seed_all()
    except Exception as e:
        log.warning(f"[seed] skipped: {e}")
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=_origins or ["*"],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.exception_handler(Exception)
async def _unhandled(request: Request, exc: Exception):
    tb = traceback.format_exc()
    log.error(f"[500] {request.method} {request.url.path}\n{tb}")
    return JSONResponse(status_code=500,
        content={"detail": f"{exc.__class__.__name__}: {exc}", "path": request.url.path})


from app.routes import auth, typing, steno, dictation, analytics, lessons, ai, payments
app.include_router(auth.router)
app.include_router(typing.router)
app.include_router(steno.router)
app.include_router(dictation.router)
app.include_router(analytics.router)
app.include_router(lessons.router)
app.include_router(ai.router)
app.include_router(payments.router)


@app.get("/")
def root():
    return {"app": settings.app_name, "version": "1.0.0", "status": "ok"}


@app.get("/health")
def health():
    return {"ok": True, "env": settings.env, "ai_provider": settings.ai_provider}


@app.get("/debug/selftest")
def selftest():
    from app.security import hash_password, verify_password, create_access_token, decode_token
    r = {}
    try:
        h = hash_password("hello")
        r["hash_scheme"] = h.split("$")[1] if "$" in h else "?"
        r["verify_ok"] = verify_password("hello", h)
    except Exception as e:
        r["hash_error"] = f"{type(e).__name__}: {e}"
    try:
        r["jwt_ok"] = decode_token(create_access_token(42)).get("sub") == "42"
    except Exception as e:
        r["jwt_error"] = f"{type(e).__name__}: {e}"
    try:
        db = SessionLocal(); db.execute(text("SELECT 1")); db.close()
        r["db_ok"] = True
    except Exception as e:
        r["db_error"] = f"{type(e).__name__}: {e}"
    r["all_green"] = all(r.get(k) is True for k in ("verify_ok", "jwt_ok", "db_ok"))
    return r
