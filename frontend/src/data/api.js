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
