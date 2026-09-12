# Backend — Economic Globe API

FastAPI service that serves cached per-country economic data. See the [root README](../README.md) for first-time setup.

## Running the smoke test

Checks that the app imports, both country endpoints work, and the cache is well-formed. Run it after any change to the fetchers, the data store, or the cache.

```bash
cd backend
source venv/bin/activate      # Windows: venv\Scripts\activate
python scripts/smoke_test.py
```

Exits `0` if everything passes, `1` on the first failure, so it can go straight into CI.

Expected output ends with:

```
14 passed, 0 failed
Smoke test OK
```

It does not need a running server — it drives the app in-process through FastAPI's `TestClient`, so there's no need to start `uvicorn` first.

### What it checks

| Group | Checks |
|---|---|
| API contract | `/api/health` and `/` respond; `/api/countries` returns a non-empty list; every entry has `country_code`, `country_name`, `region` |
| Country detail | `/api/countries/DEU` returns 200 with all 15 required keys; `history`, `units`, `sources` and `dates` cover all five metrics; GDP history is non-empty and dated; lowercase codes resolve |
| Missing data | Unknown code returns 404 with a message; USA `fx_rate` is null (USD is the quote currency); USA `bond_yield_10y` is a plausible percentage; non-US bond yields are null with an empty history array |

### When it fails

- **Import errors** — you're not in `backend/`. The packages resolve relative to it.
- **`0 countries`** — `cache/countries/` is empty. Run `python scripts/fetch_data.py`.
- **Missing keys / empty history** — the cache predates a schema change. Re-run the fetch.
- **Bond yield out of range** — the `^TNX` scaling is wrong again. Yahoo has changed this convention before; it currently returns a plain percentage (`4.975` = 4.975%), so `services/market_data.py` must not rescale it.

## Refreshing the cache

```bash
python scripts/fetch_data.py
```

Re-fetches all 31 countries from the World Bank (`wbgapi`) and Yahoo Finance (`yfinance`), writing `cache/countries/<CODE>.json`. Takes a few minutes. Safe to re-run: a country whose fetch raises is skipped and keeps its last good file.

Requests never hit these sources — reads come from the cached JSON, so refreshing is always a deliberate step.

## Data spot-checks

Not scripted. The useful manual check is implied population — `gdp / gdp_per_capita` should land within a few percent of a country's real population. It catches unit and scaling errors that range checks miss. Last run: all 14 sampled countries within 3.3%.
