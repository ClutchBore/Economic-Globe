# Person A Roadmap — Data & Backend

<<<<<<< HEAD
**Branch:** `feature/backend-data`
**Role:** The data/backend half of the original Person A job. Person C builds AI alongside you, then moves to analysis; Person B builds the website.

## File ownership — avoid overlapping edits

You own these planned files and areas:

- `backend/main.py`: app setup and router registration.
- `backend/requirements.txt` and shared backend/deployment configuration.
- `backend/config/`: country/source/ticker mappings.
- `backend/services/world_bank.py` and `market_data.py`: fetching and normalization.
- `backend/services/data_store.py`: shared cache-reading functions.
- `backend/routes/countries.py`: country data endpoints.
- `backend/cache/countries/` and `backend/cache/mock/`: economic data and shared sample fixtures.

C owns AI and analysis services/routers and `backend/cache/ai/`. Register C's routers; leave their handlers to C. Coordinate dependency/configuration requests through you. These are proposed ownership boundaries, not existing-file claims.

## Before Hour 0

- [ ] Agree with B and C on country codes, metric names, units, observation dates, sources, null values, and history format.
- [ ] Agree on `get_country(code)` and `list_countries()` in `services/data_store.py`, including what missing countries return.
- [ ] Choose a reliable initial country/metric set; aim for 25–30 countries if coverage allows.
- [ ] Verify the existing backend scaffold and source access.
- [ ] Agree on country endpoint payloads with B and C.

## Hours 0–4: Unblock B and C

- [ ] Publish sample data in hour 0–1, including dated history and missing-value examples.
- [ ] Make the shared data-reader functions return that fixture initially, so C can build AI immediately.
- [ ] Build country mappings and World Bank/yfinance fetchers.
- [ ] Save normalized real data with units, dates, sources, and missing values.
- [ ] Begin country-list/detail endpoints; keep live refresh separate from normal reads.
- [ ] At hour 4, merge the first working real-data subset and cache-reader implementation.

## Hours 4–8: Reliable data backend

- [ ] Complete country endpoints, including history for charts and analysis.
- [ ] Replace mock reader inputs with real cached data without changing the agreed return format.
- [ ] Preserve last-known-good data on refresh failure; use bounded retries.
- [ ] Validate demo-country values, dates, and units.
- [ ] Register C's AI router in `main.py`.
- [ ] Help B connect data and C connect real country context.
- [ ] At hour 8, check summary/comparison/chat with B and C.

## Hours 8–14: Integration and early deployment

- [ ] Resolve data gaps while C starts analysis.
- [ ] Confirm adequate history for C's selected anomaly metric.
- [ ] Agree on analysis outputs with B/C and register C's analysis router when ready.
- [ ] Try backend deployment early: packaged cache, environment variables, frontend origin, and deployed requests.
- [ ] At hour 14, check ranking/anomaly endpoints with B.

## Hours 14–18: End-to-end checks

- [ ] Verify data → AI → UI and anomaly → explanation → UI.
- [ ] Check unknown countries, missing data, and unavailable historical analysis.
- [ ] Fix integration/deployment issues and freeze feature scope at hour 18.

## Hours 18–22: Deploy and rehearse

- [ ] Finalize backend deployment with B.
- [ ] Check cold starts, timeouts, and fallbacks with C.
- [ ] Freeze real demo data and rehearse the full flow.

## Hours 22–24: Buffer

- [ ] Fix demo blockers only.

**Done:** Real cached data is served reliably, C's routers are registered, and the deployed frontend can use the backend.
=======
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
>>>>>>> API-backend-branch
