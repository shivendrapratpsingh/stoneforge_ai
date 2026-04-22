@echo off
REM StenoForge - one-click frontend launcher for Windows.
REM Clears Vite's optimize cache so code changes always take effect.

setlocal EnableDelayedExpansion
cd /d "%~dp0frontend"

echo ============================================================
echo   StenoForge Web bootstrap
echo ============================================================

REM Clear Vite's deps cache (forces fresh compile every run)
if exist "node_modules\.vite" (
    echo [StenoForge] Clearing Vite dep cache...
    rmdir /s /q node_modules\.vite
)

REM Nuke any stale vite.config timestamp shadow files - they can pin an old proxy target
echo [StenoForge] Removing stale vite.config timestamp files...
del /q vite.config.js.timestamp-*.mjs 2>nul

if not exist "node_modules" (
    echo [StenoForge] Installing frontend dependencies ^(first run, ~60s^)...
    call npm install
    if errorlevel 1 goto :fix_rollup
)

goto :launch

:fix_rollup
echo [StenoForge] npm install hit the rollup optional-dep bug. Cleaning...
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del /q package-lock.json
call npm install
if errorlevel 1 (
    echo [StenoForge] FATAL: npm install failed. Is Node.js 18+ installed?
    pause
    exit /b 1
)

:launch
echo.
echo ============================================================
echo   Web:     http://localhost:5173
echo   Backend: http://127.0.0.1:8003 (must also be running)
echo   Press Ctrl+C to stop, then Ctrl+Shift+R in browser to hard-refresh
echo ============================================================
call npm run dev
