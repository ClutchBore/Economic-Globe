// Vite only exposes env vars prefixed VITE_ to client code. Falls back to local dev's backend
// when unset, so nothing changes for anyone running this locally without a .env file.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

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

// One SSE frame is "event: name\ndata: {...}" separated by a blank line. Returns null for a
// frame with no data (e.g. a bare comment/keepalive), which callers should just skip.
function parseSseFrame(frame) {
  let name = 'message'
  const dataLines = []
  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) name = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
  }
  if (dataLines.length === 0) return null
  try {
    return { name, data: JSON.parse(dataLines.join('\n')) }
  } catch {
    return null
  }
}

// Streams POST /api/chat/{code}. Validation errors (422) reject immediately with `.detail`
// set, same as the other calls above; once streaming actually starts the HTTP status is
// always 200, and a provider failure instead arrives as an `error` event (rejects with the
// same `.detail` shape) with no trailing `done`. Pass an AbortController's `signal` so the
// caller can cancel mid-stream (switching countries, sending a new question) — the reader
// rejects with a DOMException named 'AbortError', which callers should treat as silent.
export async function streamChat(code, message, history, { onMeta, onDelta, signal } = {}) {
  const res = await fetch(`${API_BASE}/api/chat/${code}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
    signal,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const err = new Error(data.detail ?? `POST /api/chat/${code} failed: ${res.status}`)
    err.detail = data.detail
    err.status = res.status
    throw err
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let boundary
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      const event = parseSseFrame(frame)
      if (!event) continue

      if (event.name === 'meta') onMeta?.(event.data)
      else if (event.name === 'delta') onDelta?.(event.data.text)
      else if (event.name === 'done') return
      else if (event.name === 'error') {
        const err = new Error(event.data.detail ?? 'Country chat is temporarily unavailable. Please retry.')
        err.detail = event.data.detail
        throw err
      }
    }
  }
}
