# Economic Globe

An interactive world map showing per-country economic data — GDP, GDP per capita, inflation, bond yields, currency — with an AI-assisted layer on top for summarization, comparison, anomaly detection, and a country-specific chatbot. Built for [hackathon name] in 24 hours.

Inspired by Harvard's [Globe of Economic Complexity](https://globe.cid.harvard.edu/).

## Features

- **Interactive map** — countries colored by a selectable metric (GDP, inflation, bond yields, currency)
- **AI country summaries** — plain-English summary of a country's economic picture
- **Country comparison** — side-by-side AI-generated comparison of two countries
- **Anomaly detection** — statistically flagged outliers (std-dev threshold), narrated in plain English
- **Composite Market Health Score** — weighted score combining index performance, volatility, currency stability, and inflation/GDP trend
- **Rankings** — top countries by score, biggest movers, most anomalies
- **Chatbot** — ask questions about a specific country's data

## Tech stack

**Frontend:** React + Vite, react-simple-maps, Recharts, Tailwind
**Backend:** Python + FastAPI
**Data sources:** World Bank API (`wbgapi`), yfinance
**AI:** OpenRouter
**Analysis:** pandas
**Deployment:** Vercel (frontend + backend)

## Project structure

```
economic-globe/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── requirements.txt
│   ├── services/            # data fetch/normalize scripts, ai.py
│   ├── routes/               # API route handlers
│   ├── config/               # country config (ticker/currency/WB code mapping)
│   └── cache/                # pre-fetched JSON data
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── components/       # map, country panel, chat UI, charts
│   └── ...
└── hackathon_plan.md          # full overview, task split, and timeline
```

## Getting started

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # then fill in your OpenRouter key
uvicorn main:app --reload --port 8000
```
Visit http://localhost:8000/api/health — you should see `{"status": "healthy"}`.

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Visit http://localhost:5173 — you should see "Backend status: healthy" once both are running.

## Team & branches

| Branch | Owner | Scope |
|---|---|---|
| `feature/backend-data-ai` | Person A | Data pipeline, FastAPI backend, AI layer (summarize/compare/chat) |
| `feature/frontend-viz` | Person B | Map, charts, country panel, chat UI |
| `feature/analysis-layer` | Person C | Correlation, Market Health Score, anomaly detection + explanation, rankings |

Cut all three branches from `main` once this scaffold is pushed, so everyone starts from the same working base. See `hackathon_plan.md` for the full task breakdown and timeline.
