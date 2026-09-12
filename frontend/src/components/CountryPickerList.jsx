import { useCountries } from '../data/CountriesContext'

export default function CountryPickerList({ excludeCodes = [], onSelect }) {
  const { countries } = useCountries()
  const options = countries.filter((c) => !excludeCodes.includes(c.country_code))

  return (
    <div className="flex max-h-[220px] flex-col gap-1 overflow-y-auto rounded-[10px] border border-white/[0.1] bg-slate-800/60 p-1.5">
      {options.map((c) => (
        <button
          key={c.country_code}
          onClick={() => onSelect(c)}
          className="flex items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-white/[0.06]"
        >
          <span className="text-[13px] text-slate-200">{c.country_name}</span>
          <span className="text-[11px] text-slate-500">{c.country_code}</span>
        </button>
      ))}
    </div>
  )
}
