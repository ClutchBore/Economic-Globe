import { useEffect, useMemo, useRef, useState } from 'react'
import GlobeGL from 'react-globe.gl'
import * as THREE from 'three'

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
    getValue: (c) => (c.gdp == null ? null : Math.log10(c.gdp)),
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

function mix(a, b, t) {
  const r = Math.round(a[0] + (b[0] - a[0]) * t)
  const g = Math.round(a[1] + (b[1] - a[1]) * t)
  const bl = Math.round(a[2] + (b[2] - a[2]) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// Some metrics are only meaningful for a subset of countries (bond_yield_10y is US-only in
// the real dataset; fx_rate/fx_change_pct are null for the US, the FX base currency) — a null
// value means "not covered by this metric", not zero, so it's treated the same as an
// uncovered country rather than plotted at the low end of the scale.
function colorForMetric(metric, ranges, country) {
  const value = country ? metric.getValue(country) : null
  if (value == null) return UNCOVERED_COLOR

  const range = ranges[metric.key]
  if (metric.scale === 'diverging') {
    const t = clamp(value / range.maxAbs, -1, 1)
    return t >= 0 ? mix(DIV_NEUTRAL, DIV_POSITIVE, t) : mix(DIV_NEUTRAL, DIV_NEGATIVE, -t)
  }
  const { min, max } = range
  const t = max === min ? 0.5 : clamp((value - min) / (max - min), 0, 1)
  const [low, high] = metric.ramp
  return mix(low, high, t)
}

function angularDistanceDeg(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const dLng = toRad(b.lng - a.lng)
  const cosD = Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (Math.acos(Math.max(-1, Math.min(1, cosD))) * 180) / Math.PI
}

export default function Globe({ countries, geojsonFeatures, onSelectCountry, spinning, rightInset = 0, arcCountries = null }) {
  const globeRef = useRef()
  const containerRef = useRef()
  const hoveredCountryRef = useRef(null)
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [activeMetricKey, setActiveMetricKey] = useState('gdp')
  const activeMetric = METRICS.find((m) => m.key === activeMetricKey)

  const byCode = useMemo(() => Object.fromEntries(countries.map((c) => [c.country_code, c])), [countries])

  // Per metric, the range of its non-null values across all loaded countries — computed live
  // since the country set now comes from the backend rather than a fixed mock list.
  const ranges = useMemo(
    () =>
      Object.fromEntries(
        METRICS.map((m) => {
          const values = countries.map(m.getValue).filter((v) => v != null)
          return [
            m.key,
            m.scale === 'diverging'
              ? { maxAbs: Math.max(...values.map(Math.abs)) || 1 }
              : { min: Math.min(...values), max: Math.max(...values) },
          ]
        })
      ),
    [countries]
  )

  const size = {
    width: Math.max(320, windowSize.width - rightInset),
    height: windowSize.height,
  }

  // ResizeObserver rather than a window 'resize' listener — the container's actual box size can
  // change (devtools device toolbar, orientation change, viewport emulation) without the browser
  // ever firing a 'resize' event, which would leave the WebGL renderer's internal size stale and
  // throw off raycasting (clicks landing on the wrong world position) even though CSS layout looks fine.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setWindowSize({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const controls = globeRef.current?.controls()
    if (controls) controls.autoRotate = spinning
  }, [spinning])

  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return
    globe.pointOfView({ lat: 25, lng: 15, altitude: 2.1 }, 0)
    globe.controls().autoRotateSpeed = 0.35
  }, [])

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

  const globeMaterial = useMemo(() => new THREE.MeshPhongMaterial({ color: '#0f172a' }), [])

  const arcsData = useMemo(() => {
    if (!arcCountries) return []
    const [a, b] = arcCountries
    return [{ startLat: a.lat, startLng: a.lng, endLat: b.lat, endLng: b.lng }]
  }, [arcCountries])

  function selectCountry(country) {
    if (!country) return
    globeRef.current.controls().autoRotate = false
    onSelectCountry(country)
  }

  // react-globe.gl's own onPolygonClick can silently miss the first click on a given polygon
  // (the raycasted click and its internal hover cache can land a frame apart). onPolygonHover
  // fires reliably and immediately, so we track the hovered country ourselves and select it on
  // a plain native click instead of trusting the built-in click handler.
  function handleClick() {
    selectCountry(hoveredCountryRef.current)
  }

  return (
    <div ref={containerRef} className="h-screen w-screen" onClick={handleClick}>
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
        polygonsData={geojsonFeatures}
        polygonCapColor={(feature) => colorForMetric(activeMetric, ranges, byCode[feature.properties.ISO_A3])}
        polygonSideColor={() => 'rgba(15,23,42,0.6)'}
        polygonStrokeColor={() => 'rgba(255,255,255,0.15)'}
        polygonAltitude={(feature) => (byCode[feature.properties.ISO_A3] ? 0.02 : 0.006)}
        polygonLabel={(feature) => {
          const country = byCode[feature.properties.ISO_A3]
          if (!country) return `<div style="font-size:12px;">${feature.properties.NAME}</div>`
          const value = activeMetric.getValue(country)
          const valueText = value == null ? 'No data' : activeMetric.format(country)
          return `<div style="font:600 13px system-ui; background:#1e293b; color:#fff; padding:6px 9px; border-radius:6px; border:1px solid rgba(255,255,255,0.12);">
            ${country.country_name}<br/>
            <span style="color:#94a3b8; font-weight:400;">${activeMetric.label}: ${valueText}</span>
          </div>`
        }}
        onPolygonHover={(feature) => {
          const country = feature ? byCode[feature.properties.ISO_A3] : null
          hoveredCountryRef.current = country
          document.body.style.cursor = country ? 'pointer' : 'default'
        }}
        onPolygonClick={(feature) => selectCountry(byCode[feature.properties.ISO_A3])}
      />

      <div
        className="pointer-events-none absolute top-24 flex max-w-[92%] flex-wrap justify-center gap-1.5 sm:top-7"
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
              <span>-{ranges[activeMetric.key].maxAbs.toFixed(1)}%</span>
              <span>+{ranges[activeMetric.key].maxAbs.toFixed(1)}%</span>
            </>
          ) : (
            <>
              <span>{activeMetric.format(countries.find((c) => activeMetric.getValue(c) === ranges[activeMetric.key].min))}</span>
              <span>{activeMetric.format(countries.find((c) => activeMetric.getValue(c) === ranges[activeMetric.key].max))}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
