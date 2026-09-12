export const metricTabs = [
  { key: 'gdp', label: 'GDP', format: (v) => `$${(v / 1e12).toFixed(2)}T` },
  { key: 'inflation', label: 'Inflation', format: (v) => `${v.toFixed(1)}%` },
  { key: 'bond_yield_10y', label: 'Bond yield', format: (v) => `${v.toFixed(2)}%` },
  { key: 'fx_rate', label: 'Currency', format: (v) => v.toFixed(2) },
]
