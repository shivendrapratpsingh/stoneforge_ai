# StenoForge AI — Product Blueprint

> AI-powered typing & stenography training platform for Indian competitive-exam aspirants.
> Supports **English + Hindi**, teaches **Pitman New Era** shorthand, and is priced for the Bharat market.

---

## 1. Product Overview

**What it does.** StenoForge AI is a web platform that trains students and exam aspirants in three linked skills: touch typing, stenography (Pitman), and dictation transcription — the three gates for almost every Indian clerical / stenographer / court / typist government exam. The platform delivers structured lessons, on-demand AI-generated dictation passages tuned to the difficulty of each target exam, real-exam-style timed tests, and a weakness-tracking engine that tells the student exactly which key-pairs, shorthand outlines, or phonetic rules to drill next.

**Target users.**

- **Primary:** SSC Stenographer Grade C/D aspirants (100 / 80 wpm shorthand + 40–50 min transcription). ~5 lakh aspirants/year.
- **Secondary:** Bank / SSC CGL / RRB / LDC typing-test aspirants (30–35 wpm EN / 25–30 wpm HI). ~25 lakh/year.
- **Tertiary:** State High-Court stenographer and Judicial typist aspirants (state-specific, higher willingness to pay).
- **Quaternary:** Journalism students, court reporters, and professionals upskilling for court/media work.

**Core value proposition.**

1. *Exam-specific realism.* Paragraphs match the length, vocabulary, and passage style of the real exam (AI generates them, not a static corpus).
2. *Bilingual.* English and Hindi typing + dictation + shorthand in one subscription — no other Indian product does both well.
3. *Personal coach.* After every test you get a plain-language breakdown: "you drop 11% accuracy on `tion`/`sion` endings; try lesson 7B."
4. *Cheap and mobile-first.* ₹199/mo or ₹999/year is within reach for a PG student; the whole product works in the browser on a ₹10k laptop.

**Why it wins.** Existing Indian competitors (Softsys, Typemaster, Khaitan) sell static desktop CDs or offline coaching — no AI-generated content, no analytics, no mobile support. Typing.com and Keybr are great but English-only and not exam-shaped. StenoForge sits in the white space.

---

## 2. Feature Breakdown (module-wise)

### 2.1 Typing Trainer
- **Guided lessons:** 30 graded lessons per language (home row → full keyboard → numbers/symbols → punctuation-heavy passages).
- **Live metrics:** WPM (standard 5-chars-per-word), raw WPM, accuracy %, error count, per-character heatmap (which letters the user misses most).
- **Key-pair error detection:** flags specific bigrams that slow the user (e.g. `th`, `ing`, `क्ष`).
- **Modes:** free-type, guided lesson, timed test (1/2/5/10 min).
- **Bilingual:** Hindi uses Remington / Inscript layout (both supported, picked in settings).

### 2.2 Stenography Trainer (Pitman New Era)
- **Theory modules:** 24 chapters covering strokes, consonants, vowel-places, diphthongs, hooks, circles, loops, halving, doubling, contractions, short-forms, and phraseography.
- **Symbol library:** 600+ outline SVGs rendered in-browser, each with audio pronunciation.
- **Dictation practice:** passages replayed at the user's chosen speed (60/80/100/120/150 wpm). Audio is synthesised (Amazon Polly / Azure Neural TTS) with natural prosody.
- **Transcription evaluation:** the user's typed transcription is diffed against the original with a forgiving fuzzy-match (handles synonyms and spelling variants).
- **Shorthand outline practice:** draw or select the correct outline for a dictated word — instant feedback.

### 2.3 AI Paragraph Generator
- **Exam-shaped output:** prompts specify target exam (SSC-C / SSC-D / bank / court), language (EN/HI), length, WPM, topic bucket (polity, economy, current affairs, general) and outputs a paragraph with correct difficulty and register.
- **Level control:** `easy | medium | hard | exam-grade`. Easy = short sentences, common vocab; hard = complex clauses, Sanskrit-derived Hindi, compound numerals.
- **Consistency:** stores a JSON schema contract with the LLM (structured output + few-shot exemplars) so every paragraph has word count ±3% of target.
- **Usage gating:** free users get 3/day; paid users unlimited.

