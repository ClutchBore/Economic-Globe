// Sample country fixture matching the shared per-country schema from hackathon_plan.md.
// Swap this for a real `GET /api/country/{country_code}` response once the backend is live.
export const sampleCountry = {
  country_code: 'DEU',
  country_name: 'Germany',
  region: 'Europe',
  data_as_of: 'Q2 2026',

  health_score: 72,
  health_label: 'Strong',

  gdp: 4.32e12,
  gdp_per_capita: 51400,
  inflation: 2.4,
  bond_yield_10y: 2.61,
  fx_rate: 1.08,
  fx_pair: 'EUR / USD',
  fx_change_pct: 0.3,

  ai_summary:
    "Germany's economy is showing steady, moderate growth with inflation back near the ECB's target range. " +
    'Bond yields have ticked up slightly, reflecting tighter monetary policy, while the Euro has held relatively ' +
    'stable against the Dollar. Overall, the data points to a resilient but slow-growing economy compared to its ' +
    '2021 pace.',

  suggested_questions: ['Why did inflation rise in 2023?', 'Compare to France'],

  // one time series per metric tab, feeding the chart
  history: {
    gdp: [
      { year: '2021', value: 4.28 },
      { year: '2022', value: 4.08 },
      { year: '2023', value: 4.12 },
      { year: '2024', value: 4.21 },
      { year: '2025', value: 4.27 },
      { year: '2026', value: 4.32 },
    ],
    inflation: [
      { year: '2021', value: 3.1 },
      { year: '2022', value: 6.9 },
      { year: '2023', value: 5.9 },
      { year: '2024', value: 2.9 },
      { year: '2025', value: 2.5 },
      { year: '2026', value: 2.4 },
    ],
    bond_yield_10y: [
      { year: '2021', value: -0.3 },
      { year: '2022', value: 2.1 },
      { year: '2023', value: 2.4 },
      { year: '2024', value: 2.3 },
      { year: '2025', value: 2.5 },
      { year: '2026', value: 2.61 },
    ],
    fx_rate: [
      { year: '2021', value: 1.18 },
      { year: '2022', value: 1.05 },
      { year: '2023', value: 1.09 },
      { year: '2024', value: 1.08 },
      { year: '2025', value: 1.07 },
      { year: '2026', value: 1.08 },
    ],
  },
}

export const metricTabs = [
  { key: 'gdp', label: 'GDP', format: (v) => `$${v.toFixed(2)}T` },
  { key: 'inflation', label: 'Inflation', format: (v) => `${v.toFixed(1)}%` },
  { key: 'bond_yield_10y', label: 'Bond yield', format: (v) => `${v.toFixed(2)}%` },
  { key: 'fx_rate', label: 'Currency', format: (v) => v.toFixed(2) },
]
