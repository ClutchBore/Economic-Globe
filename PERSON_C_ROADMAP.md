# Person C Roadmap — AI First, Then Analysis

**Branch:** `feature/backend-ai-analysis`
**Role:** The AI half of the original Person A job initially. Once core AI works, move to basic analysis. This is a three-person plan: A handles data/backend, B handles frontend, and you handle AI then analysis.

## File ownership — avoid overlapping edits

You own these planned files and areas:

- `backend/services/ai.py`: reusable OpenRouter client and summary/comparison/chat functions.
- `backend/routes/ai.py`: AI endpoint handlers.
- `backend/services/analysis.py`: ranking/anomaly calculations and explanation logic.
- `backend/routes/analysis.py`: analysis endpoint handlers.
- `backend/cache/ai/`: saved AI summaries and related fallbacks.

A owns `main.py`, shared dependencies/configuration, data fetchers, the data reader, and economic cache files. Give A routers to register and dependency requests; avoid editing those shared files yourself.

## Before Hour 0

- [ ] Agree with A on `get_country(code)` and `list_countries()`, return shapes, history, and missing-data behavior.
- [ ] Agree with B on summary/comparison/chat payloads, streaming events, and errors.
- [ ] Choose an OpenRouter model and spending budget; configure the key only on the backend.
- [ ] Begin AI module stubs while A prepares sample data.

## Hours 0–4: AI foundation

- [ ] Use A's sample-backed reader; do not wait for real data fetchers.
- [ ] Build one OpenRouter client with timeouts, bounded output, and error handling.
- [ ] Implement country summaries and start two-country comparisons.
- [ ] Supply actual values, dates, and units to prompts; require acknowledgment of missing data and avoid invented numbers.
- [ ] Implement handlers in your AI router and hand it to A for registration.
- [ ] Give B sample responses early; target a working summary endpoint by hour 4.

## Hours 4–8: Finish core AI

- [ ] Complete `POST /api/summarize/{country_code}`, `POST /api/compare`, and `POST /api/chat/{country_code}`.
- [ ] Support streaming chat using the format agreed with B.
- [ ] Use A's real cache through the same reader interface.
- [ ] Pre-generate demo-country summaries in your own AI cache folder.
- [ ] Check the frontend flow with B, including missing information, timeouts, and AI failures.
- [ ] Monitor usage against the budget.

## Transition checkpoint — target hour 8

Move to analysis when summary, comparison, and streaming chat work through B's UI with real data, and failures/fallbacks behave clearly. Do not wait for A to finish the entire backend. Keep ownership of AI bug fixes after switching.

If core AI takes longer, complete it first and reduce analysis scope. Do not assume the full original analysis layer is quick.

## Hours 8–14: Basic analysis

- [ ] Build rankings by existing metrics first, with clear ordering, units, and dates.
- [ ] Share example ranking/anomaly outputs immediately so B can prepare panels and A can plan integration.
- [ ] Choose one metric with sufficient comparable dated history.
- [ ] Implement a simple standard-deviation anomaly rule against prior observations.
- [ ] Document the baseline window, minimum history, threshold, and handling of missing values or zero variation. Keep annual and daily data separate.
- [ ] Check ordinary values, an obvious outlier, insufficient history, a constant series, and real demo-country results.
- [ ] Package functions as importable code and expose them through your analysis router.
- [ ] Deliver working rankings and anomaly outputs by hour 14. If delayed, deliver rankings first and agree on reduced anomaly scope.

## Hours 14–18: Explanations and integration

- [ ] Implement `POST /api/anomaly/explain` using your existing AI client.
- [ ] Explain the calculated deviation and rule without inventing a real-world cause.
- [ ] Provide a template explanation if the AI call fails.
- [ ] Give A the analysis router to register, including rankings and anomaly retrieval.
- [ ] Verify detect → explain → backend → B's panel.
- [ ] Document calculation rules and limitations for judges; freeze features at hour 18.

## Hours 18–22: Validate and rehearse

- [ ] Check AI/analysis behavior on the deployed app with A/B.
- [ ] Validate displayed numbers and spending.
- [ ] Freeze cached summaries alongside A's final demo dataset.
- [ ] Help rehearse the demo.

## Hours 22–24: Buffer

- [ ] Fix blockers only.

## Stretch goals

The original Market Health Score, correlations, rolling trends, biggest movers, and time-slider preparation remain optional. Add them only after the core demo works and if A/B can integrate them before hour 18. Document and validate score weights; use comparable historical periods for movers.

**Done:** Core AI is reliable, followed by metric rankings and basic anomalies where the history supports them.
