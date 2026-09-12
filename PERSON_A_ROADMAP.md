# Person A Roadmap — Data & Backend

**Branch:** `feature/backend-data-ai` (existing suggested name; AI ownership is now C's)
**Scope:** Collect and serve country data, integrate backend modules, and deploy the backend.
**Team:** A handles data/backend; B handles frontend; C (Shrav) builds AI first, then analysis.

## File ownership

A owns `backend/main.py`, `backend/requirements.txt`, shared backend configuration, `backend/config/`, data fetchers, `backend/services/data_store.py`, `backend/routes/countries.py`, and economic datasets in `backend/cache/countries/` and `backend/cache/mock/`.

C owns AI/analysis services and route modules plus `backend/cache/ai/`. A registers C's routers in the app. Route registration means connecting C's completed module, not writing its handlers. Shared dependency or configuration changes go through A. These paths define planned ownership.

## Prep and hour 0–1: Agree on interfaces

- [ ] Verify the existing FastAPI scaffold.
- [ ] Agree with B/C on country codes, metric names, units, dates, sources, missing values, and historical series.
- [ ] Agree on `get_country(code)` and `list_countries()` return shapes and unknown-country behavior.
- [ ] Publish a small labeled mock fixture with dated history and null examples.
- [ ] Make the reader return sample data initially so C can begin AI immediately.
- [ ] Choose an initial reliable country set; aim for 25–30 if coverage allows.

## Hours 1–4: First real data

- [ ] Create country mappings for source codes, currencies, market tickers, and FX quote direction.
- [ ] Build World Bank and yfinance fetch/normalize scripts.
- [ ] Save real values with dates, sources, units, and explicit missing values.
- [ ] Begin country-list/detail endpoints.
- [ ] At hour 4, share the first real-data subset and coverage gaps with B/C.

## Hours 4–8: Data routes and AI integration

- [ ] Complete country endpoints, including history for charts and later analysis.
- [ ] Switch the shared reader to real cached data without changing its interface.
- [ ] Keep live refresh separate; use bounded retries and preserve last-known-good data.
- [ ] Validate demo-country values, units, and dates.
- [ ] Register C's AI router and help B/C verify real data through the UI.
- [ ] At hour 8, check summary, comparison, and streaming chat with B/C.

## Hours 8–14: Analysis integration and deployment preparation

- [ ] Resolve data gaps while C moves to basic analysis.
- [ ] Confirm sufficient comparable history for C's selected anomaly metric.
- [ ] Agree on ranking/anomaly outputs with B/C; register C's analysis router when ready.
- [ ] Try backend deployment early, including cache packaging, environment variables, and allowed frontend origin.
- [ ] At hour 14, check analysis endpoints with B/C.

## Hours 14–18: Full integration

- [ ] Verify country → data → AI → UI and anomaly → explanation → UI.
- [ ] Check missing countries, missing values, and unavailable historical analysis.
- [ ] Fix backend/deployment issues and freeze features at hour 18.

## Hours 18–22: Deploy and rehearse

- [ ] Finalize deployment alongside B's frontend.
- [ ] Check deployed timeouts, cold starts, and fallbacks with C.
- [ ] Freeze the demo dataset and rehearse.

## Hours 22–24: Buffer

- [ ] Fix blockers only.

**Done:** The deployed app serves reliable cached data and connects C's AI/analysis modules to B's UI.
