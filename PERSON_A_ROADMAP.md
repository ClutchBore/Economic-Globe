# Person A Roadmap — Data & Backend

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
