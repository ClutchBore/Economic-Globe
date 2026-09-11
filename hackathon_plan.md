# Economic Globe — Hackathon Plan

## Overview

An interactive world map/globe (inspired by Harvard's *Globe of Economic Complexity*) showing per-country economic data — GDP, GDP per capita, inflation, bond yields, currency — with an AI-assisted layer on top: country summarization, comparison, anomaly detection, and a chatbot for country-specific questions.

**Stack**
- **Frontend:** React + Vite, react-simple-maps (or globe.gl — see open decisions), Recharts/Plotly.js, Tailwind
- **Backend:** Python + FastAPI
- **Data sources:** World Bank API (via `wbgapi`), yfinance, optionally IMF DataMapper — see open decisions
- **AI layer:** OpenRouter (paid balance, ~$10), small/fast model for cost + latency
- **Analysis:** pandas — correlation, rolling windows, Composite Market Health Score, std-dev anomaly detection
- **Cache:** flat JSON, pre-fetched ahead of the demo; live calls only as optional refresh, never in the critical demo path
- **Deployment:** Vercel (frontend + FastAPI backend in one project via Services)

**Open decisions — lock these before hour 0:**
1. **Globe vs. map** — 3D globe.gl (higher visual impact, higher build cost) vs. 2D react-simple-maps (faster, more predictable). Whoever owns the frontend branch needs this settled before they start.
2. **IMF in or out of the hour 0–4 data pipeline** — was in the original 3-source plan, dropped from the latest consolidated list. Confirm intentional or add it back.
3. **Which OpenRouter model** — pick a small/fast paid model before building against it.

---

## Shared contract (all three branches build against this)

To let all three branches run in parallel without blocking on each other, agree on this up front and treat it as frozen once work starts:

- **Per-country schema** — one JSON shape every source normalizes into, e.g.:
  `{country_code, country_name, gdp, gdp_per_capita, inflation, bond_yield_10y, fx_rate, ...}`
- **Country config file** — `country_code → ticker suffix → index/ETF ticker → currency → World Bank code`, capped at ~25–30 countries
- **Mock data fixture** — Person A publishes a small hand-written JSON file matching the schema in the first hour, so Person B and Person C can build against realistic-looking data before the real pipeline is done
- **Merge cadence** — short syncs at hour 4, hour 8, and hour 14 to merge branches and catch integration issues early, not just at the end

---

## Branch 1: `feature/backend-data-ai` — Person A

Backend, data pipeline, and AI layer (folded together since the AI routes sit directly on top of the cache-read code).

- Set up FastAPI app skeleton
- Write fetch/normalize scripts for World Bank (`wbgapi`) and yfinance (rate-limited, cached, with retry/backoff), and IMF if kept in scope
- Build the country config file and shared per-country JSON cache
- Publish the mock data fixture early for B and C to build against
- Cache-first read pattern: API reads cache, live yfinance call only as optional refresh with fallback to last-known-good data
- Data-serving FastAPI routes (by country, by metric, by comparison pair)
- AI layer (`services/ai.py`): `summarize_country`, `compare_countries`, `chat_about_country`, wired to OpenRouter — build this as a reusable client/module so Person C can call the same OpenRouter setup for anomaly narration rather than duplicating it
- Routes: `POST /api/summarize/{country_code}`, `POST /api/compare`, `POST /api/chat/{country_code}`
- Pre-generate and cache country summaries ahead of the demo as a fallback if live calls are slow/rate-limited
- Wire in Person C's Market Health Score, anomaly, and rankings outputs once available (route registration for `POST /api/anomaly/explain` lives here, logic owned by Person C)
- Set an OpenRouter `max_price` cap and usage alerts

## Branch 2: `feature/frontend-viz` — Person B

Frontend, visualization, and UI.

- Scaffold React + Vite project, Tailwind setup
- Build the map/globe component against the mock data fixture (don't wait on Person A's real pipeline)
- Metric switcher (GDP / inflation / bond yields / currency)
- Country detail panel: click a country → show its data, AI summary, and a "compare to..." action
- Comparison view/UI
- Chat interface for the country chatbot (should support streaming)
- Charts (Recharts or Plotly) for time-series/comparison views
- Swap mock data for live API calls once Person A's routes are ready (hour 4 sync)
- Handle loading/error states gracefully (cache misses, slow AI responses, rate limits)

## Branch 3: `feature/analysis-layer` — Person C

Quantitative analysis — the differentiator layer.

- Prototype in a notebook first against the mock data fixture, then package as clean importable functions for Person A to wire into FastAPI routes
- Correlation analysis and rolling windows across metrics
- Design and compute the Composite Market Health Score (weighted combo of index performance, volatility, currency stability, inflation/GDP trend)
- Std-dev threshold anomaly detection per metric per country
- Document the score/anomaly logic clearly (units, thresholds, weighting rationale) so Person A can wire it in without needing to reverse-engineer it, and so it's easy to explain to judges
- **Own `explain_anomaly` end-to-end**: write the AI narration call for flagged anomalies yourself, reusing Person A's OpenRouter client module rather than handing raw output to A to narrate — keeps the full anomaly feature (detect → explain) in one place
- **Prep historical/trend data structures**: shape the rolling-window output so it's ready to back a time-slider if there's time for that stretch goal later — no one else needs to touch this later if you set the shape up now
- **Rankings/leaderboard output**: top N countries by Market Health Score, biggest movers, most anomalies flagged — extends your existing computation (no new libraries) and gives Person B a demo-friendly UI surface beyond the map itself

---

## Timeline

| Hours | Focus |
|---|---|
| Prep (before hour 0) | Lock open decisions, test data coverage, get accounts/keys sorted, scaffold repo, wireframe UI |
| 0–4 | Data pipeline + mock fixture (A), map rendering with one metric live (B), analysis prototyping starts (C) |
| 4–8 | Metric switcher, remaining data layers, styling (B); real data replaces mock fixture; FastAPI routes solidified (A) |
| 8–14 | AI layer: summarization, chat, comparison (A); Market Health Score finalized (C) |
| 14–18 | Anomaly detection + AI narration tying A and C together |
| 18–22 | Deploy to Vercel, test cold starts/timeouts against real AI call latency, polish, rehearse demo |
| 22–24 | Buffer — kept empty on purpose |
