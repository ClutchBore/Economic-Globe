# Person B Roadmap — Frontend, Visualization & UI

**Branch:** `feature/frontend-viz`
**Scope:** Map, charts, country panel, chat UI

---

## Before Hour 0 (Prep)

- [ ] **Lock the globe vs. map decision** before starting — this is yours to settle:
  - 3D globe.gl → higher visual impact, higher build cost/risk
  - 2D react-simple-maps → faster, more predictable
- [ ] Wireframe the core screens: map view, country detail panel, comparison view, chat UI
- [ ] Confirm the per-country schema with A (`{country_code, country_name, gdp, gdp_per_capita, inflation, bond_yield_10y, fx_rate, ...}`)
- [ ] Scaffold React + Vite project, install Tailwind, react-simple-maps (or globe.gl), Recharts

## Hours 0–4: Map on Mock Data

- [ ] Wait for A's mock data fixture (should land early) — do **not** wait on the real pipeline
- [ ] Build the map/globe component rendering against the mock fixture
- [ ] Get **one metric live** on the map (e.g. GDP) with country coloring
- [ ] Basic layout shell: map area + placeholder panel region

## Hours 4–8: Metric Switcher + Styling

- [ ] Build the metric switcher (GDP / inflation / bond yields / currency)
- [ ] Wire remaining data layers/metrics into the map coloring logic
- [ ] Apply Tailwind styling pass — color scales, legend, responsive layout
- [ ] **Hour 4 sync**: swap mock fixture for A's real data-serving routes (by country / by metric / by comparison pair)
- [ ] Handle basic loading states while data loads

## Hours 8–14: AI-Powered UI

- [ ] Build the country detail panel: click a country → show its data
- [ ] Add AI summary display in the panel, calling `POST /api/summarize/{country_code}`
- [ ] Add a "compare to..." action from the panel
- [ ] Build the comparison view/UI, calling `POST /api/compare`
- [ ] Build the chat interface for the country chatbot, calling `POST /api/chat/{country_code}` — support streaming responses
- [ ] Add charts (Recharts) for time-series/comparison views
- [ ] **Hour 8 sync**: confirm AI route contracts and response shapes with A

## Hours 14–18: Rankings + Anomaly UI

- [ ] Surface C's rankings/leaderboard output (top N by Market Health Score, biggest movers, most anomalies) as a UI panel beyond the map
- [ ] Display anomaly flags on the map/panel, with A+C's AI narration (`/api/anomaly/explain`) shown in context
- [ ] Polish comparison and chat UX with real data end-to-end

## Hours 18–22: Robustness + Deploy

- [ ] Handle loading/error states gracefully:
  - [ ] Cache misses
  - [ ] Slow AI responses (spinners/skeletons for summarize/compare/chat)
  - [ ] Rate limits (friendly fallback messaging)
- [ ] Deploy frontend to Vercel alongside A's backend
- [ ] Cross-browser / responsive sanity check
- [ ] Rehearse the demo flow: map → click country → summary → compare → chat → rankings

## Hours 22–24: Buffer

- [ ] Kept empty on purpose — use for last visual polish if everything else landed

---

## Cross-cutting reminders

- Build against the mock fixture first — never block on A's real pipeline early on.
- The chat UI must support streaming from the start; retrofitting streaming late is painful.
- Loading/error states aren't optional polish — AI calls and rate limits are demo-day failure modes.
