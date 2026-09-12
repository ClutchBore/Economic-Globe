import { useState } from 'react'
import HealthScoreGauge from './HealthScoreGauge'
import ComparisonChart from './ComparisonChart'
import CountryPickerList from './CountryPickerList'
import AIComparison from './AIComparison'
import { isNumber, metricTabs, missingValue } from '../data/metricTabs'

function GaugeColumn({ country }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span className="text-[13px] font-semibold text-slate-800">{country.country_name}</span>
      <HealthScoreGauge score={country.health_score} label={country.health_label} showLabel={false} />
    </div>
  )
}

function StatRow({ label, valueA, valueB }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr] items-center gap-3 border-b border-slate-200 py-2.5 last:border-0">
      <span className="text-[12.5px] text-slate-500">{label}</span>
      <span className="text-right text-[13.5px] font-semibold text-slate-950">{valueA}</span>
      <span className="text-right text-[13.5px] font-semibold text-slate-950">{valueB}</span>
    </div>
  )
}

const scoreFmt = (value) => (isNumber(value) ? value.toFixed(1) : missingValue)
const fxFmt = (c) => (isNumber(c.fx_change_pct) ? `${c.fx_change_pct > 0 ? '+' : ''}${c.fx_change_pct.toFixed(1)}%` : missingValue)

export default function ComparisonPanel({ countryA, countryB, onClose, onChangeCountryB }) {
  const [activeMetric, setActiveMetric] = useState(metricTabs[0].key)
  const [showPicker, setShowPicker] = useState(false)

  const activeTab = metricTabs.find((t) => t.key === activeMetric)
  const historyA = countryA.history?.[activeMetric] ?? []
  const historyB = countryB.history?.[activeMetric] ?? []
  const hasChartData = historyA.length > 0 && historyB.length > 0
  const chartData = hasChartData
    ? historyA.map((point, i) => ({ year: point.year, a: point.value, b: historyB[i]?.value }))
    : []

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-none border-0 bg-white shadow-2xl lg:w-[820px] lg:rounded-none lg:border lg:border-slate-200">
      {/* header */}
      <div className="flex flex-none items-center justify-between border-b border-slate-200 px-5 py-[18px]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[17px] font-bold leading-tight text-slate-950">
            {countryA.country_name} <span className="font-normal text-slate-500">vs.</span> {countryB.country_name}
          </span>
          <span className="text-xs text-slate-500">Comparison · data as of {countryA.data_as_of ?? missingValue}</span>
        </div>
        <button
          onClick={onClose}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-none text-slate-500 hover:bg-slate-100"
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
            <span className="text-[11px] uppercase tracking-wide text-slate-500">Metric</span>
            <span className="text-right text-[11px] uppercase tracking-wide text-slate-500">{countryA.country_code}</span>
            <span className="text-right text-[11px] uppercase tracking-wide text-slate-500">{countryB.country_code}</span>
          </div>
          <StatRow label="Health score" valueA={scoreFmt(countryA.health_score)} valueB={scoreFmt(countryB.health_score)} />
          {metricTabs.map((metric) => (
            <StatRow
              key={metric.key}
              label={metric.label}
              valueA={metric.format(countryA[metric.key])}
              valueB={metric.format(countryB[metric.key])}
            />
          ))}
          <StatRow label="Currency change today" valueA={fxFmt(countryA)} valueB={fxFmt(countryB)} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {metricTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveMetric(tab.key)}
                className={
                  'rounded-none px-3 py-1.5 text-[12.5px] font-semibold transition-colors ' +
                  (tab.key === activeMetric
                    ? 'border border-slate-900 bg-slate-200 text-slate-950'
                    : 'border border-transparent text-slate-500 hover:bg-slate-100')
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
          {hasChartData ? (
            <ComparisonChart
              data={chartData}
              formatValue={activeTab.format}
              nameA={countryA.country_name}
              nameB={countryB.country_name}
            />
          ) : (
            <div className="flex h-[150px] items-center justify-center text-sm text-slate-500">
              {activeTab.label} history isn't available for both countries
            </div>
          )}
        </div>

        <AIComparison countryCodeA={countryA.country_code} countryCodeB={countryB.country_code} />

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowPicker((s) => !s)}
            className="self-start text-[12.5px] font-semibold text-slate-500 hover:text-slate-950"
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
