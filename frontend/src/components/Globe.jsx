import { useEffect, useMemo, useRef, useState } from 'react'
import GlobeGL from 'react-globe.gl'
import * as THREE from 'three'
import { mockCountries } from '../data/mockCountries'

const BY_CODE = Object.fromEntries(mockCountries.map((c) => [c.country_code, c]))
const UNCOVERED_COLOR = '#1e293b'

const DIV_NEGATIVE = [208, 59, 59] // #d03b3b
const DIV_NEUTRAL = [71, 85, 105] // slate-600
const DIV_POSITIVE = [57, 135, 229] // #3987e5

const METRICS = [
  {
    key: 'gdp',
    label: 'GDP',
    scale: 'sequential',
    ramp: [[153, 246, 228], [17, 94, 89]], // teal: #99f6e4 -> #115e59
    accent: [45, 212, 191], // teal-400
    getValue: (c) => Math.log10(c.gdp),
    format: (c) => `$${(c.gdp / 1e12).toFixed(2)}T`,
  },
  {
    key: 'inflation',
    label: 'Inflation',
    scale: 'sequential',
    ramp: [[233, 213, 255], [107, 33, 168]], // purple: #e9d5ff -> #6b21a8
    accent: [192, 132, 252], // purple-400
    getValue: (c) => c.inflation,
    format: (c) => `${c.inflation.toFixed(1)}%`,
  },
  {
    key: 'bond_yield_10y',
    label: 'Bond yield',
    scale: 'sequential',
    ramp: [[253, 230, 138], [146, 64, 14]], // amber: #fde68a -> #92400e
    accent: [251, 191, 36], // amber-400
    getValue: (c) => c.bond_yield_10y,
    format: (c) => `${c.bond_yield_10y.toFixed(2)}%`,
  },
  {
    key: 'fx_rate',
    label: 'Currency',
    scale: 'diverging',
    accent: DIV_POSITIVE,
    getValue: (c) => c.fx_change_pct,
    format: (c) => `${c.fx_change_pct > 0 ? '+' : ''}${c.fx_change_pct.toFixed(1)}% today`,
  },
]

const RANGES = Object.fromEntries(
  METRICS.map((m) => {
    const values = mockCountries.map(m.getValue)
    return [
      m.key,
      m.scale === 'diverging'
        ? { maxAbs: Math.max(...values.map(Math.abs)) || 1 }
        : { min: Math.min(...values), max: Math.max(...values) },
    ]
  })
)

