# StenoForge AI — Free deploy (Vercel + Render)

Result: a permanent URL like `https://stenoforge-ai.vercel.app` that your friend (and anyone) can use. Costs 0. Takes ~20 minutes the first time.

> **Trade-off with free tier:** Render's free backend sleeps after 15 min of no traffic. The first visit after a nap takes ~30 seconds to wake up, then it's instant until the next nap. Perfectly fine for friend-testing.

---

## Step 1 — Commit the deploy configs

In PowerShell, from your repo root:

```powershell
cd C:\PROJECTS\StenoForge
git add -A
git commit -m "Add Render blueprint + Vercel config for free deploy"
git push
```

---

## Step 2 — Deploy the backend to Render

1. Go to **https://render.com** and sign up with your GitHub account (free, no credit card for free tier).
2. On the dashboard, click **New +** (top right) → **Blueprint**.
3. Connect your GitHub if prompted, then pick the **`stoneforge_ai`** repository.
4. Render reads `render.yaml` from the repo root and shows a preview — one service called `stenoforge-api`. Click **Apply**.
5. Wait 4-7 minutes for the first build. Watch the **Logs** tab — you want to see:
   ```
   INFO:     Application startup complete.
   ```
6. When it's live, the top of the service page shows the URL, e.g.
   ```
   https://stenoforge-api-abcd.onrender.com
   ```
   **Copy this URL** — you need it in step 3.
7. **Sanity check**: open `https://stenoforge-api-abcd.onrender.com/health` in your browser. You should see `{"ok":true,"env":"production","ai_provider":"mock"}`.

---

## Step 3 — Deploy the frontend to Vercel

1. Go to **https://vercel.com** and sign up with GitHub (free, no credit card).
2. Click **Add New...** → **Project** → pick the **`stoneforge_ai`** repository → **Import**.
3. **Important — configure before deploying:**
   - **Root Directory**: click **Edit** next to it and set to `frontend`
   - **Framework Preset**: Vite (should auto-detect)
   - Expand **Environment Variables** and add one:
     - Name: `VITE_API_BASE`
     - Value: **paste the Render URL from step 2.6**, e.g. `https://stenoforge-api-abcd.onrender.com`
4. Click **Deploy**. Takes ~2 minutes.
5. When it finishes you get a URL like `https://stoneforge-ai.vercel.app`. **This is the link you share with your friend.**

---

## Step 4 — Tell the backend about the frontend (CORS)

Right now CORS is set to `*` (everything), which works but is loose. Tighten it:

1. Back on Render → your `stenoforge-api` service → **Environment** tab → edit `CORS_ORIGINS` → set it to your Vercel URL, e.g. `https://stoneforge-ai.vercel.app`.
2. Click **Save Changes** — Render redeploys automatically.

---

## Step 5 — Share the link

Send your friend the Vercel URL: `https://stoneforge-ai.vercel.app`.

They click it, click **Start free**, sign up, and start using the app.

---

## Updating the deployed version

Whenever you push code to GitHub, both Render and Vercel auto-redeploy:

```powershell
cd C:\PROJECTS\StenoForge
git add -A
git commit -m "what changed"
git push
```

Render takes ~4 min to rebuild, Vercel takes ~2 min. Both zero-downtime.

---

## Known limits of the free tier (what to know before inviting real users)

| Limit | Free tier | Fix |
|---|---|---|
| Backend cold-starts after 15 min idle (~30s first hit) | Yes | Upgrade Render to `starter` ($7/mo) |
| SQLite resets on every Render deploy / restart | Yes, data is lost | Add a managed Postgres (Render offers one for $7/mo, or Supabase has a free tier) |
| Vercel free bandwidth | 100 GB/month | More than enough for friend testing and early beta |
| Render free build minutes | 500/month | Enough for ~30 deploys/day |

When you're ready for real users, tell me and I'll guide you through adding persistent Postgres + the paid Render plan. Or switch to **Fly.io** (free tier includes persistent storage, no cold starts, but requires a credit card for verification).

---

## If something breaks

| Symptom | Fix |
|---|---|
| Render build fails on `pip install` | Look for a package error in the build log. Most often it's Python-version mismatch — Render uses 3.11 which is fine for our pins. |
| Frontend loads but login/signup fails | Open DevTools → Network tab. If requests go to `http://localhost:...`, your `VITE_API_BASE` env var wasn't set on Vercel. Fix in Vercel → Project Settings → Environment Variables, then redeploy. |
| Signup returns `HTTP 403 CORS blocked` | `CORS_ORIGINS` on Render is wrong. Set it to your exact Vercel URL (no trailing slash). |
| Friend says "site is loading forever" on first visit | That's the cold start. Wait 30 seconds, refresh. It'll be fast after that for the next 15 min of activity. |
