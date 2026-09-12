# Person B Roadmap — Frontend & Visualization

**Branch:** `feature/frontend-viz`
<<<<<<< HEAD
**Role:** Build the website throughout. A supplies data/backend; C supplies AI first and analysis later.
**File ownership:** `frontend/`, including its package files and frontend deployment configuration. Coordinate any shared root deployment file through A.

## Before Hour 0

- [ ] Settle map versus globe and sketch map, country panel, comparison, and chat.
- [ ] Verify the existing React/Vite/Tailwind scaffold.
- [ ] Agree on country data formats with A.
- [ ] Agree on AI request/response shapes, streaming events, and errors with C.
- [ ] Start layout work while A prepares the sample dataset.

## Hours 0–4: Map with sample data

- [ ] Use A's hour 0–1 fixture to render one metric on the map.
- [ ] Add country selection, a basic detail panel, legend, and missing-data styling.
- [ ] Build reusable API-call helpers.
- [ ] At hour 4, connect available real country data and review C's AI responses.

## Hours 4–8: Core AI interface

- [ ] Add metric switching and show units and observation dates.
- [ ] Connect country details to A's backend.
- [ ] Build summary, comparison, and streaming chat interfaces against C's agreed contracts.
- [ ] Connect C's endpoints as they become available.
- [ ] Add loading/error states from the start.
- [ ] At hour 8, check the core AI flow with A/C so C can move to analysis.

## Hours 8–14: Complete the core website

- [ ] Polish comparison and country chat; avoid stale responses after changing country.
- [ ] Add historical charts using A's dated data, with unavailable-history states.
- [ ] Improve responsiveness, formatting, and navigation.
- [ ] Prepare ranking/anomaly panels against C's early sample output shapes.
=======
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
>>>>>>> API-backend-branch
- [ ] At hour 14, connect C's working analysis endpoints.

## Hours 14–18: Insights and integration

<<<<<<< HEAD
- [ ] Display metric rankings with units, dates, and sort direction.
- [ ] Show anomaly flags and C's explanations beside the relevant country/metric.
- [ ] Show insufficient history as unavailable analysis, not as no anomalies.
- [ ] Try frontend deployment and verify the whole flow with A/C.
- [ ] Freeze features at hour 18; only display stretch analysis that is actually ready.

## Hours 18–22: Deploy and polish

- [ ] Finalize frontend deployment and use the deployed backend URL.
=======
- [ ] Show metric rankings with dates, units, and clear sort direction.
- [ ] Show anomaly flags and C's explanations beside the relevant metric.
- [ ] Treat insufficient history as unavailable analysis, not evidence that nothing unusual happened.
- [ ] Try frontend deployment and verify the full flow with A/C.
- [ ] Freeze features at hour 18.

## Hours 18–22: Deploy and polish

- [ ] Finalize deployment using the deployed backend URL.
>>>>>>> API-backend-branch
- [ ] Check desktop/mobile layouts, slow AI calls, errors, and cached summary labels.
- [ ] Rehearse map → country → summary → compare → chat → available insights.

## Hours 22–24: Buffer

<<<<<<< HEAD
- [ ] Fix demo blockers only.

**Done:** Users can explore real country data, read summaries, compare countries, and chat. Basic analysis is integrated when delivered; optional features do not block the core demo.
=======
- [ ] Fix blockers only.

**Done:** Users can explore real data and use summaries, comparisons, and chat. Integrate basic insights as delivered; optional analysis does not block the core website.
>>>>>>> API-backend-branch
