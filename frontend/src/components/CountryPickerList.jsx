import { useMemo, useState } from 'react'
import { useCountries } from '../data/CountriesContext'

export default function CountryPickerList({ excludeCodes = [], onSelect }) {
  const { countries } = useCountries()
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()

  const options = useMemo(() => {
    return countries
      .filter((country) => !excludeCodes.includes(country.country_code))
      .filter((country) => {
        if (!normalizedQuery) return true
        const name = country.country_name.toLowerCase()
        const code = country.country_code.toLowerCase()
        return name.startsWith(normalizedQuery) || code.startsWith(normalizedQuery) || name.includes(normalizedQuery)
      })
      .sort((a, b) => {
        if (!normalizedQuery) return a.country_name.localeCompare(b.country_name)
        const aName = a.country_name.toLowerCase()
        const bName = b.country_name.toLowerCase()
        const aStarts = aName.startsWith(normalizedQuery) ? 0 : 1
        const bStarts = bName.startsWith(normalizedQuery) ? 0 : 1
        return aStarts - bStarts || aName.localeCompare(bName)
      })
      .slice(0, 30)
  }, [countries, excludeCodes, normalizedQuery])

  return (
    <div className="flex max-h-[260px] flex-col gap-1 overflow-hidden rounded-none border border-slate-300 bg-slate-100/60 p-1.5">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search countries..."
        className="w-full border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-900"
      />
      <div className="flex flex-col gap-1 overflow-y-auto">
        {options.map((c) => (
          <button
            key={c.country_code}
            onClick={() => onSelect(c)}
            className="flex items-center justify-between rounded-none px-3 py-2 text-left hover:bg-slate-100"
          >
            <span className="text-[13px] text-slate-800">{c.country_name}</span>
            <span className="text-[11px] text-slate-500">{c.country_code}</span>
          </button>
        ))}
        {options.length === 0 && (
          <div className="px-3 py-2 text-[12.5px] font-semibold text-slate-500">No matching countries</div>
        )}
      </div>
    </div>
  )
}
