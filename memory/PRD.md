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

## What's Implemented (2026-02 → 2026-05 — V1 → V1.4)

### V1.4 changes (this iteration)
- ✅ **Reaction Game** — 5 rounds (down from 10), random green-circle position anywhere on the pitch; false-start detection kept
- ✅ **Decision Game** — rebuilt vertically with proper football camera (goal at TOP, attack runs UPWARD, defenders sit between attackers and the top goal); 4 user-specified scenarios with realistic tactics + offside line drawn at the second-last defender:
   1. **Channel Runner** — striker bends curved run from onside through the LB/LCB channel (correct: through-ball into channel)
   2. **Wide Overload** — opposition full-back engages ball, your overlap arrives behind, CBs hold proper depth (correct: slip to overlapping LB)
   3. **Defensive Shape** — compact back four, striker starts onside and bursts depth (correct: low through-ball before line resets)
   4. **Winger in the Box** — three runners occupy near-post / spot / far-post, winger at byline (correct: whip across 6-yard line for near-post)
- ✅ Offside line rendered as **red dashed horizontal line** at the deepest outfield defender's y-coordinate; properly excluded from box-scenario where it's not relevant
- ✅ All 4 scenarios respect offside law — runners start onside before breaking the line
- ✅ Goal area drawn at top: posts, 18-yard box, 6-yard box, penalty spot, D-arc; attack-direction arrow on left edge

### V1.3 changes
- ✅ **Pricing — 5 tiers**: Free £0, Individual Player £19/mo, Team £99/mo (Most Popular), School Contact-for-price, Academy Contact-for-price
- ✅ Backend `canonical_club()` normalisation
- ✅ Slowapi rate limiting with X-Forwarded-For key func + SlowAPIMiddleware
- ✅ `POST /api/score` returns `isNewClub` flag
- ✅ `POST /api/club-claim` endpoint for B2B lead capture
- ✅ ClubClaimModal triggered when demo completes for a brand-new club
- ✅ Curated top-15 seed leaderboard; user's row highlighted with **YOU** badge after submission; leaderboard auto-refreshes after each score saves

### V1.2 (theme + free-text club)
- ✅ Atleticos red/black/white football-club editorial theme; Sofia Sans Extra Condensed
- ✅ Free-text Player name + Age + Club input; Hero with stadium photo

### V1 (original)
- ✅ FastAPI backend, React + Phaser 4 frontend
- ✅ Home / Pricing / Contact / Demo / Leaderboard / Game pages
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