### 2.4 Test Module
- **Live exam simulator:** mimics SSC/bank UI down to the timer and "submit" modal.
- **Three test types:** (a) typing-only speed test (10 min), (b) dictation + transcription (4-6-8-10 min dictation, 40-65 min transcription), (c) shorthand-outline recognition quiz.
- **Anti-cheat:** paste blocked, right-click disabled during tests, tab-switch counted and displayed on the result.
- **Deterministic scoring:** formula follows SSC pattern — `Gross WPM - (5 × full mistakes + 1 × half mistakes)`.

### 2.5 Practice Engine
- **Daily challenge:** one 3-minute drill per day, streak tracked, shareable to WhatsApp/IG.
- **Weak-area drills:** engine looks at the user's last 10 sessions and auto-generates drills targeting their worst bigrams / outline categories.
- **Spaced repetition:** shorthand outlines the user gets wrong re-surface after 1d / 3d / 7d intervals.

### 2.6 Performance Analytics
- **Per-session report:** raw + gross WPM chart, accuracy curve, error heat-map, per-finger breakdown, fastest/slowest minute.
- **Trend dashboard:** 7-day and 30-day WPM trajectory, accuracy trend, estimated "exam readiness %" (composite score).
- **AI coach:** after each test, an LLM summary like "You're 4 wpm short of the SSC-D threshold. Your accuracy on punctuation drops your gross by 6 wpm. Suggested drill: Lesson 14 — punctuation repetition."

---

## 3. User Flow (step-by-step)

1. **Landing page** — value prop headline, WPM calculator demo (try-without-signup), pricing preview, testimonial strip.
2. **Signup** — email or mobile OTP (MSG91 / Fast2SMS) + name + target exam (dropdown) + language preference. Issues JWT. Creates free-tier user row.
3. **Onboarding quiz** — 2-minute placement test. Measures current WPM and accuracy; assigns starting lesson based on score.
4. **Dashboard** — shows streak, today's challenge, "continue lesson" card, last-test scorecard, and upgrade banner if free.
5. **Practice** — user picks module (Typing / Shorthand / Dictation). First three sessions per day free; fourth triggers soft paywall.
6. **Test** — timed full-simulation test. Submits at end; result page shows scorecard + AI coach feedback + share button.
7. **Upgrade nudge** — triggered at three moments: (a) 4th daily practice attempt, (b) viewing detailed analytics (locked for free), (c) attempting a full exam simulation. Modal shows "₹199 for unlimited practice" with Razorpay button.
8. **Payment** — Razorpay Standard Checkout; on success webhook flips user to `pro`. Subscription renews monthly / yearly.
9. **Retention loop** — daily 9 am WhatsApp reminder ("you missed your streak"), weekly progress email, gamified badges.

---

## 4. Monetization Strategy

### Free tier (permanent, ad-free)
- 3 AI-generated paragraphs / day
- 3 practice sessions / day
- 10 shorthand theory chapters (out of 24)
- Basic after-test stats (WPM + accuracy only, no deeper analytics)
- 1 full exam simulation per week

### Pro tier (₹199 / month, ₹999 / year) — primary SKU
- Unlimited AI paragraphs & practice
- All 24 shorthand chapters + audio library
- Full analytics + AI coach
- Unlimited exam simulations
- Downloadable PDF progress report for coaching institutes
- Priority support

### Institute tier (₹2,999 / month, up to 50 students)
- Admin dashboard
- Bulk student onboarding
- Leaderboards
- White-label option (+₹5,000/mo)

