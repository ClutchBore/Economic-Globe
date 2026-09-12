import { useState } from 'react'
import HealthScoreGauge from './HealthScoreGauge'
import ComparisonChart from './ComparisonChart'
import CountryPickerList from './CountryPickerList'
import { metricTabs } from '../data/mockCountries'

function GaugeColumn({ country }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span className="text-[13px] font-semibold text-slate-200">{country.country_name}</span>
      <HealthScoreGauge score={country.health_score} label={country.health_label} showLabel={false} />
    </div>
  )
}

function StatRow({ label, valueA, valueB }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr] items-center gap-3 border-b border-white/[0.05] py-2.5 last:border-0">
      <span className="text-[12.5px] text-slate-400">{label}</span>
      <span className="text-right text-[13.5px] font-semibold text-white">{valueA}</span>
      <span className="text-right text-[13.5px] font-semibold text-white">{valueB}</span>
    </div>
  )
}

export default function ComparisonPanel({ countryA, countryB, onClose, onChangeCountryB }) {
  const [activeMetric, setActiveMetric] = useState(metricTabs[0].key)
  const [showPicker, setShowPicker] = useState(false)

  const activeTab = metricTabs.find((t) => t.key === activeMetric)
  const chartData = countryA.history[activeMetric].map((point, i) => ({
    year: point.year,
    a: point.value,
    b: countryB.history[activeMetric][i]?.value,
  }))

  const fxFmt = (c) => `${c.fx_change_pct > 0 ? '+' : ''}${c.fx_change_pct.toFixed(1)}%`

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-none border-0 bg-slate-900 shadow-2xl lg:w-[820px] lg:rounded-2xl lg:border lg:border-white/[0.08]">
      {/* header */}
      <div className="flex flex-none items-center justify-between border-b border-white/[0.07] px-5 py-[18px]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[17px] font-bold leading-tight text-white">
            {countryA.country_name} <span className="font-normal text-slate-500">vs.</span> {countryB.country_name}
          </span>
          <span className="text-xs text-slate-500">Comparison · data as of {countryA.data_as_of}</span>
        </div>
        <button
          onClick={onClose}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.08]"
          aria-label="Close comparison"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M1 1l13 13M14 1L1 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* scrollable content */}
      <div className="flex flex-1 flex-col gap-[22px] overflow-y-auto px-5 pb-[22px] pt-[22px]">
        <div className="flex flex-col items-center gap-2">
          <div className="flex w-full flex-col items-center gap-6 lg:flex-row lg:items-start lg:gap-4">
            <GaugeColumn country={countryA} />
            <GaugeColumn country={countryB} />
          </div>
          <span className="text-xs tracking-wide text-slate-500">COMPOSITE MARKET HEALTH SCORE</span>
        </div>

        <div className="flex flex-col">
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 pb-2">
            <span className="text-[11px] uppercase tracking-wide text-slate-600">Metric</span>
            <span className="text-right text-[11px] uppercase tracking-wide text-slate-600">{countryA.country_code}</span>
            <span className="text-right text-[11px] uppercase tracking-wide text-slate-600">{countryB.country_code}</span>
          </div>
          <StatRow label="Health score" valueA={countryA.health_score} valueB={countryB.health_score} />
          <StatRow label="GDP" valueA={`$${(countryA.gdp / 1e12).toFixed(2)}T`} valueB={`$${(countryB.gdp / 1e12).toFixed(2)}T`} />
          <StatRow
            label="GDP per capita"
            valueA={`$${countryA.gdp_per_capita.toLocaleString()}`}
            valueB={`$${countryB.gdp_per_capita.toLocaleString()}`}
          />
          <StatRow label="Inflation (YoY)" valueA={`${countryA.inflation}%`} valueB={`${countryB.inflation}%`} />
          <StatRow label="10Y bond yield" valueA={`${countryA.bond_yield_10y}%`} valueB={`${countryB.bond_yield_10y}%`} />
          <StatRow label="Currency Δ today" valueA={fxFmt(countryA)} valueB={fxFmt(countryB)} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {metricTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveMetric(tab.key)}
                className={
                  'rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ' +
                  (tab.key === activeMetric
                    ? 'border border-[#3987e5]/45 bg-[#3987e5]/[0.16] text-[#7db3f2]'
                    : 'border border-transparent text-slate-400 hover:bg-white/[0.06]')
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
          <ComparisonChart
            data={chartData}
            formatValue={activeTab.format}
            nameA={countryA.country_name}
            nameB={countryB.country_name}
          />
        </div>

        <div className="flex flex-col gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.035] px-4 py-[15px]">
          <div className="flex items-center gap-2">
            <div className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-[#3987e5]/[0.18]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 0.5l1.2 3.3L10.5 5l-3.3 1.2L6 9.5l-1.2-3.3L1.5 5l3.3-1.2z" fill="#7db3f2" />
              </svg>
            </div>
            <span className="text-[11.5px] font-bold tracking-wider text-slate-400">AI COMPARISON</span>
          </div>
          <p className="text-[13.5px] leading-[1.55] text-slate-300">
            Placeholder response — wire this up to POST /api/compare with {countryA.country_code} and {countryB.country_code}.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowPicker((s) => !s)}
            className="self-start text-[12.5px] font-semibold text-slate-400 hover:text-white"
          >
            Change {countryB.country_name} →
          </button>
          {showPicker && (
            <CountryPickerList
              excludeCodes={[countryA.country_code, countryB.country_code]}
              onSelect={(c) => {
                onChangeCountryB(c)
                setShowPicker(false)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
