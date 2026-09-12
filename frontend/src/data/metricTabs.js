export const missingValue = 'N/A'

export function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

const usdCompact = (value) => {
  if (!isNumber(value)) return missingValue
  const abs = Math.abs(value)
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
  return `$${Math.round(value).toLocaleString()}`
}

const usdWhole = (value) => (isNumber(value) ? `$${Math.round(value).toLocaleString()}` : missingValue)
const intlDollar = (value) => (isNumber(value) ? `intl $${Math.round(value).toLocaleString()}` : missingValue)
const pct = (digits = 1) => (value) => (isNumber(value) ? `${value.toFixed(digits)}%` : missingValue)
const wholeNumber = (value) => (isNumber(value) ? Math.round(value).toLocaleString() : missingValue)
const population = (value) => {
  if (!isNumber(value)) return missingValue
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  return wholeNumber(value)
}

export const metricTabs = [
  { key: 'gdp', label: 'GDP', unit: 'USD', format: usdCompact, mapScale: 'log' },
  { key: 'gdp_per_capita', label: 'GDP per capita', unit: 'USD', format: usdWhole },
  { key: 'gdp_per_capita_ppp', label: 'GDP per capita PPP', unit: 'international $ (PPP)', format: intlDollar },
  { key: 'gdp_growth', label: 'GDP growth', unit: '% per year', format: pct(1) },
  { key: 'inflation', label: 'Inflation', unit: '%', format: pct(1) },
  { key: 'unemployment', label: 'Unemployment', unit: '% of labor force', format: pct(1) },
  { key: 'population', label: 'Population', unit: 'people', format: population, mapScale: 'log' },
  { key: 'life_expectancy', label: 'Life expectancy', unit: 'years', format: (v) => (isNumber(v) ? `${v.toFixed(1)} yrs` : missingValue) },
  { key: 'govt_debt_pct_gdp', label: 'Govt debt', unit: '% of GDP', format: pct(1) },
  { key: 'exports_pct_gdp', label: 'Exports', unit: '% of GDP', format: pct(1) },
  { key: 'urban_population_pct', label: 'Urban population', unit: '% of population', format: pct(1) },
  { key: 'internet_users_pct', label: 'Internet users', unit: '% of population', format: pct(1) },
  { key: 'co2_per_capita', label: 'CO2 per capita', unit: 't CO2e per person', format: (v) => (isNumber(v) ? `${v.toFixed(2)} t` : missingValue) },
  { key: 'bond_yield_10y', label: '10Y bond yield', unit: '%', format: pct(2) },
  { key: 'fx_rate', label: 'FX rate', unit: 'USD per 1 unit of local currency', format: (v) => (isNumber(v) ? v.toFixed(4) : missingValue) },
]

export const metricByKey = Object.fromEntries(metricTabs.map((metric) => [metric.key, metric]))

export function formatMetricValue(key, value) {
  return metricByKey[key]?.format(value) ?? (isNumber(value) ? value.toLocaleString() : missingValue)
}
