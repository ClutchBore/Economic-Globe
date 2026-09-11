# Person A Roadmap — Backend, Data Pipeline & AI Layer

**Branch:** `feature/backend-data-ai`
**Scope:** Data pipeline, FastAPI backend, AI layer (summarize/compare/chat)

---

## Before Hour 0 (Prep)

- [ ] Confirm open decisions with the team:
  - [ ] Globe vs. 2D map (affects what shape of data B needs, if any)
  - [ ] Is IMF DataMapper in or out of scope for the data pipeline?
  - [ ] Which OpenRouter model to use (small/fast, cost-conscious)
- [ ] Create OpenRouter account, get API key, set a `max_price` cap / usage alert
- [ ] Get World Bank (`wbgapi`) and yfinance working locally in a scratch script
- [ ] Agree on the **per-country schema** with B and C:
  `{country_code, country_name, gdp, gdp_per_capita, inflation, bond_yield_10y, fx_rate, ...}`
- [ ] Draft the **country config file** shape: `country_code → ticker suffix → index/ETF ticker → currency → World Bank code`, capped at ~25–30 countries

## Hours 0–4: Skeleton + Mock Fixture

- [ ] Set up FastAPI app skeleton (`backend/main.py`), confirm `/api/health` returns `{"status": "healthy"}`
- [ ] Create `backend/config/` with the country config file (25–30 countries)
- [ ] Write a small hand-written **mock data fixture** JSON matching the shared schema and publish it immediately — this unblocks B and C
- [ ] Start fetch/normalize scripts:
  - [ ] `services/` — World Bank fetch (`wbgapi`)
  - [ ] `services/` — yfinance fetch (rate-limited, cached, retry/backoff)
  - [ ] IMF fetch, if kept in scope
- [ ] Set up the shared per-country JSON cache location (`backend/cache/`)

## Hours 4–8: Real Data + Routes

- [ ] Finish fetch/normalize scripts, populate the real cache from live sources
- [ ] Implement cache-first read pattern: reads hit cache; live yfinance call only as optional refresh, with fallback to last-known-good data
- [ ] Build data-serving routes:
  - [ ] By country
  - [ ] By metric
  - [ ] By comparison pair
- [ ] **Hour 4 sync**: confirm schema hasn't drifted, hand off real routes so B can swap off the mock fixture
- [ ] Swap the mock fixture for real cached data once validated

## Hours 8–14: AI Layer

- [ ] Build `services/ai.py` as a reusable OpenRouter client/module (so C can reuse it for anomaly narration instead of duplicating)
- [ ] Implement `summarize_country`
- [ ] Implement `compare_countries`
- [ ] Implement `chat_about_country` (streaming-friendly, since B's chat UI expects streaming)
- [ ] Wire routes:
  - [ ] `POST /api/summarize/{country_code}`
  - [ ] `POST /api/compare`
  - [ ] `POST /api/chat/{country_code}`
- [ ] Pre-generate and cache country summaries ahead of the demo (fallback if live AI calls are slow/rate-limited)
- [ ] **Hour 8 sync**: confirm AI route contracts with B, confirm Market Health Score / anomaly output shape with C

## Hours 14–18: Integrate C's Analysis Layer

- [ ] Wire in Person C's Market Health Score, anomaly, and rankings outputs
- [ ] Register route `POST /api/anomaly/explain` (logic owned by C, route lives here)
- [ ] Confirm C's `explain_anomaly` reuses your OpenRouter client module rather than a separate implementation
- [ ] Smoke-test the full detect → explain → serve flow end-to-end with B's UI

## Hours 18–22: Deploy & Harden

- [ ] Deploy backend to Vercel (Services, same project as frontend)
- [ ] Test cold starts and timeouts against real AI call latency
- [ ] Confirm cache-first fallback behaves correctly under rate limits / API failures
- [ ] Double-check OpenRouter usage/cost is within budget
- [ ] Fix any last integration bugs surfaced by B or C

## Hours 22–24: Buffer

- [ ] Kept empty on purpose — use only if something upstream slipped

---

## Cross-cutting reminders

- Never let a live external API call sit in the critical demo path — cache-first, always.
- Publish the mock fixture **early** (hour 0–1 ideally) — B and C are blocked without it.
- Keep `services/ai.py` generic enough that C's anomaly narration is a thin wrapper, not a fork.
