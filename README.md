# StenoForge AI

AI-powered typing and stenography training for Indian government exams
(SSC Stenographer Grade C/D, SSC CGL/CHSL, Bank PO, court/judicial clerks).

**Tech stack:** FastAPI + SQLAlchemy + React 18 (Vite) + Razorpay + pluggable LLM
(Claude Sonnet or GPT-4o-mini). Bilingual: **English + हिन्दी**.

---

## Features

- ⚡ Typing trainer with live WPM/accuracy + diff-level error analysis
- ✍️ Pitman New Era shorthand trainer (EN) and Devanagari outlines (HI)
- 🤖 AI paragraph generator (exam-style, difficulty + topic controls)
- 🧑‍🏫 Personal AI coach with daily drill plans
- 📚 54 seeded lessons (30 typing + 24 shorthand) per language
- 📊 30-day progress analytics + streaks + weak-area detection
- 💳 Razorpay integration (Pro Monthly ₹199, Pro Yearly ₹999, Institute ₹2999)
- 🔐 JWT auth with bcrypt password hashing
- 🐳 Docker + docker-compose + ready-to-deploy Render/Railway/Fly configs

---

## Local development

### Prerequisites

- Python 3.11+
- Node 20+
- (Optional) PostgreSQL — SQLite is fine for dev

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                # fill in keys as needed
python main.py                                      # starts at http://127.0.0.1:8003
# Swagger UI:      http://127.0.0.1:8003/docs
```

The app **auto-creates** the SQLite DB and **seeds 108 lessons** on first run.

### Frontend

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173 — proxies /api → 127.0.0.1:8003
```

---

## Configuration (backend `.env`)

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | JWT signing key (generate with `secrets.token_urlsafe(48)`) |
| `DATABASE_URL` | `sqlite:///./stenoforge.db` (dev) or Postgres URL (prod) |
| `AI_PROVIDER` | `mock` (offline), `anthropic`, or `openai` |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | For real AI paragraphs + coach |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | For real payments (mock works without) |
| `RAZORPAY_WEBHOOK_SECRET` | For webhook signature verification |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |

See `backend/.env.example` for the full list.

---

## Deploy

### Docker (local VPS / any cloud)

```bash
cp backend/.env.example backend/.env      # edit with production keys
docker-compose up -d --build
# Frontend: http://<server>:5173   Backend: http://<server>:8000
```

### Render.com (one-click)

Commit the repo and then in Render → **New → Blueprint**, point at `deploy/render.yaml`.
This provisions:
- **stenoforge-api** (FastAPI web service, Singapore region)
- **stenoforge-web** (Vite static site)
- **stenoforge-db** (managed PostgreSQL)

Fill the `ANTHROPIC_API_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and
`RAZORPAY_WEBHOOK_SECRET` as environment-group secrets.

### Railway

```bash
railway login
railway init
railway up          # uses deploy/railway.toml
```

### Fly.io (Mumbai region for Indian latency)

```bash
fly launch --dockerfile backend/Dockerfile --config deploy/fly.toml
fly secrets set SECRET_KEY=... ANTHROPIC_API_KEY=... RAZORPAY_KEY_ID=... ...
fly deploy
```

---

## API

All routes, schemas and example requests are documented at **`/docs`** (Swagger UI)
and **`/redoc`** once the backend is running.

Key endpoints:

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/signup` | – | Create account, returns JWT |
| POST | `/auth/login`  | – | Email + password login |
| GET  | `/auth/me`     | bearer | Current user profile |
| POST | `/typing/evaluate` | optional | Evaluate typed text → WPM/accuracy/errors |
| POST | `/steno/evaluate`  | – | Check a shorthand outline answer |
| GET  | `/steno/search`    | – | Search outlines |
| POST | `/ai/paragraph`    | bearer (Pro for unlimited) | Generate exam-style paragraph |
| POST | `/ai/coach`        | bearer | Personalised drill plan |
| GET  | `/lessons`         | optional | List lessons; Pro content auto-locked for free |
| GET  | `/analytics/me`    | bearer | 30-day progress + weak areas |
| GET  | `/payments/plans`  | – | Plan catalogue |
| POST | `/payments/create-order` | bearer | Start Razorpay checkout |
| POST | `/payments/verify`       | bearer | Verify signature → upgrade plan |

---

## Project structure

```
StenoForge/
├── backend/
│   ├── app/
│   │   ├── main.py           ← FastAPI entrypoint + lifespan (DB init, seed)
│   │   ├── config.py         ← pydantic-settings loader
│   │   ├── db.py             ← SQLAlchemy engine + session
│   │   ├── models_db.py      ← ORM models (User, Attempt, Lesson, Subscription...)
│   │   ├── schemas.py        ← Pydantic request/response
│   │   ├── security.py       ← JWT + bcrypt
│   │   ├── deps.py           ← get_current_user, free-quota guard
│   │   ├── routes/           ← auth, typing, steno, ai, payments, lessons, ...
│   │   ├── services/         ← typing_engine, steno_engine, ai_client, payments
│   │   ├── content/          ← lessons_en.py, lessons_hi.py, seed.py
│   │   └── data/             ← steno_map.json (EN), steno_map_hi.json (HI)
│   ├── .env.example
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx           ← React Router setup
│   │   ├── main.jsx          ← AuthProvider + BrowserRouter
│   │   ├── lib/              ← api.js (axios), auth.jsx (context)
│   │   ├── components/       ← Layout, Protected, Paywall
│   │   └── pages/            ← Landing, Login, Signup, Dashboard,
│   │                          TypingTrainer, StenoTrainer, Lessons, Pricing
│   ├── Dockerfile
│   ├── deploy-nginx.conf
│   ├── vite.config.js
│   └── index.html
├── deploy/
│   ├── render.yaml
│   ├── railway.toml
│   └── fly.toml
├── docs/
│   └── DESIGN.md            ← 10-section product design
├── docker-compose.yml
└── README.md
```

---

## Pricing

| Plan | Price | What you get |
|---|---|---|
| **Free** | ₹0 | 3 daily AI paragraphs · 3 daily sessions · first 3 lessons/module |
| **Pro Monthly** | ₹199/mo | Unlimited everything, all lessons, AI coach, analytics |
| **Pro Yearly** | ₹999/yr | ~58% off monthly — 2 months free, priority support |
| **Institute** | ₹2,999/mo | Up to 25 seats, teacher dashboard, bulk reports |

Payments processed via Razorpay (GST invoices on request).

---

## License

Proprietary — © 2026 StenoForge AI. All rights reserved.
