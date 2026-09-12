// Temporary mock fixture matching the shared per-country schema from hackathon_plan.md.
// Person B is building against this so the globe/panel don't block on Person A's real pipeline —
// swap for `GET /api/country/{country_code}` once those routes land (hour-4 sync).

const YEARS = ['2021', '2022', '2023', '2024', '2025', '2026']

// Straight-line interpolation from `start` to `end` across YEARS, plus optional per-point offsets
// for a bump/dip (e.g. an inflation spike) — keeps 10 countries x 4 metrics readable by hand.
function series(start, end, bumps = []) {
  return YEARS.map((year, i) => {
    const t = i / (YEARS.length - 1)
    const base = start + (end - start) * t
    return { year, value: +(base + (bumps[i] ?? 0)).toFixed(2) }
  })
}

export const mockCountries = [
  {
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
    history: {
      gdp: series(4.28, 4.32, [0, -0.2, -0.16, -0.07, -0.01, 0]),
      inflation: series(3.1, 2.4, [0, 3.8, 2.5, -0.9, -1, 0]),
      bond_yield_10y: series(-0.3, 2.61, [0, 0.1, -0.05, -0.08, 0, 0]),
      fx_rate: series(1.18, 1.08, [0, -0.08, 0.03, -0.02, -0.02, 0]),
    },
  },
  {
    country_code: 'USA',
    country_name: 'United States',
    region: 'North America',
    data_as_of: 'Q2 2026',
    health_score: 78,
    health_label: 'Strong',
    gdp: 27.9e12,
    gdp_per_capita: 82300,
    inflation: 2.9,
    bond_yield_10y: 4.12,
    fx_rate: 1.0,
    fx_pair: 'USD / USD',
    fx_change_pct: 0,
    ai_summary:
      'The US economy continues to expand at a solid pace, with resilient consumer spending and a labor market that ' +
      "has cooled without breaking. Inflation is trending toward the Fed's target but progress has slowed, keeping " +
      'longer-dated Treasury yields elevated relative to pre-2022 norms.',
    suggested_questions: ['Why are bond yields so high?', 'Compare to China'],
    history: {
      gdp: series(23.3, 27.9, [0, -0.3, 0.1, 0.2, 0.1, 0]),
      inflation: series(4.7, 2.9, [0, 3.4, 1.6, -1.1, -0.6, 0]),
      bond_yield_10y: series(1.4, 4.12, [0, 1.9, 0.5, -0.3, 0.2, 0]),
      fx_rate: series(1, 1, []),
    },
  },
  {
    country_code: 'CHN',
    country_name: 'China',
    region: 'Asia',
    data_as_of: 'Q2 2026',
    health_score: 58,
    health_label: 'Moderate',
    gdp: 19.4e12,
    gdp_per_capita: 13700,
    inflation: 0.6,
    bond_yield_10y: 2.15,
    fx_rate: 7.18,
    fx_pair: 'CNY / USD',
    fx_change_pct: -0.1,
    ai_summary:
      "China's growth has slowed from its historical pace amid a prolonged property-sector downturn and weak " +
      'consumer confidence. Inflation remains unusually low, close to flat, while policymakers keep bond yields ' +
      'suppressed to support borrowing. Currency has stayed relatively stable under continued central bank management.',
    suggested_questions: ['Why is inflation so low?', 'Compare to India'],
    history: {
      gdp: series(17.8, 19.4, [0, 0.3, 0.2, 0, -0.1, 0]),
      inflation: series(0.9, 0.6, [0, 1.1, -0.1, -0.6, -0.3, 0]),
      bond_yield_10y: series(2.9, 2.15, [0, -0.1, -0.2, -0.2, -0.1, 0]),
      fx_rate: series(6.45, 7.18, [0, 0.35, 0.1, -0.05, 0.1, 0]),
    },
  },
  {
    country_code: 'JPN',
    country_name: 'Japan',
    region: 'Asia',
    data_as_of: 'Q2 2026',
    health_score: 61,
    health_label: 'Moderate',
    gdp: 4.11e12,
    gdp_per_capita: 33400,
    inflation: 2.2,
    bond_yield_10y: 1.35,
    fx_rate: 152.4,
    fx_pair: 'JPY / USD',
    fx_change_pct: 0.2,
    ai_summary:
      'Japan has finally exited its decades-long deflationary mindset, with inflation holding near 2% for several ' +
      'years running. The Bank of Japan has begun a slow exit from ultra-low rates, though yields remain low by ' +
      'global standards. The Yen has weakened significantly, boosting exporters but raising import costs.',
    suggested_questions: ['Why is the Yen so weak?', 'Compare to Germany'],
    history: {
      gdp: series(5.1, 4.11, [0, -0.4, -0.3, -0.2, -0.09, 0]),
      inflation: series(0.5, 2.2, [0, 1.5, 1.1, 0.3, 0.1, 0]),
      bond_yield_10y: series(0.07, 1.35, [0, 0.05, 0.15, 0.3, 0.2, 0]),
      fx_rate: series(115, 152.4, [0, 15, 8, 5, 4, 0]),
    },
  },
  {
    country_code: 'GBR',
    country_name: 'United Kingdom',
    region: 'Europe',
    data_as_of: 'Q2 2026',
    health_score: 64,
    health_label: 'Moderate',
    gdp: 3.5e12,
    gdp_per_capita: 51100,
    inflation: 2.6,
    bond_yield_10y: 4.05,
    fx_rate: 1.27,
    fx_pair: 'GBP / USD',
    fx_change_pct: 0.4,
    ai_summary:
      'The UK economy has stabilized after a stretch of near-double-digit inflation, with price growth back near ' +
      "target. Gilt yields remain elevated relative to peers, reflecting persistent fiscal concerns. Sterling has " +
      'firmed modestly as rate-cut expectations have been pushed further out.',
    suggested_questions: ['Why are gilt yields elevated?', 'Compare to Germany'],
    history: {
      gdp: series(3.13, 3.5, [0, -0.05, 0.05, 0.1, 0.1, 0]),
      inflation: series(5.4, 2.6, [0, 4.7, 1.8, -1.5, -0.8, 0]),
      bond_yield_10y: series(0.97, 4.05, [0, 2.3, 0.6, -0.2, 0.1, 0]),
      fx_rate: series(1.35, 1.27, [0, -0.13, -0.02, 0.03, 0.02, 0]),
    },
  },
  {
    country_code: 'FRA',
    country_name: 'France',
    region: 'Europe',
    data_as_of: 'Q2 2026',
    health_score: 60,
    health_label: 'Moderate',
    gdp: 3.1e12,
    gdp_per_capita: 47300,
    inflation: 2.1,
    bond_yield_10y: 3.15,
    fx_rate: 1.08,
    fx_pair: 'EUR / USD',
    fx_change_pct: 0.3,
    ai_summary:
      'France has brought inflation down in line with the broader Eurozone, but growth remains sluggish and ' +
      'the spread between French and German borrowing costs has widened on fiscal deficit concerns. The picture is ' +
      'one of stability without much momentum.',
    suggested_questions: ['Why is the yield spread with Germany widening?', 'Compare to Germany'],
    history: {
      gdp: series(2.96, 3.1, [0, -0.02, 0.02, 0.05, 0.03, 0]),
      inflation: series(2.1, 2.1, [0, 3.4, 2.3, -1, -0.4, 0]),
      bond_yield_10y: series(0.2, 3.15, [0, 1.4, 0.6, 0.3, 0.4, 0]),
      fx_rate: series(1.18, 1.08, [0, -0.08, 0.03, -0.02, -0.02, 0]),
    },
  },
  {
    country_code: 'IND',
    country_name: 'India',
    region: 'Asia',
    data_as_of: 'Q2 2026',
    health_score: 74,
    health_label: 'Strong',
    gdp: 4.27e12,
    gdp_per_capita: 2960,
    inflation: 4.3,
    bond_yield_10y: 6.9,
    fx_rate: 86.2,
    fx_pair: 'INR / USD',
    fx_change_pct: -0.1,
    ai_summary:
      'India remains one of the fastest-growing major economies, supported by strong domestic demand and sustained ' +
      'infrastructure investment. Inflation has cooled into the central bank\'s target band, though borrowing costs ' +
      'stay high relative to developed markets. The Rupee has depreciated gradually but without disorderly moves.',
    suggested_questions: ['Why are bond yields so high?', 'Compare to China'],
    history: {
      gdp: series(3.2, 4.27, [0, 0.05, 0.1, 0.1, 0.05, 0]),
      inflation: series(5.5, 4.3, [0, 1.2, -0.6, -0.9, -0.4, 0]),
      bond_yield_10y: series(6.85, 6.9, [0, 0.3, 0.1, -0.2, 0, 0]),
      fx_rate: series(74.5, 86.2, [0, 3.5, 2.8, 2.6, 2.3, 0]),
    },
  },
  {
    country_code: 'BRA',
    country_name: 'Brazil',
    region: 'South America',
    data_as_of: 'Q2 2026',
    health_score: 52,
    health_label: 'Moderate',
    gdp: 2.33e12,
    gdp_per_capita: 10800,
    inflation: 4.5,
    bond_yield_10y: 11.8,
    fx_rate: 5.32,
    fx_pair: 'BRL / USD',
    fx_change_pct: -0.5,
    ai_summary:
      'Brazil is managing persistently high borrowing costs to keep inflation in check, with the central bank among ' +
      'the most aggressive in the world on rates. Growth has held up better than expected, but the Real remains ' +
      'volatile against the Dollar amid fiscal policy uncertainty.',
    suggested_questions: ['Why are interest rates so high?', 'Compare to India'],
    history: {
      gdp: series(1.65, 2.33, [0, 0.1, 0.1, 0.15, 0.1, 0]),
      inflation: series(10.1, 4.5, [0, -3.3, -1.5, -0.5, -0.3, 0]),
      bond_yield_10y: series(10.7, 11.8, [0, 1.8, -0.5, -0.8, 0.4, 0]),
      fx_rate: series(5.58, 5.32, [0, 0.4, -0.3, -0.2, 0.1, 0]),
    },
  },
  {
    country_code: 'CAN',
    country_name: 'Canada',
    region: 'North America',
    data_as_of: 'Q2 2026',
    health_score: 68,
    health_label: 'Moderate',
    gdp: 2.24e12,
    gdp_per_capita: 54200,
    inflation: 2.3,
    bond_yield_10y: 3.35,
    fx_rate: 1.38,
    fx_pair: 'CAD / USD',
    fx_change_pct: 0.1,
    ai_summary:
      "Canada's economy has cooled alongside easing inflation, giving the Bank of Canada room to bring rates down " +
      'from their 2023 peak. Growth is modest and closely tied to US demand, and the Loonie has traded in a fairly ' +
      'narrow band against the Dollar.',
    suggested_questions: ['How tied is this to the US economy?', 'Compare to United States'],
    history: {
      gdp: series(2.14, 2.24, [0, 0.02, 0.02, 0.02, 0.01, 0]),
      inflation: series(3.9, 2.3, [0, 2.9, 0.8, -0.9, -0.4, 0]),
      bond_yield_10y: series(1.4, 3.35, [0, 1.7, 0.4, -0.2, 0.1, 0]),
      fx_rate: series(1.25, 1.38, [0, 0.09, 0.05, -0.02, 0.01, 0]),
    },
  },
  {
    country_code: 'AUS',
    country_name: 'Australia',
    region: 'Oceania',
    data_as_of: 'Q2 2026',
    health_score: 66,
    health_label: 'Moderate',
    gdp: 1.79e12,
    gdp_per_capita: 65800,
    inflation: 2.8,
    bond_yield_10y: 4.35,
    fx_rate: 0.66,
    fx_pair: 'AUD / USD',
    fx_change_pct: 0.2,
    ai_summary:
      "Australia's resource-linked economy has stayed resilient on strong commodity exports, though inflation has " +
      'been stickier than in most peer economies. Bond yields remain elevated as the central bank holds a cautious ' +
      'line on rate cuts, and the Aussie Dollar has been broadly stable.',
    suggested_questions: ['Why is inflation sticky here?', 'Compare to Canada'],
    history: {
      gdp: series(1.55, 1.79, [0, 0.03, 0.05, 0.05, 0.03, 0]),
      inflation: series(4.9, 2.8, [0, 2, 0.6, -1, -0.5, 0]),
      bond_yield_10y: series(1.7, 4.35, [0, 1.9, 0.5, -0.1, 0.15, 0]),
      fx_rate: series(0.73, 0.66, [0, -0.05, -0.03, 0.01, -0.01, 0]),
    },
  },
]

export const metricTabs = [
  { key: 'gdp', label: 'GDP', format: (v) => `$${v.toFixed(2)}T` },
  { key: 'inflation', label: 'Inflation', format: (v) => `${v.toFixed(1)}%` },
  { key: 'bond_yield_10y', label: 'Bond yield', format: (v) => `${v.toFixed(2)}%` },
  { key: 'fx_rate', label: 'Currency', format: (v) => v.toFixed(2) },
]

export function getCountryByCode(code) {
  return mockCountries.find((c) => c.country_code === code) ?? null
}
