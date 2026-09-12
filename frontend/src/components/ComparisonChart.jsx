import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

function ChartTooltip({ active, payload, label, formatValue, nameA, nameB }) {
  if (!active || !payload?.length) return null
  const a = payload.find((p) => p.dataKey === 'a')
  const b = payload.find((p) => p.dataKey === 'b')
  return (
    <div className="rounded-none border border-white/10 bg-slate-800 px-2.5 py-1.5 text-xs">
      <div className="mb-1 text-slate-500">{label}</div>
      {a && (
        <div className="font-semibold text-[#7db3f2]">
          {nameA}: {formatValue(a.value)}
        </div>
      )}
      {b && (
        <div className="font-semibold text-[#f0b184]">
          {nameB}: {formatValue(b.value)}
        </div>
      )}
    </div>
  )
}

export default function ComparisonChart({ data, formatValue, nameA, nameB }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-none bg-[#3987e5]" />
          <span className="text-xs text-slate-400">{nameA}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-none bg-[#eb6834]" />
          <span className="text-xs text-slate-400">{nameB}</span>
        </div>
      </div>
      <div className="h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
            <XAxis
              dataKey="year"
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <Tooltip
              content={<ChartTooltip formatValue={formatValue} nameA={nameA} nameB={nameB} />}
              cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
            />
            <Line
              type="monotone"
              dataKey="a"
              stroke="#3987e5"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#0f172a', stroke: '#3987e5', strokeWidth: 2.5 }}
            />
            <Line
              type="monotone"
              dataKey="b"
              stroke="#eb6834"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#0f172a', stroke: '#eb6834', strokeWidth: 2.5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
