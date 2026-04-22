@echo off
REM Wipes the SQLite dev DB so you can sign up fresh.
cd /d "%~dp0backend"
if exist "stenoforge.db" (
    del /q stenoforge.db
    echo [StenoForge] Dev database deleted. Restart start-backend.bat to reseed.
) else (
    echo [StenoForge] No database to delete.
)
pause
