# PlaySharp — PRD

> **Motto:** Think quicker. Move smarter.

## Original Problem Statement (verbatim summary)

Build a fully working browser-based football cognitive training platform called **PlaySharp** — a startup-grade MVP demo + early SaaS foundation for football clubs, schools, and players. Helps players improve reaction speed, scanning ability, decision-making under pressure, and football intelligence through interactive cognitive football drills. **V1 — no real AI Coaching, no real Stripe, no real CRM** (all UI placeholders only).

## Architecture

- **Backend:** FastAPI + Motor (async MongoDB) at `/api/*`
- **Frontend:** React 19 + Phaser.js 4 + Tailwind + Shadcn/UI + framer-motion
- **DB:** MongoDB (collections: `contacts`, `scores`)

## User Personas

1. **Player** — wants to train cognitively, see ms-precision data, climb leaderboard.
2. **Coach** — wants to track tactical IQ, monitor squad progression, run warm-ups.
3. **Club admin** — wants weekly squad-wide challenges, internal competition, leaderboard.
4. **School / Academy** — wants structured cognitive PE drills, classroom-ready, browser-only.
5. **Parent / Visitor** — wants to understand product in <60 s, contact for pilot.

## Core Requirements (static)

- Hero with brand + motto + CTAs (Start Demo / View Pricing / Contact Us)
- Product explanation, audience cards (Players/Coaches/Clubs/Schools)
- Reaction game (10 rounds, false-start detection, ms timing)
- Decision game (5 freeze-frame scenarios — pass/shoot/dribble)
- Leaderboard (global + club filter + weekly view)
- Pricing (Basic £19/mo, Advanced "Contact for price" + AI Coaching coming-soon badge)
- Contact form (Name, Email, Club optional, Message) → POST /api/contact, stored in Mongo
- 3 clubs: South London FC, Croydon Juniors, Elite Academy
- Demo mode under 60s flow: Reaction → Decision → Leaderboard
- Dark sports-tech UI, Barlow Condensed + JetBrains Mono

## What's Implemented (2026-02 → 2026-05 — V1 → V1.3)

### V1.3 changes (this iteration)
- ✅ **Pricing — 5 tiers**: Free £0, Individual Player £19/mo, Team £99/mo (Most Popular), School Contact-for-price, Academy Contact-for-price; comparison table updated to 5 columns; AI Coaching badge on the 3 paid tiers
- ✅ **Decision game** completely rebuilt — 6 animated, realistic football scenarios with A/B/C choices instead of pass/shoot/dribble:
   1. **1v1 With the Keeper** (striker through on goal, GK rushing out)
   2. **Winger to the Byline** (cross / cut-in / cutback)
   3. **Defender Last Man** (offside trap / drop / sprint back)
   4. **Counter-attack Midfielder** (through-ball / switch / slow it)
   5. **Free Kick — Edge of Box** (whip in / shoot / short)
   6. **High Press Trigger** (press CB / cut lane / drop)
   - Phaser tweens animate player runs over 1.4–1.8s before pause + question overlay
   - Realistic pitch with both goal areas, 18-yard boxes, 6-yard boxes, penalty spots, centre circle, attack-direction arrow
   - Kit colours: red home / black opponent / yellow keeper / white teammate
- ✅ **Backend `canonical_club()`** — `south london fc` → `South London FC`; preserves FC/AFC/AC/CF/U12/U-12/U18 + any user-supplied all-caps acronym
- ✅ **Slowapi rate limiting** with custom key_func reading `X-Forwarded-For` (works behind k8s ingress) + SlowAPIMiddleware: `/score` 20/min, `/contact` 10/min, `/club-claim` 5/min — verified 5/25 success on burst test
- ✅ **`POST /api/club-claim`** new endpoint — captures B2B leads (contactName, email, role, squadSize, message)
- ✅ **`POST /api/score` returns `isNewClub` flag** — true if first score for that canonical club
- ✅ **ClubClaimModal** triggered when demo completes for a brand-new club; converts arbitrary-club input into qualified pilot leads (coach email + role + squad size)

### V1.2 (theme + free-text club)
- ✅ Atleticos red/black/white football-club editorial theme; Sofia Sans Extra Condensed display font
- ✅ Free-text Player name + Age + Club input on Demo / Reaction / Decision pages
- ✅ Hero: stadium photo + red-box-highlighted "quicker." + italic red "smarter."

### V1 (original)
- ✅ FastAPI backend, React + Phaser 4 frontend
- ✅ Home / Pricing / Contact / Demo / Leaderboard / Game pages
- ✅ Reaction game (10 rounds, false-start detection, ms precision)
- ✅ All elements use `data-testid`

## P0 / P1 / P2 Backlog

### P0 (next session if asked)
- Persist player identity across the demo (currently per-page form input)
- Add "share my score" link / OG image

### P1
- AI Coaching (real LLM integration on Advanced tier)
- Stripe checkout for Basic plan
- Club admin dashboard with multi-team management
- Weekly challenge auto-rotation + push notifications
- Scanning drill (3rd game type)

### P2
- Mobile wrapper (PWA / Capacitor)
- Coach analytics: per-player progression charts (Recharts)
- Email notifications on contact form (Resend integration)
- OAuth login (Google / Apple)

## Next Action Items

1. Validate end-to-end flow with testing agent.
2. (Optional) Wire revenue-driver: pricing modal with capture form on Advanced "Contact for Price".
3. (Optional) Add OG / share image for completed demo run.
