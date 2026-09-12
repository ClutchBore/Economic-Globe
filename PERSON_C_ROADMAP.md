# Person C Roadmap — AI First, Then Analysis

**Person:** Shrav
**Branch:** `shrav-branch` — keep using this branch.
**Scope:** Build the OpenRouter connection, country summaries, comparisons, and chat first. Then build basic rankings and anomaly detection/explanations.
**Team:** A collects/serves data; B builds the website; you own AI and later analysis.

## Your files — avoid overlapping edits

- `backend/services/ai.py`: reusable OpenRouter client and summary/comparison/chat functions.
- `backend/routes/ai.py`: AI endpoint handlers.
- `backend/services/analysis.py`: later ranking/anomaly calculations and explanations.
- `backend/routes/analysis.py`: later analysis endpoint handlers.
- `backend/cache/ai/`: saved summaries and AI fallbacks.

A owns the app entry point, data fetchers, shared reader, economic cache, and shared backend dependencies/configuration. Give A your routers to register in `backend/main.py`; send dependency/configuration requests to A. These are planned files, not claims they already exist.

## Start here: Your first milestone

Generate one country summary grounded in supplied sample data.

- [ ] Ask A for an example of the country data returned by `get_country(code)`, including values, units, dates, and missing-data behavior.
- [ ] Agree with B on summary/comparison response shapes and streamed chat events/errors.
- [ ] Set up the backend Python environment and dependencies.
- [ ] Select an OpenRouter model and budget. Store the key in an ignored backend environment file, never frontend code or Git.
- [ ] Start the AI module while A prepares the shared sample fixture.

## Hours 0–4: AI foundation

- [ ] Use A's sample-backed reader; do not wait for real fetchers.
- [ ] Build one reusable OpenRouter client with timeouts, bounded output, and error handling.
- [ ] Implement `summarize_country`; pass supplied values, units, and dates into the prompt.
- [ ] Require acknowledgment of missing information and avoid invented numbers or causes.
- [ ] Begin `compare_countries`.
- [ ] Build the summary handler in your AI router and give A the router to register.
- [ ] Share example responses with B early; target a working summary endpoint at hour 4.

## Hours 4–8: Comparison and streaming chat

- [ ] Complete `POST /api/summarize/{country_code}`.
- [ ] Complete `POST /api/compare` for two countries.
- [ ] Complete `POST /api/chat/{country_code}` with streaming in B's agreed format.
- [ ] Use A's real cache through the same reader interface.
- [ ] Generate cached summaries for demo countries in your AI cache folder.
- [ ] Check the UI with B, including missing information, AI failures, and timeouts.
- [ ] Monitor spending and identify fallback responses clearly.

## Transition checkpoint — target hour 8

Move to analysis when summaries, comparisons, and streaming chat work through B's UI using real data, and failures/fallbacks behave clearly. Do not wait for A to finish the whole backend. You still own AI fixes after switching.

If AI takes longer, finish core AI first and reduce analysis scope. The original full analysis layer is not assumed to be quick.

## Hours 8–14: Basic rankings and anomalies

- [ ] Build rankings by available metrics first, with clear ordering, units, and dates. Higher does not always mean better.
- [ ] Share sample ranking/anomaly outputs immediately so A/B can prepare integration.
- [ ] Choose one metric with sufficient comparable dated history.
- [ ] Implement a simple standard-deviation anomaly rule comparing the latest observation with prior observations.
- [ ] Document the window, minimum history, and threshold; handle nulls, insufficient history, and zero variation explicitly.
- [ ] Keep annual and daily series separate.
- [ ] Check ordinary values, an obvious outlier, insufficient data, constant data, and real demo-country results.
- [ ] Package calculations as importable functions and expose ranking/anomaly retrieval in your analysis router.
- [ ] Deliver working outputs by hour 14. If delayed, prioritize rankings and agree on reduced anomaly scope.

## Hours 14–18: Anomaly explanations

- [ ] Build `POST /api/anomaly/explain` using your existing OpenRouter client and calculated anomaly results.
- [ ] Explain the observed deviation and rule without asserting unsupported real-world causes.
- [ ] Provide a template explanation if AI fails.
- [ ] Give A the analysis router to register and verify detect → explain → API → B's panel.
- [ ] Document rules and limitations for judges; freeze features at hour 18.

## Hours 18–22: Validate and rehearse

- [ ] Check deployed AI/analysis behavior with A/B.
- [ ] Validate displayed numbers and AI spending.
- [ ] Freeze saved summaries alongside A's final dataset.
- [ ] Help rehearse the full demo.

## Hours 22–24: Buffer

- [ ] Fix blockers only.

## Stretch goals

Custom Market Health Score, correlations, rolling trends, biggest movers, and time-slider preparation are optional. Add them only after the core demo works and if A/B can integrate them before hour 18. Document and validate score weights and use comparable periods for movers.

**Done:** Core AI works reliably, followed by basic rankings and anomalies where sufficient history exists.
