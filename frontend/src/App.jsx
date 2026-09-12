import { useEffect, useState } from 'react'
import CountryPanel from './components/CountryPanel'
import ComparisonPanel from './components/ComparisonPanel'
import RankingsPanel from './components/RankingsPanel'
import Globe from './components/Globe'
import { CountriesProvider, useCountries } from './data/CountriesContext'
import { API_BASE } from './data/api'

// Space to reserve to the right of the globe so an open panel never covers a selected country —
// matches each panel's own width (452px / 820px) plus its right-4 offset and a little breathing room.
const SINGLE_PANEL_INSET = 508
const COMPARISON_PANEL_INSET = 876

function AppShell() {
  const [status, setStatus] = useState('checking...')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [compareCountry, setCompareCountry] = useState(null)
  const [showRankings, setShowRankings] = useState(false)
  const { countries, geojsonFeatures, loading, error } = useCountries()

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('backend not reachable'))
  }, [])

  function selectCountry(country) {
    setSelectedCountry(country)
    setCompareCountry(null)
  }

  const rightInset = compareCountry ? COMPARISON_PANEL_INSET : selectedCountry ? SINGLE_PANEL_INSET : 0

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-500">
        Loading country data…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-center text-slate-500">
        Couldn't load country data ({error}). Is the backend running at {API_BASE}?
      </div>
    )
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-white">
      <Globe
        countries={countries}
        geojsonFeatures={geojsonFeatures}
        onSelectCountry={selectCountry}
        spinning={!selectedCountry}
        rightInset={rightInset}
        arcCountries={compareCountry ? [selectedCountry, compareCountry] : null}
      />

      <div className="absolute left-8 top-7 flex flex-col items-start gap-2">
        <div className="pointer-events-none flex flex-col gap-1">
          <span className="text-[15px] font-semibold tracking-wide text-slate-100">Economic Globe</span>
          <span className="text-xs text-slate-600">Backend status: {status}</span>
        </div>
        <button
          onClick={() => setShowRankings(true)}
          className="rounded-full border border-white/10 bg-slate-900/70 px-3.5 py-1.5 text-[12.5px] font-semibold text-slate-300 hover:bg-white/[0.06]"
        >
          Rankings
        </button>
      </div>

      {showRankings && (
        <RankingsPanel
          onClose={() => setShowRankings(false)}
          onSelectCountry={(code) => {
            const country = countries.find((c) => c.country_code === code)
            if (country) selectCountry(country)
            setShowRankings(false)
          }}
        />
      )}

      {selectedCountry && (
        <div
          className={
            'absolute inset-0 ' +
            (compareCountry ? 'lg:inset-y-4 lg:right-4 lg:left-auto' : 'sm:inset-y-4 sm:right-4 sm:left-auto')
          }
        >
          {compareCountry ? (
            <ComparisonPanel
              key={`${selectedCountry.country_code}-${compareCountry.country_code}`}
              countryA={selectedCountry}
              countryB={compareCountry}
              onClose={() => setCompareCountry(null)}
              onChangeCountryB={setCompareCountry}
            />
          ) : (
            <CountryPanel
              key={selectedCountry.country_code}
              country={selectedCountry}
              onClose={() => setSelectedCountry(null)}
              onCompare={setCompareCountry}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <CountriesProvider>
      <AppShell />
    </CountriesProvider>
  )
}
