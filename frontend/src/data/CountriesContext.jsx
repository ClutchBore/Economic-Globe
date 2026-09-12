import { createContext, useContext, useEffect, useState } from 'react'
import { fetchCountryList, fetchCountryDetail } from './api'
import { countryCentroid } from '../utils/geo'

const CountriesContext = createContext(null)

// TEMPORARY stand-in for Person C's real Composite Market Health Score, which doesn't exist
// yet (the analysis layer hasn't started). Swap this out for a real field from that endpoint
// once it ships — everything downstream just reads `country.health_score`.
function placeholderHealthScore(country) {
  let score = 60
  if (country.gdp_per_capita > 40000) score += 12
  else if (country.gdp_per_capita < 10000) score -= 10
  if (country.inflation != null) {
    if (country.inflation < 3) score += 8
    else if (country.inflation > 6) score -= 10
  }
  if (country.bond_yield_10y != null && country.bond_yield_10y > 8) score -= 8
  return Math.max(15, Math.min(92, Math.round(score)))
}

function placeholderSummary(country) {
  return `Placeholder summary — wire this up to POST /api/summarize/${country.country_code}.`
}

function placeholderQuestions(country) {
  return [`What's driving ${country.country_name}'s inflation?`, 'Compare to another country']
}

export function CountriesProvider({ children }) {
  const [state, setState] = useState({ countries: [], geojsonFeatures: [], loading: true, error: null })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [geojson, summaries] = await Promise.all([
          fetch('/data/countries-110m.geojson').then((res) => res.json()),
          fetchCountryList(),
        ])
        const features = geojson.features.filter((f) => f.properties.ISO_A3 !== 'ATA')
        const centroidByCode = Object.fromEntries(features.map((f) => [f.properties.ISO_A3, countryCentroid(f)]))

        const details = await Promise.all(summaries.map((s) => fetchCountryDetail(s.country_code)))
        const countries = details
          .filter((d) => d != null)
          .map((d) => {
            const centroid = centroidByCode[d.country_code] ?? { lat: 0, lng: 0 }
            return {
              ...d,
              lat: centroid.lat,
              lng: centroid.lng,
              health_score: placeholderHealthScore(d),
              health_label: null, // omit so HealthScoreGauge derives a label from the score itself
              ai_summary: placeholderSummary(d),
              suggested_questions: placeholderQuestions(d),
            }
          })

        if (!cancelled) setState({ countries, geojsonFeatures: features, loading: false, error: null })
      } catch (err) {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: err.message }))
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return <CountriesContext.Provider value={state}>{children}</CountriesContext.Provider>
}

export function useCountries() {
  const ctx = useContext(CountriesContext)
  if (!ctx) throw new Error('useCountries must be used within a CountriesProvider')
  return ctx
}
