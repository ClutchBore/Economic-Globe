# Person C Roadmap — AI First, Then Analysis

**Person:** Shrav
**Branch:** `shrav-branch` — keep using this branch.
**Role:** The AI half of the original Person A job initially. Once core AI works, move to basic analysis. This is a three-person plan: A handles data/backend, B handles frontend, and you handle AI then analysis.
**Scope:** Build the IFM connection, country summaries, comparisons, and chat first. Then build basic rankings and anomaly detection/explanations.
**Team:** A collects/serves data; B builds the website; you own AI and later analysis.

## File ownership — avoid overlapping edits

You own these planned files and areas:

- `backend/services/ai.py`: reusable IFM client and summary/comparison/chat functions.
- `backend/routes/ai.py`: AI endpoint handlers.
- `backend/services/analysis.py`: ranking/anomaly calculations and explanation logic.
- `backend/routes/analysis.py`: analysis endpoint handlers.
- `backend/cache/ai/`: saved AI summaries and related fallbacks.

A owns `main.py`, shared dependencies/configuration, data fetchers, the data reader, and economic cache files. Give A your routers to register and dependency requests; avoid editing those shared files yourself.

## Progress note

Summary, comparison, and streaming chat are implemented, connected to A's cached country reader, and verified by offline tests. The AI router is registered locally in `backend/main.py` on this branch. Live IFM summary, comparison, and streaming chat requests succeeded using `IFM/K2-Horizon-375B-A23B`, including cache-backed summary, comparison, and chat requests. Summary fallback caching is implemented with saved demo summaries. Basic metric rankings, standard-deviation anomaly detection, and anomaly explanations are implemented through `/api/rankings/{metric}`, `/api/anomalies/{metric}`, and `/api/anomaly/explain`. Chat now receives dashboard context with rankings, anomaly flags, and suggested questions. A/B contract confirmation and frontend validation remain pending. See [AI_HANDOFF.md](backend/AI_HANDOFF.md) for provisional contracts and examples.

## Before Hour 0

- [ ] Agree with A on `get_country(code)` and `list_countries()`, return shapes, history, and missing-data behavior.
- [x] Document summary/comparison/chat payloads, streaming events, and errors for B in `backend/AI_HANDOFF.md`.
- [x] Choose an IFM model and spending budget; store the key in an ignored backend environment file, never frontend code or Git.
- [x] Begin AI module stubs while A prepares sample data.

## Start here: Your first milestone

Generate one country summary grounded in supplied sample data.

- [ ] Ask A for an example of the country data returned by `get_country(code)`, including values, units, dates, and missing-data behavior.
- [x] Document B's summary/comparison response shapes and streamed chat events/errors.
- [x] Set up the backend Python environment and dependencies.
- [x] Select an IFM model and budget. Store the key in an ignored backend environment file, never frontend code or Git.
- [x] Create AI service and route modules.
- [x] Create clearly labeled fictional country fixtures to work independently of A's data.

## Hours 0–4: AI foundation

- [x] Use A's sample-backed reader; do not wait for real fetchers.
- [x] Build one reusable IFM client with timeouts, bounded output, and error handling.
- [x] Implement `summarize_country`; pass supplied values, units, and dates into the prompt.
- [x] Add prompt instructions to acknowledge missing information and avoid invented numbers or causes; live-model compliance still needs verification.
- [x] Implement `compare_countries` using the shared IFM client.
- [x] Build the summary handler in the AI router.
- [x] Prepare router registration instructions for A in `backend/AI_HANDOFF.md`.
- [x] Register the AI router in `backend/main.py` on this branch for local integration testing.
- [x] Verify the registered AI routes through the real FastAPI app with offline tests.
- [ ] Confirm with A that this `backend/main.py` registration is okay to keep.
- [x] Prepare hand-written summary/comparison response examples and streaming event documentation for B.
- [x] Add quick-copy summary, comparison, and chat integration instructions for B.
- [x] Share the AI handoff with B.
- [ ] Confirm with B that the provisional API contracts work in the frontend.

