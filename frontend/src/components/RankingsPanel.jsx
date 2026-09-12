import { useEffect, useState } from 'react'
import { fetchRankings, fetchMarketHealth, fetchMovers, fetchTrends, fetchTimeline, fetchCorrelation } from '../data/api'
import { isNumber, metricTabs, missingValue } from '../data/metricTabs'
import CorrelationScatter from './CorrelationScatter'
import TimelineChart from './TimelineChart'

const VIEW_MODES = [
  { key: 'rankings', label: 'Rankings' },
  { key: 'health', label: 'Market Health' },
  { key: 'movers', label: 'Movers' },
  { key: 'correlations', label: 'Correlations' },
  { key: 'timeline', label: 'Timeline' },
]

const TIMELINE_COUNTRY_CAP = 8

function ChangeArrow({ direction }) {
  const up = direction === 'up'
  return (
    <svg width="9" height="9" viewBox="0 0 10 10">
      <path d={up ? 'M5 1l4 6H1z' : 'M5 9L1 3h8z'} fill={up ? '#0ca30c' : '#d03b3b'} />
    </svg>
  )
}

function formatFor(metricKey) {
  return metricTabs.find((t) => t.key === metricKey)?.format ?? ((v) => v)
}

export default function RankingsPanel({ onClose, onSelectCountry }) {
  const [mode, setMode] = useState('rankings')
  const [activeMetric, setActiveMetric] = useState(metricTabs[0].key)
  const [trendWindow, setTrendWindow] = useState(null) // null = latest change (movers), else N-year trend
  const [metricX, setMetricX] = useState('gdp_per_capita')
  const [metricY, setMetricY] = useState('inflation')
  // `mode` rides along inside state so a render always knows which shape `data` is in —
  // `mode` itself updates synchronously on click, one render before the effect below resets
  // `state`, and that render would otherwise read e.g. market-health fields off rankings data.
  const [state, setState] = useState({ status: 'loading', data: null, error: null, mode })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', data: null, error: null, mode })

    const request =
      mode === 'health' ? fetchMarketHealth()
      : mode === 'movers' && trendWindow
        ? fetchTrends(activeMetric, trendWindow).then((d) => ({
            ...d,
            movers: d.trends.map((row) => ({ ...row, latest_value: row.end_value })),
          }))
      : mode === 'movers' ? fetchMovers(activeMetric, 8)
      : mode === 'correlations' ? fetchCorrelation(metricX, metricY)
      : mode === 'timeline' ? fetchTimeline(activeMetric)
      : fetchRankings(activeMetric)

    request
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data, error: null, mode })
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', data: null, error: err.detail ?? err.message, mode })
      })

    return () => {
      cancelled = true
    }
  }, [mode, activeMetric, trendWindow, metricX, metricY])

  const showMetricTabs = mode === 'rankings' || mode === 'movers' || mode === 'timeline'

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-white/70 p-4" onClick={onClose}>
      <div
        className="flex h-full max-h-[640px] w-full max-w-[480px] flex-col overflow-hidden rounded-none border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-none items-center justify-between border-b border-slate-200 px-5 py-[18px]">
          <span className="text-[17px] font-bold text-slate-950">Rankings</span>
          <button
            onClick={onClose}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-none text-slate-500 hover:bg-slate-100"
            aria-label="Close rankings"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M1 1l13 13M14 1L1 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-none flex-wrap gap-1 px-5 pt-4">
          {VIEW_MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={
                'rounded-none px-2.5 py-1.5 text-[12px] font-semibold transition-colors ' +
                (m.key === mode
                  ? 'bg-slate-200 text-slate-950'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700')
              }
            >
              {m.label}
            </button>
          ))}
        </div>

        {showMetricTabs && (
          <div className="flex flex-none items-center gap-2 px-5 pt-3">
            <label htmlFor="rankings-metric" className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
              Metric
            </label>
            <select
              id="rankings-metric"
              value={activeMetric}
              onChange={(e) => setActiveMetric(e.target.value)}
              className="min-w-0 flex-1 rounded-none border border-slate-300 bg-slate-100 px-3 py-2 text-[13px] font-semibold text-slate-800 outline-none transition-colors hover:border-slate-500 focus:border-slate-500"
            >
              {metricTabs.map((tab) => (
                <option key={tab.key} value={tab.key}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {mode === 'movers' && (
          <div className="flex flex-none gap-1.5 px-5 pt-2.5">
            {[
              { key: null, label: 'Latest change' },
              { key: 3, label: '3-year trend' },
            ].map((opt) => (
              <button
                key={String(opt.key)}
                onClick={() => setTrendWindow(opt.key)}
                className={
                  'rounded-none px-2.5 py-1 text-[11.5px] font-semibold transition-colors ' +
                  (trendWindow === opt.key
                    ? 'bg-slate-100 text-slate-800'
                    : 'text-slate-500 hover:text-slate-700')
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {mode === 'correlations' && (
          <div className="flex flex-none items-center gap-2 px-5 pt-3">
            <select
              value={metricX}
              onChange={(e) => setMetricX(e.target.value)}
              className="rounded-none border border-slate-300 bg-slate-100 px-2 py-1.5 text-xs text-slate-800 outline-none"
            >
              {metricTabs.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">vs</span>
            <select
              value={metricY}
              onChange={(e) => setMetricY(e.target.value)}
              className="rounded-none border border-slate-300 bg-slate-100 px-2 py-1.5 text-xs text-slate-800 outline-none"
            >
              {metricTabs.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-y-auto px-5 py-4">
          {state.status === 'loading' && <p className="text-sm text-slate-500">Loading…</p>}
          {state.status === 'error' && <p className="text-sm text-slate-500">{state.error}</p>}

          {state.status === 'ready' && state.mode === 'rankings' && (
            <div className="flex flex-col gap-1">
              {state.data.rankings.map((row) => (
                <button
                  key={row.country_code}
                  onClick={() => onSelectCountry(row.country_code)}
                  className="flex items-center gap-3 rounded-none px-2 py-2 text-left hover:bg-slate-100"
                >
                  <span className="w-6 flex-none text-right text-[12.5px] font-semibold text-slate-500">
                    {row.rank}
                  </span>
                  <span className="flex-1 text-[13.5px] text-slate-800">{row.country_name}</span>
                  <span className="text-[13.5px] font-semibold text-slate-950">
                    {formatFor(state.data.metric)(row.value)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {state.status === 'ready' && state.mode === 'health' && (
            <div className="flex flex-col gap-1">
              {state.data.rankings.map((row) => (
                <button
                  key={row.country_code}
                  onClick={() => onSelectCountry(row.country_code)}
                  className="flex items-center gap-3 rounded-none px-2 py-2 text-left hover:bg-slate-100"
                >
                  <span className="w-6 flex-none text-right text-[12.5px] font-semibold text-slate-500">
                    {row.rank}
                  </span>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-[13.5px] text-slate-800">{row.country_name}</span>
                    {(row.missing_components ?? []).length > 0 && (
                      <span className="text-[10.5px] text-slate-500">
                        Based on available data — missing {row.missing_components.join(', ')}
                      </span>
                    )}
                  </div>
                  <span className="text-[13.5px] font-semibold text-slate-950">
                    {isNumber(row.score) ? row.score.toFixed(1) : missingValue}
                  </span>
                </button>
              ))}
            </div>
          )}

          {state.status === 'ready' && state.mode === 'movers' && (
            <div className="flex flex-col gap-1">
              {state.data.movers.map((row, i) => (
                <button
                  key={row.country_code}
                  onClick={() => onSelectCountry(row.country_code)}
                  className="flex items-center gap-3 rounded-none px-2 py-2 text-left hover:bg-slate-100"
                >
                  <span className="w-6 flex-none text-right text-[12.5px] font-semibold text-slate-500">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-[13.5px] text-slate-800">{row.country_name}</span>
                  <span className="text-[12.5px] text-slate-500">
                    {formatFor(state.data.metric)(row.latest_value)}
                  </span>
                  <div className="flex w-[62px] flex-none items-center justify-end gap-1.5">
                    <ChangeArrow direction={row.direction} />
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: row.direction === 'up' ? '#0ca30c' : '#d03b3b' }}
                    >
                      {isNumber(row.percent_change)
                        ? `${row.direction === 'up' ? '+' : ''}${row.percent_change.toFixed(1)}%`
                        : missingValue}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {state.status === 'ready' && state.mode === 'correlations' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Coefficient', value: state.data.coefficient.toFixed(2) },
                  { label: 'Strength', value: state.data.strength },
                  { label: 'Direction', value: state.data.direction },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col gap-0.5 rounded-none bg-slate-100 px-3 py-2">
                    <span className="text-[10.5px] text-slate-500">{s.label}</span>
                    <span className="text-[13.5px] font-semibold capitalize text-slate-950">{s.value}</span>
                  </div>
                ))}
              </div>
              <CorrelationScatter
                pairs={state.data.pairs.map((p) => ({
                  ...p,
                  x: p[state.data.metric_x],
                  y: p[state.data.metric_y],
                }))}
                formatX={formatFor(state.data.metric_x)}
                formatY={formatFor(state.data.metric_y)}
              />
            </div>
          )}

          {state.status === 'ready' && state.mode === 'timeline' && (() => {
            const ranked = [...state.data.countries].sort((a, b) => {
              const av = Object.values(a.values).filter((v) => v != null).pop() ?? -Infinity
              const bv = Object.values(b.values).filter((v) => v != null).pop() ?? -Infinity
              return bv - av
            })
            const top = ranked.slice(0, TIMELINE_COUNTRY_CAP)
            return (
              <div className="flex flex-col gap-2">
                {ranked.length > TIMELINE_COUNTRY_CAP && (
                  <p className="text-[11px] text-slate-500">
                    Showing the top {TIMELINE_COUNTRY_CAP} of {ranked.length} countries by latest value.
                  </p>
                )}
                <TimelineChart
                  years={state.data.years}
                  series={top.map((c) => ({ code: c.country_code, name: c.country_name, values: c.values }))}
                  formatValue={formatFor(state.data.metric)}
                />
              </div>
            )
          })()}
        </div>

        {state.status === 'ready' && state.data.note && (
          <div className="flex-none border-t border-slate-200 px-5 py-3">
            <p className="text-[11px] text-slate-500">{state.data.note}</p>
          </div>
        )}
      </div>
    </div>
  )
}