### Pricing psychology (deliberate choices)
- **Anchor ₹999/yr against ₹199/mo:** yearly appears 58% cheaper → 40% of conversions go yearly (higher LTV).
- **Free tier is generous by design:** it's the growth loop. Students tell each other. Don't cripple the free tier by hiding the typing trainer.
- **Payment prompt copy matters:** "Unlock ₹8,000 exam coaching for ₹199" converts 2× better than "Upgrade to Pro".
- **Referral reward:** ₹50 Amazon voucher per paid referral — half off the first month.
- **Coaching-institute partnerships:** offer a 30% revenue share to coaching class owners who onboard their students. Sticky B2B2C channel.

---

## 5. Payment Integration

**Razorpay (primary, India-native).** Use *Razorpay Standard Checkout* for one-time payments and *Razorpay Subscriptions* for recurring.

### Subscription logic
1. User clicks Upgrade → backend creates a Razorpay *subscription_id* with plan `plan_monthly_199` or `plan_yearly_999`.
2. Frontend opens checkout with that subscription_id.
3. On success, Razorpay sends `subscription.charged` webhook.
4. Backend verifies signature (HMAC-SHA256 of body + webhook secret), upserts `subscriptions` row, flips `users.plan = 'pro'`.
5. On `subscription.halted` or `subscription.cancelled` webhook, flip `users.plan = 'free'`.

### Free-trial handling
- 7-day free trial on yearly plan. Razorpay Subscriptions supports this natively (`trial_period`).
- Card is authorised on day 0 (₹1 auth), full charge on day 7 unless cancelled.

### Upgrade / downgrade
- Monthly → Yearly: cancel active subscription, create new yearly subscription with prorated credit (issue a one-time credit note via Razorpay settlements API).
- Downgrade: schedule plan change at end of current period (flag in DB; webhook handler respects the flag).

### Stripe (secondary, for USD users)
- Same flow, just swap SDK. Stripe Customer Portal for self-service cancellation.

---

## 6. AI System Design

### Where AI is used
- **Paragraph generator** — generates dictation / typing passages.
- **Performance coach** — summarises the user's test into actionable advice.
- **Practice recommender** — picks the next drill based on the user's weakness profile.
- **Shorthand teacher (v2)** — answers "why is 'gh' written as F-stroke?" with natural-language Pitman theory.

### Model choice
- **Claude Sonnet** (via `claude-sonnet-4-5-20250929` on Anthropic API) or **GPT-4o-mini** for cost. Swappable via `LLM_PROVIDER` env var.
- Temperature 0.4 for paragraph generation (some variety, not chaotic), 0.2 for coach feedback (stability).

### Prompt strategy

**Paragraph generation (structured output + JSON contract):**
```
System: You generate exam-style dictation paragraphs for Indian typing/stenography
candidates. Output MUST be valid JSON matching {paragraph, word_count, difficulty,
topics[], est_wpm_for_difficulty}. Paragraph word count must be within ±3% of target.

User: Generate one {language} paragraph for the {exam} examination.
Target word count: {words}. Difficulty: {difficulty}. Topic: {topic}.
Register: formal, third-person, {topic}-appropriate vocabulary.
Avoid: first-person pronouns, quotations, lists, em-dashes, footnotes.
Include: at least {n_commas} commas, at least one semicolon if difficulty >= hard,
a realistic mix of abstract and concrete nouns.

Return only JSON.
```

Few-shot exemplars (2-3 in context) force the model to match tone. Response is `response_format={"type":"json_object"}` so we can parse deterministically.

**Coach feedback prompt:**
```
System: You are a patient typing coach for Indian govt-exam aspirants.
Given structured metrics, write 3-4 sentences of specific, encouraging,
Hinglish-friendly feedback. Name the weakest skill. Recommend ONE drill.

User: metrics={"wpm":28,"accuracy":92.3,"errors":["th","tion","semicolons"],"target_wpm":35}
```

### Keeping responses useful
- Validate JSON output; if parse fails, retry once with "Your previous response was not valid JSON" appended.
- Word-count validator: if off by >3%, regenerate with a length hint.
- Profanity / unsafe content filter: OpenAI moderations or a simple blocklist; paragraphs must be exam-appropriate.
- Cache paragraphs by (lang, exam, difficulty, topic, seed) for 24h to save tokens.