## Hours 4–8: Finish core AI

- [x] Implement and offline-test `POST /api/summarize/{country_code}`.
- [x] Implement and offline-test `POST /api/compare` for two countries.
- [x] Implement `POST /api/chat/{country_code}` with provisional streaming events; tested offline.
- [x] Support bounded user/assistant conversation history and reject invalid chat inputs.
- [x] Handle streaming completion, provider errors, malformed/truncated streams, and upstream cleanup.
- [x] Pass offline tests covering summaries, comparisons, streaming chat, cached country lookup, summary fallbacks, and main app registration without paid requests.
- [x] Test one live summary sample after configuring the IFM key/model.
- [x] Test live comparisons and chat after configuring the IFM key/model.
- [x] Test cache-backed live summary and comparison routes using country codes.
- [x] Test cache-backed live chat route using a country code, message, and history only.
- [x] Improve chat with dashboard context, rankings/anomaly awareness, safer answer rules, and suggested questions for B.
- [x] Remove IFM high-reasoning chat params so multi-turn history works without hidden thinking fields.
- [x] Send chat history to IFM as a transcript instead of assistant-role messages to avoid multi-turn provider rejection.
- [x] Send completed chat history from the frontend so follow-up questions remember previous turns.
- [ ] Confirm the streaming format with B and verify it in the frontend.
- [x] Use A's real cache through the same reader interface.
- [x] Implement cached summary fallback in your AI cache folder.
- [x] Generate cached summaries for demo countries in your AI cache folder.
- [ ] Check the UI with B, including missing information, AI failures, and timeouts.
- [x] Document cached-summary fallback responses clearly for B.
- [ ] Monitor IFM spending during live testing and demo.

## Transition checkpoint — target hour 8

Move to analysis when summaries, comparisons, and streaming chat work through B's UI using real data, and failures/fallbacks behave clearly. Do not wait for A to finish the whole backend. You still own AI fixes after switching.

If AI takes longer, finish core AI first and reduce analysis scope. The original full analysis layer is not assumed to be quick.

## Hours 8–14: Basic rankings and anomalies

- [x] Build rankings by available metrics first, with clear ordering, units, and dates. Higher does not always mean better.
- [x] Expose rankings through `GET /api/rankings/{metric}` and register the analysis router.
- [x] Check ranking outputs with offline tests and a real-app smoke test; current suite passes 36 tests.
- [x] Share sample ranking/anomaly outputs immediately so A/B can prepare integration.
- [x] Choose one metric with sufficient comparable dated history.
- [x] Implement a simple standard-deviation anomaly rule comparing the latest observation with prior observations.
- [x] Document the window, minimum history, and threshold; handle nulls, insufficient history, and zero variation explicitly.
- [ ] Keep annual and daily series separate.
- [x] Check ordinary values, an obvious outlier, insufficient data, constant data, and real demo-country results.
- [x] Package ranking calculations as importable functions and expose ranking retrieval in your analysis router.
- [x] Package anomaly calculations as importable functions and expose anomaly retrieval in your analysis router.
- [ ] Deliver working outputs by hour 14. If delayed, prioritize rankings and agree on reduced anomaly scope.

## Hours 14–18: Anomaly explanations

- [x] Build `POST /api/anomaly/explain` using your existing IFM client and calculated anomaly results.
- [x] Explain the observed deviation and rule without asserting unsupported real-world causes.
- [x] Provide a template explanation if AI fails.
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

The original/custom Market Health Score, correlations, rolling trends, biggest movers, and time-slider preparation remain optional. Add them only after the core demo works and if A/B can integrate them before hour 18. Document and validate score weights; use comparable historical periods for movers.

**Done:** Core AI works reliably, followed by metric rankings and basic anomalies where the history supports them.
