# PlaySharp

> **Think quicker. Move smarter.**
> A browser-based cognitive football training platform — for clubs, schools, academies, and players.

PlaySharp is a startup-grade MVP that helps players sharpen **reaction speed**, **scanning ability**, **decision-making under pressure**, and **football intelligence** through short, interactive, measurable drills built with **Phaser.js**.

---

## Project Structure

```
playsharp/
├── backend/             # FastAPI + MongoDB API
│   ├── server.py        # All routes (contact, score, leaderboard)
│   ├── requirements.txt
│   └── .env             # MONGO_URL, DB_NAME, CORS_ORIGINS
└── frontend/            # React + Phaser.js
    ├── public/
    └── src/
        ├── pages/       # Home, Pricing, Contact, Demo, Leaderboard, Game pages
        ├── games/       # Phaser scenes (ReactionGame, DecisionGame)
        ├── components/  # Hero, Navbar, PricingCards, Leaderboard, …
        ├── services/    # api.js (axios)
        └── App.js       # Routes
```

---

## Tech Stack

- **Frontend:** React 19, React Router, Phaser.js 4, Tailwind CSS, Shadcn/UI, framer-motion, Sonner (toasts), Lucide icons
- **Backend:** FastAPI, Motor (async MongoDB driver), Pydantic v2
- **Database:** MongoDB

> **Note:** This environment uses **FastAPI + MongoDB** instead of Node.js/Express; the API contract (`/api/contact`, `/api/score`, `/api/leaderboard/{type}`) and behaviour are identical.

---

## Backend Routes

| Method | Route                              | Purpose                           |
|--------|------------------------------------|-----------------------------------|
| GET    | `/api/`                            | Health & motto                    |
| GET    | `/api/clubs`                       | List supported clubs              |
| POST   | `/api/contact`                     | Submit a contact / pilot request  |
| GET    | `/api/contact`                     | Admin: list contact submissions   |
| POST   | `/api/score`                       | Submit a game score               |
| GET    | `/api/leaderboard/{game_type}`     | Leaderboard (`reaction`/`decision`) |

**Leaderboard query params:** `club=All|<name>`, `period=all|weekly`, `limit=20`.

### Sample seed data

On first startup the backend seeds ~40 sample scores split across the three clubs (**South London FC**, **Croydon Juniors**, **Elite Academy**) so the leaderboards feel alive for demos.

---

## Pricing tiers (UI only — no real billing)

- **Basic — £19/month**
  Reaction drills, scanning, decision-making, football intelligence scoring, leaderboard access.
- **Advanced — Contact for price**
  Everything in Basic + expanded drill library, advanced analytics dashboard, personalised insights, club challenge tools, and **AI Coaching (Coming Soon)**.

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

## Demo flow

1. Visit `/demo`
2. Enter a player name and pick a club
3. Run **Reaction Drill** (10 rounds, false-start detection, ms precision)
4. Run **Decision Drill** (5 freeze-frame scenarios, pass/shoot/dribble)
5. See your score on the global **Leaderboard**, filterable by club or weekly view

Designed to take **under 60 seconds** end-to-end.

---

## Roadmap

- AI Coaching engine (Advanced tier)
- Stripe billing integration
- Club admin dashboard with multi-team management
- Scanning + spatial-awareness drills
- Mobile (iOS/Android) wrapper
