# Economic Globe

An interactive world map showing per-country economic data — GDP, GDP per capita, inflation, bond yields, currency — with an AI-assisted layer on top for summarization, comparison, anomaly detection, and a country-specific chatbot. Built for [hackathon name] in 24 hours.

Inspired by Harvard's [Globe of Economic Complexity](https://globe.cid.harvard.edu/).

## Planned features

- **Interactive map** — countries colored by a selectable metric (GDP, inflation, bond yields, currency)
- **AI country summaries** — plain-English summary of a country's economic picture
- **Country comparison** — side-by-side AI-generated comparison of two countries
- **Anomaly detection** — statistically flagged outliers (std-dev threshold), narrated in plain English
- **Rankings** — countries ordered by available metrics, with clear units and dates
- **Chatbot** — ask questions about a specific country's data

Build the map/data and core AI first, then basic rankings and anomalies. The custom Market Health Score, correlations, rolling trends, biggest movers, and time slider are stretch goals.

## Tech stack

**Frontend:** React + Vite, react-simple-maps, Recharts, Tailwind
**Backend:** Python + FastAPI
**Data sources:** World Bank API (`wbgapi`), yfinance
**AI:** IFM
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
cp .env.example .env          # then fill in your IFM key
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
| `feature/backend-data-ai` (suggested existing name) | Person A | Data pipeline, cache, country routes, backend integration/deployment |
| `feature/frontend-viz` | Person B | Map, charts, country panel, chat UI |
| `shrav-branch` | Person C — Shrav | AI connection, summaries/comparison/chat first; basic analysis afterward |

Use a shared starting base and keep established team branches. A and C split the original backend/data/AI workload from the start; B builds the frontend throughout. C moves to analysis when core AI works through the UI with real data, targeting hour 8. C does not wait for A to finish all backend work.

A owns shared backend configuration and registers C's routers; C owns their AI/analysis handlers. See [the shared plan](hackathon_plan.md) and roadmaps for [A](PERSON_A_ROADMAP.md), [B](PERSON_B_ROADMAP.md), and [C — Shrav](PERSON_C_ROADMAP.md) for file ownership and handoffs. Merge at hours 4, 8, and 14; reserve hours 22–24 for fixes.
