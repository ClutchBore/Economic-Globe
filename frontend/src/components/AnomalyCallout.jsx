import { useEffect, useState } from 'react'
import { fetchAnomalies, fetchAnomalyExplanation } from '../data/api'

// Deliberately quiet by default (renders nothing) — this only speaks up when there's something
// genuinely noteworthy (a real flagged anomaly) or when the roadmap's specific ask applies
// ("show insufficient history as unavailable analysis, not as no anomalies"). A country with no
// anomaly and no data issue gets no callout at all, rather than a "nothing wrong here" banner.
export default function AnomalyCallout({ metric, metricLabel, countryCode }) {
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    fetchAnomalies(metric)
      .then((data) => {
        if (cancelled) return
        const anomaly = data.anomalies.find((a) => a.country_code === countryCode)
        if (anomaly) {
          setState({ status: 'found', anomaly, explanationStatus: 'loading' })
          fetchAnomalyExplanation({ ...anomaly, threshold: data.threshold, method: data.method })
            .then((res) => {
              if (cancelled) return
              setState((s) => ({ ...s, explanation: res.explanation, isFallback: res.is_fallback, explanationStatus: 'ready' }))
            })
            .catch(() => {
              if (!cancelled) setState((s) => ({ ...s, explanationStatus: 'error' }))
            })
          return
        }
        const skipped = data.skipped.find((s) => s.country_code === countryCode)
        setState(skipped ? { status: 'skipped' } : { status: 'none' })
      })
      .catch(() => {
        // Supplementary content, not core — fail quiet rather than showing an error box here.
        if (!cancelled) setState({ status: 'none' })
      })

    return () => {
      cancelled = true
    }
  }, [metric, countryCode])

  if (state.status === 'loading' || state.status === 'none') return null

  if (state.status === 'skipped') {
    return (
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-xs text-slate-600">
        Anomaly analysis unavailable for {metricLabel} — not enough history for {countryCode}.
      </div>
    )
  }

  const { anomaly } = state
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3.5 py-3">
      <div className="flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L13 12H1L7 1Z" stroke="#fab219" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M7 5.5V8" stroke="#fab219" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="7" cy="10" r="0.75" fill="#fab219" />
        </svg>
        <span className="text-[11.5px] font-bold tracking-wider text-amber-400">
          ANOMALY · {Math.abs(anomaly.z_score).toFixed(1)}σ {anomaly.direction}
        </span>
      </div>
      {state.explanationStatus === 'loading' && <p className="text-[13px] italic text-slate-500">Explaining…</p>}
      {state.explanationStatus === 'error' && (
        <p className="text-[13px] text-slate-500">Explanation unavailable right now.</p>
      )}
      {state.explanationStatus === 'ready' && (
        <p className="text-[13px] leading-[1.5] text-slate-300">{state.explanation}</p>
      )}
    </div>
  )
}
