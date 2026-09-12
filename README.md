# Terraconomy

An interactive 3D globe of real-world economic data for 217 countries — 14 indicators per
country, each with historical trends — with an AI layer on top for summaries, comparisons,
a country-specific chatbot, and a full analytics suite. Built for a 24-hour hackathon.

Inspired by Harvard's [Globe of Economic Complexity](https://globe.cid.harvard.edu/).

**Live:** https://economic-globe-2cit-ten.vercel.app · **Data sources:** [provenance.html](frontend/public/provenance.html)

## Features

- **Interactive 3D globe** — countries colored by any of 14 selectable metrics: GDP, GDP per
  capita (nominal and PPP), GDP growth, inflation, unemployment, population, life expectancy,
  government debt, exports, urbanization, internet usage, CO2 per capita, 10-year bond yields,
  and FX rates
- **Country search** and a dedicated panel per country with every indicator, a historical chart,
  and inline anomaly flags
- **AI country summaries** — plain-English summary grounded strictly in the supplied data (never
  invents figures, causes, or forecasts)
- **Country comparison** — pick any two countries for a full metric-by-metric table plus an
  AI-generated narrative that explicitly flags mismatched years/units instead of hiding them
- **Streaming chatbot** — ask questions about a specific country's data, answered over
  server-sent events with real multi-turn memory
- **Composite Market Health Score** — transparent 0-100 weighted score (GDP per capita, GDP
  growth, inflation stability, FX stability, bond yield), with missing components excluded and
  weights re-normalized rather than penalizing gaps
- **Anomaly detection** — statistically flagged outliers (z-score threshold), narrated as a
  statistical flag, not a claimed cause
- **Analytics suite** — Rankings, Biggest Movers (latest change or 3-year trend), Correlations
  (scatter plots between any two metrics), and multi-country Timeline charts back to 2016
- **Data provenance page** — publisher, coverage, and freshness for every one of the 15 raw
  measures, plus honest caveats about what isn't comparable across countries

## Tech stack

**Frontend:** React + Vite, [react-globe.gl](https://github.com/vasturiano/react-globe.gl)
(three.js) for the 3D globe, Recharts for charting, Tailwind for styling
**Backend:** Python + FastAPI
**Data sources:** World Bank (`wbgapi`, 13 of 15 measures), Yahoo Finance (live FX for widely-traded
currencies), FRED/OECD (10-year bond yields)
**Storage:** Upstash Redis over its REST API — chosen because serverless functions freeze between
invocations and silently drop pooled TCP connections
**Data refresh:** scheduled GitHub Actions workflow (`.github/workflows/refresh-data.yml`), daily,
re-fetches all 217 countries and writes straight to Redis
**AI:** IFM, streamed via SSE for chat; grounded prompts that treat supplied JSON as untrusted data,
never as instructions
**Deployment:** one Vercel multi-service project — frontend at `/`, backend at `/api`, same domain,
no CORS

## API highlights

Backend base URL during local development: `http://localhost:8000`.

| Feature | Endpoint |
|---|---|
| Country list/detail | `GET /api/countries`, `GET /api/countries/{code}` |
| AI summary | `POST /api/summarize/{country_code}` |
| AI comparison | `POST /api/compare` |
| Streaming country chat | `POST /api/chat/{country_code}` |
| Rankings | `GET /api/rankings/{metric}` |
| Anomalies | `GET /api/anomalies/{metric}` |
| Anomaly explanation | `POST /api/anomaly/explain` |
| Market Health Score | `GET /api/market-health` |
| Correlations | `GET /api/correlations?metric_x=gdp_per_capita&metric_y=inflation` |
| Rolling trends | `GET /api/trends/{metric}?window=3` |
| Biggest movers | `GET /api/movers/{metric}?limit=5` |
| Time-slider data | `GET /api/timeline/{metric}` |

Supported analysis metrics: `gdp`, `gdp_per_capita`, `gdp_per_capita_ppp`, `gdp_growth`,
`inflation`, `unemployment`, `population`, `life_expectancy`, `govt_debt_pct_gdp`,
`exports_pct_gdp`, `urban_population_pct`, `internet_users_pct`, `co2_per_capita`,
`bond_yield_10y`, `fx_rate`. See [backend/AI_HANDOFF.md](backend/AI_HANDOFF.md) for response
shapes and integration notes.

## Project structure

```
terraconomy/
├── vercel.json               # multi-service deploy config (frontend "/" + backend "/api")
├── backend/
│   ├── main.py                # FastAPI app entry point
│   ├── requirements.txt
│   ├── services/               # data fetch/normalize, ai.py, kv_client.py, analysis.py
│   ├── routes/                 # API route handlers
│   ├── config/                 # country config (ticker/currency/World Bank code mapping)
│   ├── scripts/fetch_data.py   # re-fetches all countries and writes to Redis
│   └── cache/mock/              # fallback fixture data, tracked in git
└── frontend/
    ├── public/provenance.html  # data sources & caveats page
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── data/                # API client, country context, metric definitions
        └── components/          # globe, country/comparison panels, charts, rankings UI
```

## Getting started

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```
Fill in `.env`:
- `IFM_API_KEY` / `IFM_MODEL` — AI provider
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` — from an Upstash Redis database's REST API section
  (country data lives here, not in local files)
- `FRED_API_KEY` — optional; without it, every country's `bond_yield_10y` is `null`

Seed Redis, then run the server:
```bash
python -m scripts.fetch_data
uvicorn main:app --reload --port 8000
```
Visit http://localhost:8000/api/health — you should see `{"status": "healthy"}`.

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Visit http://localhost:5173.

## Verification

Backend smoke test (checks every country against the required field set):

```bash
cd backend
python scripts/smoke_test.py
```

Frontend build:

```bash
cd frontend
npm run build
```

## Deployment

One Vercel project defines both services in the root [vercel.json](vercel.json): the frontend
builds from `frontend/`, the backend from `backend/` with entrypoint `main:app`, and a top-level
rewrite routes `/api/*` to the backend while everything else goes to the frontend — so the whole
app serves from a single domain with no CORS configuration needed. Environment variables
(`IFM_API_KEY`, `IFM_MODEL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `FRED_API_KEY`) are set once
in the Vercel project settings, separate from local `.env` and from the GitHub Actions secrets
used by the daily data-refresh workflow.
