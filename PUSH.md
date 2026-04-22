# Push StenoForge to GitHub

## Before you start

Get your repo's HTTPS URL from GitHub. On the empty repo page it looks like:

```
https://github.com/YOUR_USERNAME/stenoforge-ai.git
```

(replace YOUR_USERNAME and match your repo's actual slug — GitHub converts spaces to hyphens, so "StenoForge AI" becomes `stenoforge-ai` or `StenoForge-AI`.)

## One‑time: make sure Git is installed

Open PowerShell and run:

```powershell
git --version
```

If it says "not recognized", install from https://git-scm.com/download/win and reopen PowerShell.

## Push — copy/paste these into PowerShell

```powershell
cd C:\PROJECTS\StenoForge

# If a broken .git folder exists from an earlier attempt, remove it:
if (Test-Path .git) { Remove-Item -Recurse -Force .git }

# Init, commit, push
git init -b main
git config user.email "pratapsinghshivendra21@gmail.com"
git config user.name  "Shivendra Pratap Singh"

git add -A
git commit -m "Initial commit: StenoForge AI (FastAPI + Vite/React)"

# Replace the URL below with YOUR repo's URL from GitHub:
git remote add origin https://github.com/YOUR_USERNAME/stenoforge-ai.git

git push -u origin main
```

GitHub will pop up a browser to authenticate (or ask for a Personal Access Token). Sign in with your usual GitHub account.

## What gets pushed

The `.gitignore` in the repo root is configured so these do NOT leave your machine:

| Excluded | Why |
|---|---|
| `backend/venv/`, `backend/.venv/` | Python virtual envs — huge, recreated per machine |
| `backend/__pycache__/` | Python bytecode |
| `backend/.env` | **contains secrets** (JWT key, future Razorpay keys) |
| `backend/stenoforge.db` | local SQLite data |
| `frontend/node_modules/` | 239 MB of npm deps — recreated via `npm install` |
| `frontend/dist/` | build output |
| `frontend/vite.config.js.timestamp-*.mjs` | Vite dev-mode shadow files |
| `*.exe`, `*.msi`, `postgresql-*.exe` | Windows installers that shouldn't be in source |

Committed `.env.example` stays (it's the template with empty values — safe to share).

## After the first push

For future updates:

```powershell
cd C:\PROJECTS\StenoForge
git add -A
git commit -m "short message about what changed"
git push
```

## Collaborator setup (so anyone else can clone and run)

Add this to your README.md if you want (it's already there for dev):

```powershell
git clone https://github.com/YOUR_USERNAME/stenoforge-ai.git
cd stenoforge-ai
.\start-backend.bat
# in a second window:
.\start-frontend.bat
```

Because secrets live only in `.env` (which is gitignored), anyone cloning needs to copy `.env.example` to `.env` and fill in their own keys.

## If the push fails

| Error | Fix |
|---|---|
| `remote: Repository not found` | URL is wrong or repo is private and you're not logged in |
| `failed to push some refs` + `rejected` | Remote already has a README/LICENSE. Run `git pull origin main --allow-unrelated-histories` first, then `git push -u origin main` |
| `Updates were rejected because the tip of your current branch is behind` | Same as above |
| `Authentication failed` | Use a Personal Access Token: GitHub → Settings → Developer settings → Personal access tokens → "Generate new token (classic)" → tick `repo` scope. When git prompts for password, paste the token (not your GitHub password). |
| `file 'foo' is 104.00 MB; this exceeds GitHub's file size limit of 100.00 MB` | Something huge slipped past .gitignore. Tell me the filename and I'll add a rule. |
