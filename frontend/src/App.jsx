import { useState } from 'react'
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
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [compareCountry, setCompareCountry] = useState(null)
  const [showRankings, setShowRankings] = useState(false)
  const { countries, geojsonFeatures, loading, error } = useCountries()

  function selectCountry(country) {
    setSelectedCountry(country)
    setCompareCountry(null)
  }

  const rightInset = compareCountry ? COMPARISON_PANEL_INSET : selectedCountry ? SINGLE_PANEL_INSET : 0

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-slate-500">
        Loading country data…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-center text-slate-500">
        Couldn't load country data ({error}). Is the backend running at {API_BASE}?
      </div>
    )
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <Globe
        countries={countries}
        geojsonFeatures={geojsonFeatures}
        onSelectCountry={selectCountry}
        rightInset={rightInset}
        arcCountries={compareCountry ? [selectedCountry, compareCountry] : null}
      />

      <div className="absolute left-8 top-7 flex flex-col items-start gap-5">
        <div className="pointer-events-none flex flex-col gap-1">
          <span className="brand-title text-[32px] font-extrabold leading-none text-white">Terraconomy</span>
        </div>
        <button
          onClick={() => setShowRankings(true)}
          className="border border-slate-500 bg-black/80 px-4 py-2 text-[13px] font-bold tracking-wide text-white hover:border-slate-300 hover:bg-slate-800"
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