---

## 7. Tech Architecture

### Backend (Python 3.11, FastAPI)

```
backend/
├── app/
│   ├── main.py              # FastAPI app + CORS + router mount
│   ├── db.py                # SQLAlchemy engine/session
│   ├── models_db.py         # User, Test, Attempt, Subscription, Lesson
│   ├── security.py          # bcrypt + JWT
│   ├── deps.py              # get_db, get_current_user
│   ├── models/schemas.py    # Pydantic v2 schemas
│   ├── routes/
│   │   ├── auth.py          # signup, login, me
│   │   ├── typing.py        # lessons, evaluate, submit
│   │   ├── steno.py         # theory, outline quiz, evaluate
│   │   ├── dictation.py     # passages, evaluate
│   │   ├── analytics.py     # history, trends, weaknesses
│   │   ├── ai.py            # paragraph, coach, recommend
│   │   └── payments.py      # razorpay order + webhook
│   ├── services/
│   │   ├── typing_engine.py
│   │   ├── steno_engine.py
│   │   ├── dictation_engine.py
│   │   ├── analytics_engine.py
│   │   └── ai_client.py     # pluggable LLM wrapper
│   ├── content/
│   │   ├── lessons_en.py
│   │   └── lessons_hi.py
│   └── data/
│       ├── steno_map.json
│       └── steno_map_hi.json
├── requirements.txt
├── .env.example
└── Dockerfile
```

### Database schema (SQLite dev → PostgreSQL prod)

```
users            (id, email, phone, name, pwd_hash, lang_pref, exam_target, plan, created_at)
subscriptions    (id, user_id, razorpay_sub_id, plan_id, status, current_period_end, created_at)
tests            (id, user_id, kind, language, target_wpm, prompt_text, created_at)
attempts         (id, test_id, user_id, typed_text, wpm, gross_wpm, accuracy,
                  errors_json, duration_sec, created_at)
lessons          (id, kind, language, slug, title, content_json, order_idx, is_free)
ai_generations   (id, user_id, kind, params_json, output_text, tokens, created_at)
```

### Frontend (React 18 + Vite + React Router)

```
frontend/
├── package.json
├── vite.config.js
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── lib/api.js
│   ├── components/
│   │   ├── TypingArea.jsx   # the real engine (canonical WPM/accuracy)
│   │   ├── Navbar.jsx
│   │   ├── PaywallModal.jsx
│   │   └── ShortcutIcon.jsx
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── TypingTrainer.jsx
│   │   ├── StenoLesson.jsx
│   │   ├── Dictation.jsx
│   │   ├── Test.jsx
│   │   ├── Results.jsx
│   │   └── Pricing.jsx
│   └── styles/app.css
```

### API flow (happy path)
1. `POST /auth/signup` → user created, JWT returned
2. `POST /auth/login` → JWT returned
3. `GET  /typing/lessons?lang=en` → list of lessons
4. `POST /typing/evaluate` → `{wpm, gross_wpm, accuracy, errors}`
5. `POST /ai/paragraph` → generated paragraph (gated, quota-counted)
6. `POST /tests/submit` → attempt row, returns result + coach message
7. `GET  /analytics/summary` → last 30 days
8. `POST /payments/order` → Razorpay subscription id
9. `POST /payments/webhook` (Razorpay → us) → flip user plan

---

## 8. MVP Plan (build fast)

### Week 1 — foundation & auth
- FastAPI + SQLAlchemy + JWT auth (done in this repo)
- React shell + router + landing + login/signup pages
- `/typing/evaluate` with real WPM engine
- 3 seed typing lessons in English, 2 in Hindi
- Deployable Docker setup

### Week 2 — content + AI
- All 30 EN + 30 HI typing lessons (can be static JSON)
- Shorthand theory chapters 1-6 (static MD)
- `/ai/paragraph` wired to Claude or GPT
- Test module + results page
- Basic analytics (avg WPM, accuracy, streak)

