# Economic Globe — Hackathon Plan

## Goal and priorities

An interactive country map with economic data, AI summaries, comparison, and country chat, inspired by Harvard's Globe of Economic Complexity. This three-person plan splits the original Person A workload between A (data/backend) and C (AI), with C moving to analysis afterward.

1. Real cached country data and a working map.
2. Country summaries, two-country comparisons, and streaming chat.
3. Basic metric rankings and anomaly detection with explanations.
4. Stretch: custom Market Health Score, correlations, rolling trends, biggest movers, and time slider.

## Team and branches

| Person | Branch | Responsibility | Checklist |
|---|---|---|---|
| A | `feature/backend-data-ai` (suggested existing name) | Data, cache, country routes, backend integration/deployment | [A roadmap](PERSON_A_ROADMAP.md) |
| B | `feature/frontend-viz` (suggested) | Website, map, charts, frontend deployment | [B roadmap](PERSON_B_ROADMAP.md) |
| C — Shrav | `shrav-branch` | AI client, summaries/comparison/chat first; basic analysis afterward | [C roadmap](PERSON_C_ROADMAP.md) |

A's branch name does not assign AI ownership: C owns AI. Keep actual team branches where already established. Start from a shared base and merge small working pieces at hours 4, 8, and 14.

## File ownership

- A: app entry point, shared backend dependencies/configuration, country mappings, data fetchers, `services/data_store.py`, country routes, and economic/mock cache folders.
- B: `frontend/` and frontend deployment configuration.
- C: `services/ai.py`, `routes/ai.py`, `services/analysis.py`, `routes/analysis.py`, and `backend/cache/ai/`.
- A registers C's routers in `backend/main.py`; C writes and maintains their handlers. Shared dependency/root configuration requests go through A.

These are planned paths. Separate ownership lets A and C work concurrently without editing the same backend files.

## Stack and prep decisions

- Frontend: React + Vite, Tailwind, react-simple-maps, Recharts. B settles map versus globe before starting; the scaffold uses a 2D map library.
- Backend: Python + FastAPI; pandas for analysis.
- Data: World Bank via wbgapi and yfinance, saved as JSON. Verify actual coverage; IMF is optional.
- AI: OpenRouter; C selects the model, manages the backend key, and monitors the budget.
- Deployment target: Vercel frontend/backend. A/B verify the deployment setup early.
- Aim for 25–30 countries, starting with a reliable subset and agreed demo countries.

## Shared contract — agree in hour 0–1

A publishes a labeled sample dataset and reader functions so B/C can begin without live sources.

- Agree on `get_country(code)` and `list_countries()`, return shapes, and unknown-country behavior.
- Include country codes/names, metric values, units, sources, observation dates, and nulls for missing data.
- Include dated history per metric with frequency and units. Current values alone cannot support historical charts/anomalies.
- Keep annual macro data separate from daily market series; define FX quote direction and comparable periods.
- B/C agree on AI request/response payloads, streamed chat events, and errors.
- Share ranking/anomaly output examples before implementation: metric, dates, ordering, values, baseline window, threshold, and data-availability status.

## Planned endpoint ownership

| Endpoint | Handler owner |
|---|---|
| GET /api/health | A |
| GET /api/countries | A |
| GET /api/countries/{country_code} | A |
| POST /api/summarize/{country_code} | C |
| POST /api/compare | C |
| POST /api/chat/{country_code} | C |
| GET /api/rankings | C |
| GET /api/anomalies/{country_code} | C |
| POST /api/anomaly/explain | C |

These are target interfaces; agree payloads before implementation. A registers all routers. B can compare numeric values from country responses; the comparison POST supplies AI narration.

## Timeline

| Hours | A | B | C |
|---|---|---|---|
| Prep | Verify sources/scaffold | Settle map and sketch screens | Model, key, AI interfaces |
| 0–4 | Sample data in hour 0–1; first real cache | Map and basic country panel | AI client and summaries; start comparison |
| 4–8 | Complete data routes; register AI router | Real data and core AI UI | Finish comparison/chat and summary fallback |
| 8–14 | Data fixes, analysis integration, early deployment | Core UI/charts; prepare insight panels | After AI checkpoint, basic rankings/anomalies |
| 14–18 | Full integration | Connect insights; try deployment | Anomaly explanations and validation |
| 18–22 | Deploy and check reliability | Deploy, polish, rehearse | Deployed AI/analysis checks |
| 22–24 | Buffer | Buffer | Buffer |

At hour 8, C transitions only when summary/comparison/streaming chat work through B's UI with real data and clear failure behavior. C does not wait for all of A's backend work and still owns AI fixes.

C shares sample analysis outputs early and delivers basic working outputs by hour 14. If AI slips, prioritize rankings and reduce anomaly scope. Full analysis is not assumed to be quick. Freeze features at hour 18 and omit stretch goals first.

## Reliability and demo

Serve country data from cache, preserving the last successful dataset if refresh fails. Use AI timeouts, clear errors, cached summaries, and template anomaly explanations. Identify mock data and fallback responses honestly.

Check values/dates, missing data, streaming, and calculation edge cases. Rehearse map → country → summary → compare → chat → available insights on the deployed site. Reserve the last two hours for blockers.
