import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#3987e5', '#eb6834', '#0ca30c', '#d03b3b', '#a855f7', '#14b8a6', '#ec4899', '#eab308']

function TimelineTooltip({ active, payload, label, series, formatValue }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-none border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-xs">
      <div className="mb-1 text-slate-500">{label}</div>
      {payload.map((p) => {
        const s = series.find((s) => s.code === p.dataKey)
        if (p.value == null || !s) return null
        return (
          <div key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
            {s.name}: {formatValue(p.value)}
          </div>
        )
      })}
    </div>
  )
}

// `series` entries: { code, name, values: { [year]: number } }. Capped by the caller to keep
// the chart legible — a full 31-country timeline would be an unreadable tangle of lines.
export default function TimelineChart({ years, series, formatValue }) {
  const data = years.map((year) => {
    const row = { year }
    for (const s of series) row[s.code] = s.values[year] ?? null
    return row
  })

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {series.map((s, i) => (
          <div key={s.code} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-none" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-xs text-slate-500">{s.name}</span>
          </div>
        ))}
      </div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
            <XAxis
              dataKey="year"
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
            />
            <Tooltip
              content={<TimelineTooltip series={series} formatValue={formatValue} />}
              cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
            />
            {series.map((s, i) => (
              <Line
                key={s.code}
                type="monotone"
                dataKey={s.code}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
                activeDot={{ r: 3.5, fill: '#ffffff', stroke: COLORS[i % COLORS.length], strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
