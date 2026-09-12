import { createContext, useContext, useEffect, useState } from 'react'
import { fetchCountryList, fetchCountryDetail, fetchMarketHealth } from './api'
import { countryCentroid } from '../utils/geo'

const CountriesContext = createContext(null)

function placeholderQuestions(country) {
  return [`What's driving ${country.country_name}'s inflation?`, 'Compare to another country']
}

export function CountriesProvider({ children }) {
  const [state, setState] = useState({ countries: [], geojsonFeatures: [], loading: true, error: null })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [geojson, summaries, health] = await Promise.all([
          fetch('/data/countries-110m.geojson').then((res) => res.json()),
          fetchCountryList(),
          fetchMarketHealth().catch(() => null), // stretch endpoint — degrade to no score, not a load failure
        ])
        const features = geojson.features.filter((f) => f.properties.ISO_A3 !== 'ATA')
        const centroidByCode = Object.fromEntries(features.map((f) => [f.properties.ISO_A3, countryCentroid(f)]))
        const healthByCode = Object.fromEntries((health?.rankings ?? []).map((r) => [r.country_code, r]))

        const details = await Promise.all(summaries.map((s) => fetchCountryDetail(s.country_code)))
        const countries = details
          .filter((d) => d != null)
          .map((d) => {
            const centroid = centroidByCode[d.country_code] ?? { lat: 0, lng: 0 }
            const score = healthByCode[d.country_code]
            return {
              ...d,
              lat: centroid.lat,
              lng: centroid.lng,
              health_score: score?.score ?? null,
              health_label: null, // omit so HealthScoreGauge derives a label from the score itself
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
