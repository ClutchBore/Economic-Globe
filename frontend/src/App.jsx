import { useMemo, useState } from 'react'
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
  const [theme, setTheme] = useState('light')
  const [countrySearch, setCountrySearch] = useState('')
  const [showTitleSlide, setShowTitleSlide] = useState(true)
  const { countries, geojsonFeatures, loading, error } = useCountries()

  function selectCountry(country) {
    setSelectedCountry(country)
    setCompareCountry(null)
  }

  const searchResults = useMemo(() => {
    const query = countrySearch.trim().toLowerCase()
    if (!query) return []

    return countries
      .filter((country) => {
        const name = country.country_name.toLowerCase()
        const code = country.country_code.toLowerCase()
        return name.startsWith(query) || code.startsWith(query) || name.includes(query)
      })
      .sort((a, b) => {
        const aName = a.country_name.toLowerCase()
        const bName = b.country_name.toLowerCase()
        const aStarts = aName.startsWith(query) ? 0 : 1
        const bStarts = bName.startsWith(query) ? 0 : 1
        return aStarts - bStarts || aName.localeCompare(bName)
      })
      .slice(0, 8)
  }, [countries, countrySearch])

  const rightInset = 0
  const globeOffset = compareCountry ? 360 : selectedCountry ? 220 : 0

  if (showTitleSlide) {
    return (
      <div className={`theme-${theme} relative flex h-screen w-screen flex-col items-center justify-center bg-white text-slate-950`}>
        <div className="absolute right-8 top-7 flex items-center gap-3">
          <span className="text-[12px] font-bold uppercase tracking-wide text-slate-950">
            {theme === 'light' ? 'Light mode' : 'Dark mode'}
          </span>
          <button
            onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
            className="h-5 w-11 bg-slate-200 p-0.5 hover:bg-slate-300"
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            <span
              className={
                'block h-4 w-4 bg-slate-950 transition-transform ' +
                (theme === 'dark' ? 'translate-x-6' : 'translate-x-0')
              }
            />
          </button>
        </div>

        <div className="flex flex-col items-center gap-5 border border-slate-900 bg-white px-12 py-10">
          <span className="brand-title text-[44px] font-extrabold leading-none tracking-wide">Terraconomy</span>
          <div className="mt-2 h-1 w-48 overflow-hidden bg-slate-200">
            <div className="h-full w-1/2 animate-[loadingSlide_1.2s_ease-in-out_infinite] bg-slate-950" />
          </div>
          <button
            onClick={() => {
              if (!loading && !error) setShowTitleSlide(false)
            }}
            disabled={loading || Boolean(error)}
            className="mt-2 border border-slate-900 bg-white px-5 py-2 text-[13px] font-bold uppercase tracking-wide text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {error ? 'Unable to load' : 'Enter globe'}
          </button>
          {error && (
            <p className="max-w-[420px] text-center text-[12px] font-semibold text-slate-500">
              Couldn't load country data ({error}). Is the backend running at {API_BASE}?
            </p>
          )}
        </div>
        <a
          href="/provenance.html"
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-7 right-8 border border-slate-900 bg-white px-3 py-1.5 text-[12px] font-bold tracking-wide text-slate-950 hover:bg-slate-100"
        >
          Sources
        </a>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-center text-slate-700">
        Couldn't load country data ({error}). Is the backend running at {API_BASE}?
      </div>
    )
  }

  return (
    <div className={`theme-${theme} relative h-screen w-screen overflow-hidden bg-white text-slate-950`}>
      <Globe
        countries={countries}
        geojsonFeatures={geojsonFeatures}
        onSelectCountry={selectCountry}
        rightInset={rightInset}
        arcCountries={compareCountry ? [selectedCountry, compareCountry] : null}
        theme={theme}
        focusedCountry={selectedCountry}
        horizontalOffset={globeOffset}
      />

      <div className="absolute left-8 right-8 top-7 z-10 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex flex-col items-start gap-5">
            <button
              onClick={() => {
                setSelectedCountry(null)
                setCompareCountry(null)
                setCountrySearch('')
                setShowRankings(false)
                setShowTitleSlide(true)
              }}
              className="brand-title text-[32px] font-extrabold leading-none text-slate-950 hover:opacity-70"
              aria-label="Return to title slide"
            >
              Terraconomy
            </button>
            <button
              onClick={() => setShowRankings(true)}
              className="border border-slate-900 bg-white px-3 py-1.5 text-[12.5px] font-bold tracking-wide text-slate-950 hover:bg-slate-100"
            >
              Rankings
            </button>
          </div>

          {/* Grouped with the title (rather than centered independently across the whole
              viewport) so it wraps below instead of overlapping the title or a right-docked
              country/comparison panel at narrower widths. */}
          {!selectedCountry && (
            <div className="w-[280px]">
              <input
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Search countries..."
                className="w-full border border-slate-900 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-950 outline-none placeholder:text-slate-500 focus:border-slate-950"
              />
              {searchResults.length > 0 && (
                <div className="mt-1 max-h-64 overflow-y-auto border border-slate-900 bg-white shadow-lg">
                  {searchResults.map((country) => (
                    <button
                      key={country.country_code}
                      onClick={() => {
                        selectCountry(country)
                        setCountrySearch('')
                      }}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[12.5px] font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      <span>{country.country_name}</span>
                      <span className="text-[11px] font-bold text-slate-500">{country.country_code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] font-bold uppercase tracking-wide text-slate-950">
            {theme === 'light' ? 'Light mode' : 'Dark mode'}
          </span>
          <button
            onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
            className="h-5 w-11 bg-slate-200 p-0.5 hover:bg-slate-300"
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            <span
              className={
                'block h-4 w-4 bg-slate-950 transition-transform ' +
                (theme === 'dark' ? 'translate-x-6' : 'translate-x-0')
              }
            />
          </button>
        </div>
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

      {selectedCountry && (        <div
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
