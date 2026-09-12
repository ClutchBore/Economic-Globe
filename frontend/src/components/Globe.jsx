import { useEffect, useMemo, useRef, useState } from 'react'
import GlobeGL from 'react-globe.gl'
import * as THREE from 'three'
import { mockCountries } from '../data/mockCountries'

const BY_CODE = Object.fromEntries(mockCountries.map((c) => [c.country_code, c]))
const GDP_VALUES = mockCountries.map((c) => Math.log10(c.gdp))
const GDP_MIN = Math.min(...GDP_VALUES)
const GDP_MAX = Math.max(...GDP_VALUES)

const RAMP_LOW = [158, 197, 244] // #9ec5f4
const RAMP_HIGH = [16, 66, 129] // #104281
const UNCOVERED_COLOR = '#1e293b'

function rampColor(t) {
  const clamped = Math.max(0, Math.min(1, t))
  const [r1, g1, b1] = RAMP_LOW
  const [r2, g2, b2] = RAMP_HIGH
  const r = Math.round(r1 + (r2 - r1) * clamped)
  const g = Math.round(g1 + (g2 - g1) * clamped)
  const b = Math.round(b1 + (b2 - b1) * clamped)
  return `rgb(${r}, ${g}, ${b})`
}

function capColorFor(feature) {
  const country = BY_CODE[feature.properties.ISO_A3]
  if (!country) return UNCOVERED_COLOR
  const t = (Math.log10(country.gdp) - GDP_MIN) / (GDP_MAX - GDP_MIN)
  return rampColor(t)
}

export default function Globe({ onSelectCountry }) {
  const globeRef = useRef()
  const [countries, setCountries] = useState([])
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })

  useEffect(() => {
    fetch('/data/countries-110m.geojson')
      .then((res) => res.json())
      .then((geojson) => {
        setCountries(geojson.features.filter((f) => f.properties.ISO_A3 !== 'ATA'))
      })
  }, [])

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return
    globe.pointOfView({ lat: 25, lng: 15, altitude: 2.1 }, 0)
    globe.controls().autoRotate = true
    globe.controls().autoRotateSpeed = 0.35
  }, [])

  const globeMaterial = useMemo(() => new THREE.MeshPhongMaterial({ color: '#0f172a' }), [])

  return (
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
      polygonsData={countries}
      polygonCapColor={capColorFor}
      polygonSideColor={() => 'rgba(15,23,42,0.6)'}
      polygonStrokeColor={() => 'rgba(255,255,255,0.15)'}
      polygonAltitude={(feature) => (BY_CODE[feature.properties.ISO_A3] ? 0.02 : 0.006)}
      polygonLabel={(feature) => {
        const country = BY_CODE[feature.properties.ISO_A3]
        if (!country) return `<div style="font-size:12px;">${feature.properties.NAME}</div>`
        return `<div style="font:600 13px system-ui; background:#1e293b; color:#fff; padding:6px 9px; border-radius:6px; border:1px solid rgba(255,255,255,0.12);">
          ${country.country_name}<br/>
          <span style="color:#94a3b8; font-weight:400;">GDP $${(country.gdp / 1e12).toFixed(2)}T · Score ${country.health_score}</span>
        </div>`
      }}
      onPolygonClick={(feature) => {
        const country = BY_CODE[feature.properties.ISO_A3]
        if (country) onSelectCountry(country)
      }}
      onPolygonHover={(feature) => {
        document.body.style.cursor = feature && BY_CODE[feature.properties.ISO_A3] ? 'pointer' : 'default'
      }}
    />
  )
}
