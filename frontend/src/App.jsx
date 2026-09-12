import { useEffect, useState } from 'react'
import CountryPanel from './components/CountryPanel'
import Globe from './components/Globe'

function App() {
  const [status, setStatus] = useState('checking...')
  const [selectedCountry, setSelectedCountry] = useState(null)

  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('backend not reachable'))
  }, [])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-white">
      <Globe onSelectCountry={setSelectedCountry} spinning={!selectedCountry} />

      <div className="pointer-events-none absolute left-8 top-7 flex flex-col gap-1">
        <span className="text-[15px] font-semibold tracking-wide text-slate-100">Economic Globe</span>
        <span className="text-xs text-slate-600">Backend status: {status}</span>
      </div>

      {selectedCountry && (
        <div className="absolute inset-y-4 right-4">
          <CountryPanel
            country={selectedCountry}
            onClose={() => setSelectedCountry(null)}
            onCompare={() => console.log('open compare flow')}
          />
        </div>
      )}
    </div>
  )
}

export default App
