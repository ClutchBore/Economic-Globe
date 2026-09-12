import { useEffect, useRef, useState } from 'react'
import HealthScoreGauge from './HealthScoreGauge'
import MetricChart from './MetricChart'
import CountryPickerList from './CountryPickerList'
import AISummary from './AISummary'
import AnomalyCallout from './AnomalyCallout'
import { isNumber, metricTabs, missingValue } from '../data/metricTabs'
import { streamChat } from '../data/api'

function StatTile({ label, value }) {
  return (
    <div className="flex flex-col gap-1 rounded-none bg-slate-100 px-3 py-2">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-[15px] font-bold text-slate-950">{value}</span>
    </div>
  )
}

function fmtNumber(value, digits = 2) {
  return isNumber(value) ? value.toFixed(digits) : missingValue
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
  const [isStreaming, setIsStreaming] = useState(false)
  const [showComparePicker, setShowComparePicker] = useState(false)
  const abortRef = useRef(null)

  // Cancel any in-flight stream if the panel unmounts mid-answer (closing it, or switching
  // countries — CountryPanel is remounted per country via its key, so this covers both).
  useEffect(() => () => abortRef.current?.abort(), [])

  const activeTab = metricTabs.find((t) => t.key === activeMetric)
  const chartData = country.history?.[activeMetric] ?? []
  const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].value : null
  const fxUp = isNumber(country.fx_change_pct) && country.fx_change_pct > 0

  function appendToLastMessage(deltaText) {
    setMessages((prev) => {
      const next = [...prev]
      const last = next[next.length - 1]
      next[next.length - 1] = { ...last, text: last.text + deltaText }
      return next
    })
  }

  function setLastMessageText(text) {
    setMessages((prev) => {
      const next = [...prev]
      next[next.length - 1] = { ...next[next.length - 1], text }
      return next
    })
  }

  async function askQuestion(question) {
    const trimmed = question.trim()
    if (!trimmed || isStreaming) return

    const history = messages
      .filter((m) => m.text?.trim())
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.text.trim() }))
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }, { role: 'assistant', text: '' }])
    setDraft('')
    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      await streamChat(country.country_code, trimmed, history, {
        signal: controller.signal,
        selectedMetric: activeMetric,
        onDelta: appendToLastMessage,
      })
    } catch (err) {
      if (err.name !== 'AbortError') {
        setLastMessageText(err.detail ?? 'Country chat is temporarily unavailable. Please retry.')
      }
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-none border-0 bg-white shadow-2xl sm:w-[452px] sm:rounded-none sm:border sm:border-slate-200">
      {/* header */}
      <div className="flex flex-none items-center justify-between border-b border-slate-200 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-none border border-slate-300 bg-slate-100 text-xs font-semibold text-slate-500">
            {country.country_code.slice(0, 2)}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[17px] font-bold leading-tight text-slate-950">{country.country_name}</span>
            <span className="text-xs text-slate-500">
              {country.country_code} · {country.region} · data as of {country.data_as_of ?? missingValue}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-none text-slate-500 hover:bg-slate-100"
          aria-label="Close panel"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M1 1l13 13M14 1L1 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* scrollable content */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-3 pt-3">
        <HealthScoreGauge score={country.health_score} label={country.health_label} />

        {country.is_placeholder && (
          <div className="rounded-none border border-slate-200 bg-slate-100/70 px-3 py-2 text-[12px] leading-relaxed text-slate-500">
            Country profile is available, but detailed economic metrics have not been fetched yet.
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            {metricTabs.map((metric) => (
              <StatTile
                key={metric.key}
                label={metric.label}
                value={metric.format(country[metric.key])}
              />
            ))}
          </div>
          <div className="flex items-center justify-between rounded-none bg-slate-100 px-3 py-2">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-500">
                Currency{country.fx_pair ? ` · ${country.fx_pair}` : ''}
              </span>
              <span className="text-[15px] font-bold text-slate-950">
                {fmtNumber(country.fx_rate)}
              </span>
            </div>
            {isNumber(country.fx_change_pct) && (
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

        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => setShowComparePicker((s) => !s)}
            className="flex items-center justify-between rounded-none border border-slate-300 px-3 py-2 hover:bg-slate-100 hover:border-slate-500"
          >
            <div className="flex items-center gap-2.5">
              <CompareIcon />
              <span className="text-[13px] font-semibold text-slate-800">Compare to another country</span>
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

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="country-chart-metric" className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
              Chart
            </label>
            <select
              id="country-chart-metric"
              value={activeMetric}
              onChange={(e) => setActiveMetric(e.target.value)}
              className="min-w-0 flex-1 rounded-none border border-slate-300 bg-slate-100 px-3 py-1.5 text-[12.5px] font-semibold text-slate-800 outline-none transition-colors hover:border-slate-500 focus:border-slate-500"
            >
              {metricTabs.map((tab) => (
                <option key={tab.key} value={tab.key}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
          {chartData.length > 0 ? (
            <div className="relative">
              <MetricChart data={chartData} formatValue={activeTab.format} />
              <div className="pointer-events-none absolute right-1 top-0 rounded-none border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-950">
                {activeTab.format(latestValue)}
              </div>
            </div>
          ) : (
            <div className="flex h-[110px] items-center justify-center text-sm text-slate-500">
              No {activeTab.label.toLowerCase()} data available for {country.country_name}
            </div>
          )}
        </div>

        <AnomalyCallout metric={activeMetric} metricLabel={activeTab.label} countryCode={country.country_code} />

        <AISummary countryCode={country.country_code} />
      </div>

      {/* sticky chat footer */}
      <div className="flex flex-none flex-col gap-2 border-t border-slate-200 bg-white px-5 pb-4 pt-3">
        {messages.length > 0 && (
          <div className="flex max-h-[220px] min-h-[120px] flex-col gap-1.5 overflow-y-auto">
            {messages.map((m, i) => {
              const isStreamingReply = isStreaming && i === messages.length - 1 && m.role === 'assistant'
              return (
                <div
                  key={i}
                  className={
                    'max-w-[90%] rounded-none px-3 py-2 text-[13px] ' +
                    (m.role === 'user'
                      ? 'self-end bg-slate-200 text-slate-950'
                      : 'self-start bg-slate-100 text-slate-700')
                  }
                >
                  {m.text || (isStreamingReply && <span className="italic text-slate-500">Thinking…</span>)}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex gap-2">
          {(country.suggested_questions ?? []).map((q) => (
            <button
              key={q}
              onClick={() => askQuestion(q)}
              disabled={isStreaming}
              className="whitespace-nowrap rounded-none border border-slate-300 px-2 py-1 text-[11.5px] text-slate-500 hover:border-slate-500 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-300"
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
          className="flex items-center gap-2 rounded-none border border-slate-300 bg-slate-100 py-1 pl-3 pr-1"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={isStreaming}
            placeholder={isStreaming ? 'Waiting for a response…' : `Ask about ${country.country_name}'s economy...`}
            className="flex-1 bg-transparent text-[13.5px] text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming}
            className="flex h-7 w-7 flex-none items-center justify-center rounded-none bg-slate-200 hover:bg-slate-300 disabled:cursor-not-allowed disabled:bg-slate-200"
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
