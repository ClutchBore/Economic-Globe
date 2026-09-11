# Person C Roadmap — Analysis Layer

**Branch:** `feature/analysis-layer`
**Scope:** Correlation, Market Health Score, anomaly detection + explanation, rankings

---

## Before Hour 0 (Prep)

- [ ] Confirm the per-country schema with A (`{country_code, country_name, gdp, gdp_per_capita, inflation, bond_yield_10y, fx_rate, ...}`)
- [ ] Set up a notebook environment with pandas for prototyping
- [ ] Sketch the Market Health Score design on paper: what inputs (index performance, volatility, currency stability, inflation/GDP trend), what weighting

## Hours 0–4: Prototype Against Mock Data

- [ ] Get A's mock data fixture as soon as it's published
- [ ] Prototype in a notebook: correlation analysis and rolling windows across metrics
- [ ] Start sketching the Composite Market Health Score formula against mock data

## Hours 4–8: Score Design

- [ ] Finalize the Market Health Score design: weighted combo of
  - [ ] Index performance
  - [ ] Volatility
  - [ ] Currency stability
  - [ ] Inflation/GDP trend
- [ ] Package the prototype as clean, importable functions (not notebook-only) so A can wire them into FastAPI routes
- [ ] **Hour 4 sync**: share function signatures/output shape with A early, so wiring isn't a surprise later
- [ ] Switch inputs from mock fixture to A's real data once available

## Hours 8–14: Anomaly Detection + Documentation

- [ ] Implement std-dev threshold anomaly detection, per metric per country
- [ ] Finalize the Market Health Score computation against real data
- [ ] **Document the score/anomaly logic clearly**: units, thresholds, weighting rationale — needed so A can wire it in without reverse-engineering, and so it's easy to explain to judges
- [ ] **Hour 8 sync**: confirm Market Health Score + anomaly output shapes with A for route wiring

## Hours 14–18: Anomaly Narration (owned end-to-end by you)

- [ ] Reuse A's OpenRouter client module (`services/ai.py`) — do not build a separate AI client
- [ ] Write the `explain_anomaly` AI narration function yourself, on top of your own anomaly detection output
- [ ] Hand off logic to A for route registration at `POST /api/anomaly/explain` (A owns the route, you own the logic)
- [ ] Smoke-test the full detect → explain flow with real data

## Hours 18–22: Rankings + Stretch Prep

- [ ] Build rankings/leaderboard output (extends existing computation, no new libraries):
  - [ ] Top N countries by Market Health Score
  - [ ] Biggest movers
  - [ ] Most anomalies flagged
- [ ] Hand this off to B as a demo-friendly UI surface beyond the map
- [ ] **Prep historical/trend data structures**: shape rolling-window output so it's ready to back a time-slider stretch goal later, even if no one builds the slider itself
- [ ] Help debug any integration issues between your logic and A's routes / B's UI

## Hours 22–24: Buffer

- [ ] Kept empty on purpose — use to validate score/anomaly numbers look sane for the demo countries

---

## Cross-cutting reminders

- Document as you go — the score/anomaly logic needs to be explainable to judges under time pressure.
- Own `explain_anomaly` fully (detect → explain) rather than handing raw numbers to A to narrate.
- Prototype fast in a notebook, but don't let anything ship as notebook-only code — A needs importable functions.
