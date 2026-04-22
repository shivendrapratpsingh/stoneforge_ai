@echo off
REM StenoForge — one-click backend launcher for Windows.
REM Always clears stale __pycache__ so code changes take effect without question.

setlocal EnableDelayedExpansion
cd /d "%~dp0backend"

REM Disable bytecode writing so .pyc caches can never go stale again
set PYTHONDONTWRITEBYTECODE=1

echo ============================================================
echo   StenoForge API bootstrap
echo ============================================================

REM 1. Kill anything already holding port 8003 (previous uvicorn leftover)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":8003 .*LISTENING"') do (
    echo [StenoForge] Killing process %%p on port 8003...
    taskkill /F /PID %%p >nul 2>&1
)

REM 2. Scrub every __pycache__ in backend/ — prevents stale bytecode
echo [StenoForge] Clearing Python bytecode cache...
for /d /r "%CD%" %%d in (__pycache__) do (
    if exist "%%d" rmdir /s /q "%%d"
)

REM 3. --fresh flag wipes venv for a clean reinstall
if /I "%1"=="--fresh" (
    if exist ".venv" (
        echo [StenoForge] --fresh: removing old .venv...
        rmdir /s /q .venv
    )
    if exist "venv" (
        echo [StenoForge] --fresh: removing old venv...
        rmdir /s /q venv
    )
)

REM 4. Create venv if needed
if not exist ".venv" (
    echo [StenoForge] Creating Python virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo [StenoForge] FATAL: could not create venv. Is Python 3.10+ on PATH?
        pause
        exit /b 1
    )
)

call .venv\Scripts\activate.bat

echo [StenoForge] Upgrading pip...
python -m pip install --upgrade pip --quiet

REM Show Python version so cross-version wheel issues are easy to spot
echo [StenoForge] Python:
python --version

echo [StenoForge] Installing backend dependencies (prefer prebuilt wheels)...
pip install --only-binary=:all: --prefer-binary -r requirements.txt
if errorlevel 1 (
    echo.
    echo [StenoForge] Prebuilt wheels not available for this Python. Retrying without the wheel restriction...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo [StenoForge] FATAL: dependency install failed.
        echo [StenoForge] Most likely cause: your Python is too new/old for the pinned packages.
        echo [StenoForge]   - Supported: Python 3.10, 3.11, 3.12, or 3.13
        echo [StenoForge]   - Install Python 3.12 from https://www.python.org/downloads/ then run start-backend.bat --fresh
        pause
        exit /b 1
    )
)

if not exist ".env" (
    echo [StenoForge] Creating .env from template...
    copy .env.example .env >nul
)

REM 5. Self-test — proves hashing + JWT + DB all work before starting server
echo [StenoForge] Running self-test...
python -c "from app.security import hash_password, verify_password; h=hash_password('x'); assert verify_password('x', h), 'verify failed'; print('  [ok] password hashing works: scheme=' + h.split('$')[1])"
if errorlevel 1 (
    echo [StenoForge] FATAL: password hashing self-test failed.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   API:    http://127.0.0.1:8003
echo   Docs:   http://127.0.0.1:8003/docs
echo   Test:   http://127.0.0.1:8003/debug/selftest
echo   Press Ctrl+C to stop
echo ============================================================
python main.py
