import { useEffect, useState } from 'react'
import CountryPanel from './components/CountryPanel'
import { sampleCountry } from './data/sampleCountry'

function App() {
  const [status, setStatus] = useState('checking...')
  const [selectedCountry, setSelectedCountry] = useState(sampleCountry)

  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('backend not reachable'))
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* Map placeholder — swap for the react-simple-maps globe/map component */}
      <div className="flex h-screen items-center justify-center text-slate-600">
        <div className="text-center">
          <p className="text-sm">Interactive map goes here</p>
          <p className="mt-1 text-xs text-slate-700">Backend status: {status}</p>
        </div>
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
