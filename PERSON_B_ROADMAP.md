# Person B Roadmap — Frontend & Visualization

**Branch:** `feature/frontend-viz`
**Scope:** Map, country panels, charts, comparison, chat interface, and frontend deployment.
**Team contacts:** A supplies country data; C (Shrav) supplies AI first and analysis afterward.
**File ownership:** `frontend/` and frontend deployment configuration. Coordinate shared root configuration through A.

## Before Hour 0

- [ ] Settle map versus globe and sketch the core screens.
- [ ] Verify the existing React/Vite/Tailwind scaffold.
- [ ] Agree on data shapes with A and AI payloads/streaming events/errors with C.

## Hours 0–4: Map with sample data

- [ ] Begin layout while A prepares the hour 0–1 sample fixture.
- [ ] Render one metric, such as GDP, with country coloring.
- [ ] Add country selection, basic details, legend, and missing-data styling.
- [ ] At hour 4, connect available real data and review C's AI response examples.

## Hours 4–8: Data and core AI UI

- [ ] Add metric switching, units, and observation dates.
- [ ] Connect real country data from A.
- [ ] Build summary, comparison, and streaming chat components against C's agreed interfaces.
- [ ] Connect C's endpoints as they arrive; include loading and error behavior.
- [ ] At hour 8, verify the core AI flow with A/C so C can move to analysis.

## Hours 8–14: Complete the core experience

- [ ] Polish comparisons and chat; prevent stale responses after switching countries.
- [ ] Add historical charts and unavailable-history states.
- [ ] Improve responsive layout and formatting.
- [ ] Prepare ranking/anomaly panels using C's early sample outputs.
- [ ] At hour 14, connect C's working analysis endpoints.

## Hours 14–18: Insights and integration

- [ ] Show metric rankings with dates, units, and clear sort direction.
- [ ] Show anomaly flags and C's explanations beside the relevant metric.
- [ ] Treat insufficient history as unavailable analysis, not evidence that nothing unusual happened.
- [ ] Try frontend deployment and verify the full flow with A/C.
- [ ] Freeze features at hour 18.

## Hours 18–22: Deploy and polish

- [ ] Finalize deployment using the deployed backend URL.
- [ ] Check desktop/mobile layouts, slow AI calls, errors, and cached summary labels.
- [ ] Rehearse map → country → summary → compare → chat → available insights.

## Hours 22–24: Buffer

- [ ] Fix blockers only.

**Done:** Users can explore real data and use summaries, comparisons, and chat. Integrate basic insights as delivered; optional analysis does not block the core website.
