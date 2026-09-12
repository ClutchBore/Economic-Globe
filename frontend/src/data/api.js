export const API_BASE = 'http://localhost:8000'

export async function fetchCountryList() {
  const res = await fetch(`${API_BASE}/api/countries`)
  if (!res.ok) throw new Error(`GET /api/countries failed: ${res.status}`)
  const data = await res.json()
  return data.countries
}

export async function fetchCountryDetail(code) {
  const res = await fetch(`${API_BASE}/api/countries/${code}`)
  if (!res.ok) return null
  return res.json()
}

// Throws on failure so callers can show a friendly message — the backend's error detail
// (e.g. "Country summary is temporarily unavailable.") is attached as `.detail`.
export async function fetchSummary(code) {
  const res = await fetch(`${API_BASE}/api/summarize/${code}`, { method: 'POST' })
  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data.detail ?? `POST /api/summarize/${code} failed: ${res.status}`)
    err.detail = data.detail
    err.status = res.status
    throw err
  }
  return data
}

export async function fetchComparison(countryCodeA, countryCodeB) {
  const res = await fetch(`${API_BASE}/api/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country_a: countryCodeA, country_b: countryCodeB }),
  })
  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data.detail ?? `POST /api/compare failed: ${res.status}`)
    err.detail = data.detail
    err.status = res.status
    throw err
  }
  return data
}