function mix(a, b, t) {
  const r = Math.round(a[0] + (b[0] - a[0]) * t)
  const g = Math.round(a[1] + (b[1] - a[1]) * t)
  const bl = Math.round(a[2] + (b[2] - a[2]) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

function colorForMetric(metric, country) {
  const range = RANGES[metric.key]
  if (metric.scale === 'diverging') {
    const t = colorForMetric.clamp(country ? metric.getValue(country) / range.maxAbs : 0, -1, 1)
    return t >= 0 ? mix(DIV_NEUTRAL, DIV_POSITIVE, t) : mix(DIV_NEUTRAL, DIV_NEGATIVE, -t)
  }
  const { min, max } = range
  const t = max === min ? 0.5 : colorForMetric.clamp((metric.getValue(country) - min) / (max - min), 0, 1)
  const [low, high] = metric.ramp
  return mix(low, high, t)
}
colorForMetric.clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

function angularDistanceDeg(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const dLng = toRad(b.lng - a.lng)
  const cosD = Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (Math.acos(Math.max(-1, Math.min(1, cosD))) * 180) / Math.PI
}

export default function Globe({ onSelectCountry, spinning, rightInset = 0, arcCountries = null }) {
  const globeRef = useRef()
  // react-globe.gl's own onPolygonClick can silently miss the first click on a given polygon
  // (the raycasted click and its internal hover cache can land a frame apart). onPolygonHover
  // fires reliably and immediately, so we track the hovered country ourselves and select it on
  // a plain native click instead of trusting the built-in click handler.
  const hoveredCountryRef = useRef(null)
  const [countries, setCountries] = useState([])
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [activeMetricKey, setActiveMetricKey] = useState('gdp')
  const activeMetric = METRICS.find((m) => m.key === activeMetricKey)

  // Shrink the globe's render width to the space left of an open panel, rather than always
  // filling the screen — otherwise a selected country can end up hidden behind its own panel.
  const size = {
    width: Math.max(320, windowSize.width - rightInset),
    height: windowSize.height,
  }

  useEffect(() => {
    fetch('/data/countries-110m.geojson')
      .then((res) => res.json())
      .then((geojson) => {
        setCountries(geojson.features.filter((f) => f.properties.ISO_A3 !== 'ATA'))
      })
  }, [])

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const controls = globeRef.current?.controls()
    if (controls) controls.autoRotate = spinning
  }, [spinning])

  // Frame both compared countries so the connecting arc is actually visible, rather than
  // leaving it undiscoverable behind whatever rotation the globe happened to stop at.
  useEffect(() => {
    const globe = globeRef.current
    if (!globe || !arcCountries) return
    const [a, b] = arcCountries
    const angularDeg = angularDistanceDeg(a, b)
    globe.pointOfView(
      {
        lat: (a.lat + b.lat) / 2,
        lng: (a.lng + b.lng) / 2,
        altitude: Math.min(3.2, 1.2 + angularDeg / 60),
      },
      1000
    )
  }, [arcCountries])

  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return
    globe.pointOfView({ lat: 25, lng: 15, altitude: 2.1 }, 0)
    globe.controls().autoRotateSpeed = 0.35
  }, [])

  const globeMaterial = useMemo(() => new THREE.MeshPhongMaterial({ color: '#0f172a' }), [])

  const arcsData = useMemo(() => {
    if (!arcCountries) return []
    const [a, b] = arcCountries
    return [{ startLat: a.lat, startLng: a.lng, endLat: b.lat, endLng: b.lng }]
  }, [arcCountries])

  function handleClick() {
    const country = hoveredCountryRef.current
    if (!country) return
    globeRef.current.controls().autoRotate = false
    onSelectCountry(country)
  }

  return (
    <div className="h-screen w-screen" onClick={handleClick}>
      <GlobeGL
        ref={globeRef}
        width={size.width}
        height={size.height}
        backgroundColor="rgba(0,0,0,0)"
        globeMaterial={globeMaterial}
        showAtmosphere
        atmosphereColor="#3987e5"
        atmosphereAltitude={0.2}
        showGraticules
        arcsData={arcsData}
        arcColor={() => ['#3987e5', '#eb6834']}
        arcAltitudeAutoScale={0.35}
        arcStroke={0.6}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        polygonsData={countries}
        polygonCapColor={(feature) => {
          const country = BY_CODE[feature.properties.ISO_A3]
          return country ? colorForMetric(activeMetric, country) : UNCOVERED_COLOR
        }}
        polygonSideColor={() => 'rgba(15,23,42,0.6)'}
        polygonStrokeColor={() => 'rgba(255,255,255,0.15)'}
        polygonAltitude={(feature) => (BY_CODE[feature.properties.ISO_A3] ? 0.02 : 0.006)}
        polygonLabel={(feature) => {
          const country = BY_CODE[feature.properties.ISO_A3]
          if (!country) return `<div style="font-size:12px;">${feature.properties.NAME}</div>`
          return `<div style="font:600 13px system-ui; background:#1e293b; color:#fff; padding:6px 9px; border-radius:6px; border:1px solid rgba(255,255,255,0.12);">
            ${country.country_name}<br/>
            <span style="color:#94a3b8; font-weight:400;">${activeMetric.label}: ${activeMetric.format(country)}</span>
          </div>`
        }}
        onPolygonHover={(feature) => {
          const country = feature ? BY_CODE[feature.properties.ISO_A3] : null
          hoveredCountryRef.current = country
          document.body.style.cursor = country ? 'pointer' : 'default'
        }}
      />

      {countries.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-sm text-slate-500">Loading globe…</span>
        </div>
      )}

      <div
        className="pointer-events-none absolute top-7 flex gap-1.5"
        style={{ left: size.width / 2, transform: 'translateX(-50%)' }}
      >
        {METRICS.map((metric) => {
          const isActive = metric.key === activeMetricKey
          const [r, g, b] = metric.accent
          const textColor = mix(metric.accent, [255, 255, 255], 0.35)
          return (
            <button
              key={metric.key}
              onClick={(e) => {
                e.stopPropagation()
                setActiveMetricKey(metric.key)
              }}
              className={
                'pointer-events-auto whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ' +
                (isActive ? '' : 'border-white/10 text-slate-400 hover:bg-white/[0.06]')
              }
              style={
                isActive
                  ? {
                      borderColor: `rgba(${r}, ${g}, ${b}, 0.45)`,
                      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.16)`,
                      color: textColor,
                    }
                  : undefined
              }
            >
              {metric.label}
            </button>
          )
        })}
      </div>

      <div className="pointer-events-none absolute bottom-7 left-8 flex flex-col gap-1.5">
        <span className="text-xs text-slate-500">{activeMetric.label}</span>
        <div
          className="h-1.5 w-40 rounded-full"
          style={{
            background:
              activeMetric.scale === 'diverging'
                ? `linear-gradient(to right, rgb(${DIV_NEGATIVE.join(',')}), rgb(${DIV_NEUTRAL.join(',')}), rgb(${DIV_POSITIVE.join(',')}))`
                : `linear-gradient(to right, rgb(${activeMetric.ramp[0].join(',')}), rgb(${activeMetric.ramp[1].join(',')}))`,
          }}
        />
        <div className="flex justify-between text-[11px] text-slate-600">
          {activeMetric.scale === 'diverging' ? (
            <>
              <span>-{RANGES[activeMetric.key].maxAbs.toFixed(1)}%</span>
              <span>+{RANGES[activeMetric.key].maxAbs.toFixed(1)}%</span>
            </>
          ) : (
            <>
              <span>{activeMetric.format(mockCountries.find((c) => activeMetric.getValue(c) === RANGES[activeMetric.key].min))}</span>
              <span>{activeMetric.format(mockCountries.find((c) => activeMetric.getValue(c) === RANGES[activeMetric.key].max))}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
