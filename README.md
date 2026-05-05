# PlaySharp

> **Think quicker. Move smarter.**
> A browser-based cognitive football training platform — for clubs, schools, academies, and players.

PlaySharp is a startup-grade MVP that helps players sharpen **reaction speed**, **scanning ability**, **decision-making under pressure**, and **football intelligence** through short, interactive, measurable drills built with **Phaser.js**.

---

## Project Structure

```
playsharp/
├── backend/                     # FastAPI + MongoDB API
│   ├── server.py                # Thin entrypoint: FastAPI app + middleware + startup
│   ├── core.py                  # Shared infra: Mongo client, rate limiter, logger, GAME_TYPES
│   ├── models/                  # Pydantic request/response models
│   │   ├── __init__.py          # Public re-exports
│   │   ├── contact.py           # Contact + ContactCreate
│   │   ├── score.py             # Score + ScoreCreate + ScoreResponse
│   │   └── club.py              # Club + ClubClaim + ClubClaimCreate
│   ├── routes/                  # API route modules (all mounted under /api)
│   │   ├── __init__.py          # Aggregates sub-routers into a single api_router
│   │   ├── meta.py              # GET /            · GET /clubs
│   │   ├── contact.py           # POST/GET /contact
│   │   ├── score.py             # POST /score
│   │   ├── club_claim.py        # POST/GET /club-claim
│   │   └── leaderboard.py       # GET /leaderboard/{game_type}
│   ├── services/                # Domain logic (reused across routes)
│   │   ├── clubs.py             # canonical_club() — name normalisation
│   │   └── seed.py              # seed_sample_data() — first-boot leaderboard seed
│   ├── scripts/                 # One-off maintenance scripts (reseed, etc.)
│   ├── tests/                   # Pytest regression suite
│   ├── requirements.txt
│   └── .env                     # MONGO_URL, DB_NAME, CORS_ORIGINS
└── frontend/                    # React + Phaser.js
    ├── public/
    └── src/
        ├── pages/               # Home · Pricing · Contact · Demo · Leaderboard · Game pages
        ├── games/               # Phaser scenes: ReactionGame · DecisionGame · ScanningGame
        ├── components/          # Hero · Navbar · PricingCards · Leaderboard · …
        ├── services/            # api.js (axios client)
        └── App.js               # Route table
```

### Backend architecture at a glance

`server.py` is a minimal ~50-line entrypoint that wires middleware, includes `api_router` (from `routes/`), and fires the startup seed. All domain logic lives in focused modules:

- **Add a new endpoint** → drop a file in `routes/`, register it in `routes/__init__.py`.
- **Add a new model** → drop a file in `models/`, re-export it in `models/__init__.py`.
- **Add cross-cutting logic** (e.g. a new game type, a new helper) → extend `core.py` or `services/`.

---

## Tech Stack

- **Frontend:** React 19, React Router, Phaser.js 4, Tailwind CSS, Shadcn/UI, framer-motion, Sonner (toasts), Lucide icons
- **Backend:** FastAPI, Motor (async MongoDB driver), Pydantic v2, SlowAPI (IP-based rate limiting)
- **Database:** MongoDB

---

## Backend Routes

All endpoints are mounted under `/api` via `routes/__init__.py`.

| Method | Route                              | Module                 | Purpose                                          |
|--------|------------------------------------|------------------------|--------------------------------------------------|
| GET    | `/api/`                            | `routes/meta.py`       | Health & motto                                   |
| GET    | `/api/clubs`                       | `routes/meta.py`       | List clubs that have submitted scores            |
| POST   | `/api/contact`                     | `routes/contact.py`    | Submit a contact / pilot request (10/min)        |
| GET    | `/api/contact`                     | `routes/contact.py`    | Admin: list contact submissions                  |
| POST   | `/api/score`                       | `routes/score.py`      | Submit a game score (20/min) · returns `isNewClub` |
| POST   | `/api/club-claim`                  | `routes/club_claim.py` | B2B lead capture for new clubs (5/min)           |
| GET    | `/api/club-claim`                  | `routes/club_claim.py` | Admin: list club claims                          |
| GET    | `/api/leaderboard/{game_type}`     | `routes/leaderboard.py`| Leaderboard (`reaction` / `decision` / `scanning`) |

**`game_type`** values: `reaction` (lower ms = better), `decision` (higher score = better), `scanning` (higher score = better).
**Leaderboard query params:** `club=All|<name>`, `period=all|weekly`, `limit=20`.

### Sample seed data

On first startup `services/seed.py` inserts 45 curated sample scores (15 reaction + 15 decision + 15 scanning) split across three clubs — **South London FC**, **Croydon Juniors**, **Elite Academy** — so the leaderboards feel alive for demos.

---

## Drills

1. **Reaction** — 5 rounds. A green circle flashes at a random spot on the pitch; tap it as fast as you can. False starts detected and penalised. ms precision.
2. **Decision** — 4 animated vertical-pitch scenarios (channel runner, wide overload, defensive shape, box arrivals). You pick A/B/C after the play; feedback is strictly **advisory** (no right/wrong) — you see your call next to the coach's preferred call with reasoning.
3. **Scanning** — 5 rounds. The pitch flashes with players for ~1.8s, then blanks — you answer one question about what you just saw (counts, locations, overloads, gaps, press outlets). Trains peripheral awareness and spatial recall.

---

## Pricing tiers (UI only — no real billing)

- **Free — £0**
- **Individual Player — £19/mo**
- **Team — £99/mo** (Most Popular)
- **School — Contact for price**
- **Academy — Contact for price**

---

## MongoDB Setup

Local Mongo is expected on `mongodb://localhost:27017` (set via `MONGO_URL` in `backend/.env`). The DB name comes from `DB_NAME` in the same file.

```bash
# Local mongo (mac/linux)
brew services start mongodb-community
# or
sudo systemctl start mongod
```

---

## Running locally (outside the Emergent environment)

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend

```bash
cd frontend
yarn install
yarn start          # runs on http://localhost:3000
```

Set `frontend/.env`:

```
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## Demo flow (`/demo`)

1. Enter a player name, age, and club
2. Run the **Reaction Drill** (5 rounds, ms precision, false-start detection)
3. Run the **Decision Drill** (4 vertical-pitch scenarios with advisory Coach's Notes)
4. Land on the global **Leaderboard** with your row highlighted — filter by club or weekly

The standalone **Scanning Drill** is available at `/games/scanning` and feeds the shared leaderboard (Scanning tab).

Designed to take **under 60 seconds** end-to-end.

---

## Testing

```bash
# Backend regression suite
cd backend && python -m pytest tests/ -q
```

Backend endpoints are covered by `tests/test_playsharp_api.py`, `test_playsharp_v13.py`, and `test_playsharp_v14_refactor.py` (added after the `routes/ · models/` split).

---

## Roadmap

- AI Coaching engine (Advanced tier) — LLM-generated personalised feedback
- Stripe billing integration for paid tiers
- Club admin dashboard with multi-team management
- Share-a-score / challenge-a-teammate viral loop
- Mobile (PWA / Capacitor) wrapper
