export const metricTabs = [
  { key: 'gdp', label: 'GDP', format: (v) => `$${(v / 1e12).toFixed(2)}T` },
  { key: 'gdp_per_capita', label: 'GDP per capita', format: (v) => `$${Math.round(v).toLocaleString()}` },
  { key: 'inflation', label: 'Inflation', format: (v) => `${v.toFixed(1)}%` },
  { key: 'bond_yield_10y', label: 'Bond yield', format: (v) => `${v.toFixed(2)}%` },
  { key: 'fx_rate', label: 'Currency', format: (v) => v.toFixed(2) },
]