### Week 3 — monetization & polish
- Razorpay integration (subscription + webhook)
- Paywall modals at the three trigger points
- Coach feedback API
- Trend charts on dashboard
- First marketing push (see §9)

### What to ignore initially
- Institute tier / admin dashboard (Week 5+)
- Shorthand outline drawing canvas (Week 6+ — hard UX)
- Mobile native app (stay web-only until PMF)
- Leaderboards (vanity metric early on)
- Fully-featured Hindi Inscript layout preview (only one layout in v1)

---

## 9. Growth Strategy

### First 100 users (free tier)
- **Reddit:** genuine posts in r/IndianStudents, r/SSCStenoGuide, r/CompetitiveExams — "I built this for myself, it's free, feedback?"
- **Telegram:** post in 5 stenographer prep groups; offer a free 1-month Pro code to the first 50 commenters.
- **YouTube partnerships:** 3 mid-size SSC Steno coaching channels; offer them 30% rev share for first year of referred users.
- **Instagram reels:** 60-second "type 40 wpm in 30 days" clips, clip the best user improvements from the platform.
- **Quora answers:** seed 20 high-quality answers on "how to practice for SSC Stenographer" mentioning the product.

### Retention
- Streaks (Duolingo-style) with WhatsApp reminders via MSG91.
- Weekly progress email ("you moved from 24 to 29 wpm — 5 more and you clear SSC-D").
- Gamified badges (first 30wpm, first 50wpm, first perfect accuracy test, etc.).
- Cohort leaderboard among users who share the same target exam date.

### Scaling revenue
- Once at 5k monthly active users: launch the **institute tier** aggressively — coaching classes are cash-rich and churn-low.
- Add **certificate tier** (₹499 for an AI-proctored speed certificate usable on résumés / LinkedIn).
- Add **regional languages** (Tamil, Bengali, Marathi) — each unlocks a new state exam market.
- Long-term: licensing the engine to govt-exam coaching institutes as white-label.

---

## 10. Risk & Mistakes to Avoid

### Common startup mistakes
- **Building features no one asked for.** Don't add shorthand drawing canvas until 1000 users have typed text through the app.
- **Ignoring distribution.** The best typing engine in the world loses to the 2nd-best one that's on the right Telegram groups.
- **Over-monetising the free tier.** Students talk. A mean free tier kills word-of-mouth.
- **Obsessing over Hindi parity on day one.** Ship English-first, Hindi a week later; don't block launch for parity.

### Technical over-engineering to avoid
- **Don't use microservices.** Monolith FastAPI + SQLite → Postgres is plenty for 50k MAU.
- **Don't Redis-cache on day one.** Cache AI paragraphs to SQLite. Add Redis only when you measure cache-miss pain.
- **Don't SSR.** Vite SPA + backend JSON is simpler than Next.js SSR for this product.
- **Don't roll your own auth.** JWT + bcrypt is enough; skip OAuth until users ask for it.

### Monetisation failure modes
- **Paywalling the typing trainer itself.** Never do it — that's the entry drug.
- **Yearly-only pricing.** Students pay monthly; ₹199 is the magic number.
- **Opaque renewals.** Show the next billing date clearly and offer one-click cancel. Indian users distrust auto-renew; transparency converts.
- **No refunds.** Offer a 7-day no-questions refund; it lowers signup friction far more than the refund cost.

### Legal / compliance
- **DPDP Act** (India's data protection law) — maintain a clear privacy policy; don't share user data across the institute tier without consent; host on Indian region (AWS Mumbai / Azure India Central).
- **GST:** registration threshold ₹20L turnover; keep invoices compliant from day one if planning institutional sales.
- **Razorpay KYC:** company or sole-prop account, PAN + bank docs required; start the process in week 1, approval takes 3-5 days.

---

*Document version 1.0 — produced April 2026.*
