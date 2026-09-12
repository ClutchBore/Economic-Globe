import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function ScatterTooltip({ active, payload, formatX, formatY }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-none border border-white/10 bg-slate-800 px-2.5 py-1.5 text-xs">
      <div className="mb-0.5 font-semibold text-white">{point.country_name}</div>
      <div className="text-slate-400">X: {formatX(point.x)}</div>
      <div className="text-slate-400">Y: {formatY(point.y)}</div>
    </div>
  )
}

export default function CorrelationScatter({ pairs, formatX, formatY }) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="x"
            type="number"
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickFormatter={formatX}
          />
          <YAxis
            dataKey="y"
            type="number"
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickFormatter={formatY}
            width={54}
          />
          <Tooltip content={<ScatterTooltip formatX={formatX} formatY={formatY} />} cursor={{ stroke: 'rgba(255,255,255,0.15)' }} />
          <Scatter data={pairs} fill="#3987e5" fillOpacity={0.75} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
