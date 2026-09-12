# Backend — Economic Globe API

FastAPI service that serves cached per-country economic data, AI summaries/comparisons/chat, and analysis endpoints. See the [root README](../README.md) for first-time setup.


## Main API endpoints

Run the server from `backend/`:

```bash
uvicorn main:app --reload --port 8000
```

Useful local URLs:

| Feature | Endpoint |
|---|---|
| Health | `GET /api/health` |
| Countries | `GET /api/countries`, `GET /api/countries/{code}` |
| AI summary | `POST /api/summarize/{country_code}` |
| AI comparison | `POST /api/compare` |
| Streaming chat | `POST /api/chat/{country_code}` |
| Rankings | `GET /api/rankings/{metric}` |
| Anomalies | `GET /api/anomalies/{metric}` |
| Anomaly explanation | `POST /api/anomaly/explain` |
| Market Health Score | `GET /api/market-health` |
| Correlations | `GET /api/correlations?metric_x=gdp_per_capita&metric_y=inflation` |
| Rolling trends | `GET /api/trends/{metric}?window=3` |
| Biggest movers | `GET /api/movers/{metric}?limit=5` |
| Time-slider data | `GET /api/timeline/{metric}` |

AI calls require `IFM_API_KEY` and `IFM_MODEL` in `backend/.env`. Chat intentionally sends previous turns as a transcript and omits IFM high-reasoning params so follow-up questions work without hidden provider thinking fields.

For frontend request/response examples, see [AI_HANDOFF.md](AI_HANDOFF.md).

## Running tests

```bash
cd backend
python -m unittest discover -s tests
```

This suite covers country routes, AI route contracts, streaming chat parsing, rankings, anomalies, Market Health Score, correlations, trends, movers, timeline payloads, and app route registration. Current expected result: all tests pass.

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
| Missing data | Unknown code returns 404 with a message; USA `fx_rate` is null (USD is the quote currency); for USA/DEU/SAU, `bond_yield_10y` is either null with an empty history array, or a plausible percentage with non-empty history — never inconsistent |

### When it fails

- **Import errors** — you're not in `backend/`. The packages resolve relative to it.
- **`0 countries`** — `cache/countries/` is empty. Run `python scripts/fetch_data.py`.
- **Missing keys / empty history** — the cache predates a schema change. Re-run the fetch.
- **Bond yield value/history mismatch** — a non-null value with an empty history array (or vice versa) means `services/fred.py` or the cache is inconsistent; every metric should have both or neither.

## Refreshing the cache

```bash
python scripts/fetch_data.py
```

Re-fetches all 31 countries from the World Bank (`wbgapi`), Yahoo Finance (`yfinance`, FX only), and FRED (`bond_yield_10y`), writing `cache/countries/<CODE>.json`. Takes a few minutes. Safe to re-run: a country whose fetch raises is skipped and keeps its last good file.

Requests never hit these sources — reads come from the cached JSON, so refreshing is always a deliberate step.

**Bond yields need `FRED_API_KEY`** in `backend/.env` (free, instant: https://fred.stlouisfed.org/docs/api/api_key.html). Without it, every country's `bond_yield_10y` comes back null — the fetch doesn't fail, it just has nothing to report. Coverage is `config.countries.FRED_BOND_SERIES`: confirmed for 18 OECD members, best-effort for 6 more (China, India, Indonesia, South Africa, Brazil, Russia — unverified series IDs, null out cleanly if wrong), no known free source for the remaining 7 (Singapore, Thailand, Vietnam, Argentina, Nigeria, Egypt, Saudi Arabia).

## Data spot-checks

Not scripted. The useful manual check is implied population — `gdp / gdp_per_capita` should land within a few percent of a country's real population. It catches unit and scaling errors that range checks miss. Last run: all 14 sampled countries within 3.3%.
