# StenoForge AI — Run it end to end

## The single most important thing

Your previous attempt failed because Python loaded stale compiled bytecode
(`__pycache__\*.pyc`) instead of the updated source files. The new
`start-backend.bat` always wipes the cache and sets `PYTHONDONTWRITEBYTECODE=1`
so this can never happen again.

## Step-by-step — do exactly this

### 1. Open File Explorer → `C:\PROJECTS\StenoForge`

### 2. Double-click `start-backend.bat`

A black terminal window opens and shows:

```
============================================================
  StenoForge API bootstrap
============================================================
[StenoForge] Clearing Python bytecode cache...
[StenoForge] Creating Python virtual environment...   (first run only)
[StenoForge] Upgrading pip...
[StenoForge] Installing backend dependencies...       (first run, ~60s)
[StenoForge] Running self-test...
  [ok] password hashing works: scheme=pbkdf2-sha256
============================================================
  API:    http://127.0.0.1:8003
  Docs:   http://127.0.0.1:8003/docs
============================================================
INFO:     Started server process [...]
INFO:     Uvicorn running on http://127.0.0.1:8003
```

**Leave this window open.** If you see "Uvicorn running", the backend is alive.

### 3. Verify the backend in your browser

Open `http://127.0.0.1:8003/debug/selftest` — you should see:

```json
{ "hash_scheme": "pbkdf2-sha256",
  "verify_ok": true,
  "jwt_ok": true,
  "db_ok": true,
  "all_green": true }
```

If `all_green: true`, the backend is healthy. If not, paste the JSON to me.

### 4. Double-click `start-frontend.bat`

A second terminal opens and ends with:

```
  VITE v5.4.21  ready in 800 ms
  -> Local: http://localhost:5173/
```

### 5. Open the app and hard-refresh

Go to `http://localhost:5173`, press **Ctrl+Shift+R** (hard-refresh to bypass
the browser cache), then click **Start free**.

### 6. Sign up

Because you already tried to sign up once with
`pratapsinghshivendra21@gmail.com`, that email may already be in the DB. Two
options:

- Click **"Log in →"** at the bottom and use the same password you typed before.
- Or double-click `reset-db.bat`, then restart `start-backend.bat`, then sign up fresh.

## If something still fails

The pink banner in the UI will now tell you exactly what's wrong:

| Banner text                                    | Cause                    | Fix                                             |
|------------------------------------------------|--------------------------|-------------------------------------------------|
| `Email already registered`                     | You signed up before     | Click "Log in" with same password               |
| `HTTP 500: IntegrityError: ...`                | DB schema drift          | `reset-db.bat`, restart backend                 |
| `HTTP 500: OperationalError: ...`              | DB locked or corrupt     | Close any other Python/SQLite, `reset-db.bat`   |
| `backend unreachable — is it running on :8003?`| Backend crashed or down  | Check the backend terminal; re-run its .bat     |

The backend terminal also prints a full Python traceback for any 500, so
copy-paste that to me if you're stuck.

## Nuclear reset (if everything is weird)

```powershell
# In a PowerShell window:
cd C:\PROJECTS\StenoForge
.\start-backend.bat --fresh
```

The `--fresh` flag wipes the Python venv and reinstalls all dependencies from scratch.
