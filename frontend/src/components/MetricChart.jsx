import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

function ChartTooltip({ active, payload, label, formatValue }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-white/10 bg-slate-800 px-2.5 py-1.5 text-xs">
      <div className="text-slate-500">{label}</div>
      <div className="font-semibold text-white">{formatValue(payload[0].value)}</div>
    </div>
  )
}

export default function MetricChart({ data, formatValue }) {
  return (
    <div className="h-[150px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3987e5" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#3987e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="year"
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
          />
          <Tooltip content={<ChartTooltip formatValue={formatValue} />} cursor={{ stroke: 'rgba(255,255,255,0.15)' }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3987e5"
            strokeWidth={2.5}
            fill="url(#lineFill)"
            dot={false}
            activeDot={{ r: 4, fill: '#0f172a', stroke: '#3987e5', strokeWidth: 2.5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
