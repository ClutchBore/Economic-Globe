import { useEffect, useState } from 'react'
import { fetchSummary } from '../data/api'

export default function AISummary({ countryCode }) {
  const [state, setState] = useState({ status: 'loading', summary: null, isCached: false, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', summary: null, isCached: false, error: null })

    fetchSummary(countryCode)
      .then((data) => {
        if (cancelled) return
        setState({ status: 'ready', summary: data.summary, isCached: data.is_cached, error: null })
      })
      .catch((err) => {
        if (cancelled) return
        setState({ status: 'error', summary: null, isCached: false, error: err.detail ?? err.message })
      })

    return () => {
      cancelled = true
    }
  }, [countryCode])

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.035] px-4 py-[15px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-[#3987e5]/[0.18]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 0.5l1.2 3.3L10.5 5l-3.3 1.2L6 9.5l-1.2-3.3L1.5 5l3.3-1.2z" fill="#7db3f2" />
            </svg>
          </div>
          <span className="text-[11.5px] font-bold tracking-wider text-slate-400">AI SUMMARY</span>
        </div>
        {state.status === 'ready' && state.isCached && (
          <span className="text-[10.5px] font-semibold text-amber-400">Saved AI summary</span>
        )}
      </div>

      {state.status === 'loading' && <p className="text-[13.5px] italic text-slate-500">Generating summary…</p>}
      {state.status === 'error' && (
        <p className="text-[13.5px] text-slate-500">{state.error ?? 'Summary unavailable right now.'}</p>
      )}
      {state.status === 'ready' && <p className="text-[13.5px] leading-[1.55] text-slate-300">{state.summary}</p>}
    </div>
  )
}
