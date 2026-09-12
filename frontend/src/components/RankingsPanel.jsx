import { useEffect, useState } from 'react'
import { fetchRankings } from '../data/api'
import { metricTabs } from '../data/metricTabs'

export default function RankingsPanel({ onClose, onSelectCountry }) {
  const [activeMetric, setActiveMetric] = useState(metricTabs[0].key)
  const [state, setState] = useState({ status: 'loading', data: null, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', data: null, error: null })

    fetchRankings(activeMetric)
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data, error: null })
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', data: null, error: err.detail ?? err.message })
      })

    return () => {
      cancelled = true
    }
  }, [activeMetric])

  const activeTab = metricTabs.find((t) => t.key === activeMetric)

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex h-full max-h-[640px] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-none items-center justify-between border-b border-white/[0.07] px-5 py-[18px]">
          <span className="text-[17px] font-bold text-white">Rankings</span>
          <button
            onClick={onClose}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.08]"
            aria-label="Close rankings"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M1 1l13 13M14 1L1 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-none flex-wrap gap-1.5 px-5 pt-4">
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

        <div className="flex flex-1 flex-col overflow-y-auto px-5 py-4">
          {state.status === 'loading' && <p className="text-sm text-slate-500">Loading rankings…</p>}
          {state.status === 'error' && <p className="text-sm text-slate-500">{state.error}</p>}
          {state.status === 'ready' && (
            <div className="flex flex-col gap-1">
              {state.data.rankings.map((row) => (
                <button
                  key={row.country_code}
                  onClick={() => onSelectCountry(row.country_code)}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/[0.05]"
                >
                  <span className="w-6 flex-none text-right text-[12.5px] font-semibold text-slate-500">
                    {row.rank}
                  </span>
                  <span className="flex-1 text-[13.5px] text-slate-200">{row.country_name}</span>
                  <span className="text-[13.5px] font-semibold text-white">{activeTab.format(row.value)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {state.status === 'ready' && (
          <div className="flex-none border-t border-white/[0.07] px-5 py-3">
            <p className="text-[11px] text-slate-600">{state.data.note}</p>
          </div>
        )}
      </div>
    </div>
  )
}
