const RADIUS = 78
const STROKE = 14
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const ARC_FRACTION = 0.75 // 270° gauge, gap at the bottom
const ARC_LENGTH = CIRCUMFERENCE * ARC_FRACTION
const GAP_LENGTH = CIRCUMFERENCE - ARC_LENGTH

const BANDS = [
  { max: 45, color: '#d03b3b', label: 'Weak' },
  { max: 69, color: '#fab219', label: 'Moderate' },
  { max: 101, color: '#0ca30c', label: 'Strong' },
]

function bandFor(score) {
  return BANDS.find((b) => score < b.max) ?? BANDS[BANDS.length - 1]
}

export default function HealthScoreGauge({ score, label, showLabel = true }) {
  const clamped = Math.max(0, Math.min(100, score))
  const filled = (clamped / 100) * ARC_LENGTH
  const band = bandFor(clamped)
  const statusLabel = label ?? band.label

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width={188} height={188} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#d03b3b" />
            <stop offset="35%" stopColor="#ec835a" />
            <stop offset="62%" stopColor="#fab219" />
            <stop offset="100%" stopColor="#0ca30c" />
          </linearGradient>
        </defs>
        <circle
          cx={100}
          cy={100}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${ARC_LENGTH} ${GAP_LENGTH}`}
          transform="rotate(-225 100 100)"
        />
        <circle
          cx={100}
          cy={100}
          r={RADIUS}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${CIRCUMFERENCE - filled}`}
          transform="rotate(-225 100 100)"
          style={{ transition: 'stroke-dasharray 400ms ease' }}
        />
        <text x="100" y="98" textAnchor="middle" fontSize="42" fontWeight="700" fill="#ffffff">
          {Math.round(clamped)}
        </text>
        <text x="100" y="120" textAnchor="middle" fontSize="13" fill="#64748b">
          out of 100
        </text>
        <text x="100" y="150" textAnchor="middle" fontSize="14" fontWeight="600" fill={band.color}>
          {statusLabel}
        </text>
      </svg>
      {showLabel && <span className="text-xs tracking-wide text-slate-500">COMPOSITE MARKET HEALTH SCORE</span>}
    </div>
  )
}
