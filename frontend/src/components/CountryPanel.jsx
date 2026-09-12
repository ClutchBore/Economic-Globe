import { useState } from 'react'
import HealthScoreGauge from './HealthScoreGauge'
import MetricChart from './MetricChart'
import CountryPickerList from './CountryPickerList'
import AISummary from './AISummary'
import { metricTabs } from '../data/metricTabs'

function StatTile({ label, value }) {
  return (
    <div className="flex flex-col gap-1 rounded-[10px] bg-slate-800 px-3.5 py-3">
      <span className="text-[11.5px] text-slate-400">{label}</span>
      <span className="text-lg font-bold text-white">{value}</span>
    </div>
  )
}

function CompareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 5h9M8 2l3 3-3 3" stroke="#7db3f2" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11H5M8 14l-3-3 3-3" stroke="#7db3f2" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function CountryPanel({ country, onClose, onCompare }) {
  const [activeMetric, setActiveMetric] = useState(metricTabs[0].key)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [showComparePicker, setShowComparePicker] = useState(false)

  const activeTab = metricTabs.find((t) => t.key === activeMetric)
  const chartData = country.history?.[activeMetric] ?? []
  const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].value : null
  const fxUp = country.fx_change_pct != null && country.fx_change_pct > 0

  function askQuestion(question) {
    if (!question.trim()) return
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: question },
      {
        role: 'assistant',
        text: `Placeholder response — wire this up to POST /api/chat/${country.country_code}.`,
      },
    ])
    setDraft('')
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-none border-0 bg-slate-900 shadow-2xl sm:w-[452px] sm:rounded-2xl sm:border sm:border-white/[0.08]">
      {/* header */}
      <div className="flex flex-none items-center justify-between border-b border-white/[0.07] px-5 py-[18px]">
        <div className="flex items-center gap-3">
          <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full border border-white/[0.14] bg-slate-800 text-xs font-semibold text-slate-400">
            {country.country_code.slice(0, 2)}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[17px] font-bold leading-tight text-white">{country.country_name}</span>
            <span className="text-xs text-slate-500">
              {country.country_code} · {country.region} · data as of {country.data_as_of}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.08]"
          aria-label="Close panel"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M1 1l13 13M14 1L1 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* scrollable content */}
      <div className="flex flex-1 flex-col gap-[22px] overflow-y-auto px-5 pb-[18px] pt-[22px]">
        <HealthScoreGauge score={country.health_score} label={country.health_label} />

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <StatTile label="GDP" value={`$${(country.gdp / 1e12).toFixed(2)}T`} />
            <StatTile label="GDP per capita" value={`$${Math.round(country.gdp_per_capita).toLocaleString()}`} />
            <StatTile label="Inflation (YoY)" value={`${country.inflation.toFixed(1)}%`} />
            <StatTile
              label="10Y bond yield"
              value={country.bond_yield_10y == null ? '—' : `${country.bond_yield_10y.toFixed(2)}%`}
            />
          </div>
          <div className="flex items-center justify-between rounded-[10px] bg-slate-800 px-3.5 py-3">
            <div className="flex flex-col gap-1">
              <span className="text-[11.5px] text-slate-400">
                Currency{country.fx_pair ? ` · ${country.fx_pair}` : ''}
              </span>
              <span className="text-lg font-bold text-white">
                {country.fx_rate == null ? '—' : country.fx_rate.toFixed(2)}
              </span>
            </div>
            {country.fx_change_pct != null && (
              <div className="flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path d={fxUp ? 'M5 1l4 6H1z' : 'M5 9L1 3h8z'} fill={fxUp ? '#0ca30c' : '#d03b3b'} />
                </svg>
                <span className="text-[12.5px] font-semibold" style={{ color: fxUp ? '#0ca30c' : '#d03b3b' }}>
                  {fxUp ? '+' : ''}
                  {country.fx_change_pct.toFixed(1)}% today
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowComparePicker((s) => !s)}
            className="flex items-center justify-between rounded-[10px] border border-white/[0.14] px-3.5 py-[11px] hover:bg-white/[0.05] hover:border-white/[0.22]"
          >
            <div className="flex items-center gap-2.5">
              <CompareIcon />
              <span className="text-[13.5px] font-semibold text-slate-200">Compare to another country</span>
            </div>
            <svg
              width="11"
              height="11"
              viewBox="0 0 11 11"
              fill="none"
              style={{ transform: showComparePicker ? 'rotate(180deg)' : undefined }}
            >
              <path d="M2 4l3.5 3.5L9 4" stroke="#64748b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {showComparePicker && (
            <CountryPickerList
              excludeCodes={[country.country_code]}
              onSelect={(c) => {
                onCompare(c)
                setShowComparePicker(false)
              }}
            />
          )}
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
          {chartData.length > 0 ? (
            <div className="relative">
              <MetricChart data={chartData} formatValue={activeTab.format} />
              <div className="pointer-events-none absolute right-1 top-0 rounded-md border border-white/[0.12] bg-slate-800 px-2.5 py-1 text-xs font-bold text-white">
                {activeTab.format(latestValue)}
              </div>
            </div>
          ) : (
            <div className="flex h-[150px] items-center justify-center text-sm text-slate-600">
              No {activeTab.label.toLowerCase()} data available for {country.country_name}
            </div>
          )}
        </div>

        <AISummary countryCode={country.country_code} />
      </div>

      {/* sticky chat footer */}
      <div className="flex flex-none flex-col gap-2.5 border-t border-white/[0.07] bg-slate-900 px-5 pb-[18px] pt-3.5">
        {messages.length > 0 && (
          <div className="flex max-h-[120px] flex-col gap-1.5 overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  'max-w-[85%] rounded-lg px-2.5 py-1.5 text-[12.5px] ' +
                  (m.role === 'user'
                    ? 'self-end bg-[#3987e5]/[0.18] text-slate-100'
                    : 'self-start bg-slate-800 text-slate-300')
                }
              >
                {m.text}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          {country.suggested_questions.map((q) => (
            <button
              key={q}
              onClick={() => askQuestion(q)}
              className="whitespace-nowrap rounded-full border border-white/[0.14] px-2.5 py-1.5 text-xs text-slate-400 hover:border-white/[0.28] hover:text-white"
            >
              {q}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            askQuestion(draft)
          }}
          className="flex items-center gap-2 rounded-full border border-white/[0.1] bg-slate-800 py-1.5 pl-4 pr-1.5"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Ask about ${country.country_name}'s economy...`}
            className="flex-1 bg-transparent text-[13.5px] text-slate-200 outline-none placeholder:text-slate-500"
          />
          <button
            type="submit"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#3987e5] hover:bg-[#5aa0ee]"
            aria-label="Send"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h9M7 3l4 4-4 4" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
