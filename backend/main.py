"""Dev entrypoint - run `python main.py` from the backend folder.

For production use `gunicorn -k uvicorn.workers.UvicornWorker app.main:app`
(configured in the Dockerfile / Render blueprint).
"""
import os
from app.main import app  # noqa: F401 - expose for `uvicorn main:app`

if __name__ == "__main__":
    import uvicorn
    reload = os.getenv("STF_RELOAD", "0") == "1"
    port = int(os.getenv("STF_PORT", "8003"))
    print("=" * 60)
    print(f" StenoForge API starting on http://127.0.0.1:{port}")
    print(f" Docs:   http://127.0.0.1:{port}/docs")
    print(f" Health: http://127.0.0.1:{port}/health")
    print(f" Reload: {reload}  (set STF_RELOAD=1 to enable)")
    print("=" * 60)
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=port,
        reload=reload,
        reload_excludes=["*.db", "*.db-journal", "*.db-wal", "*.db-shm"],
        log_level="info",
    )
