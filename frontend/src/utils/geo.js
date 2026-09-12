// Rough centroid for a GeoJSON country feature — averages the points of its largest ring
// (by point count, a cheap proxy for "main landmass") rather than computing a true
// area-weighted centroid, which is plenty accurate for placing a marker/arc endpoint.
export function countryCentroid(feature) {
  const geometry = feature.geometry
  const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()

  let largestRing = rings[0]
  for (const ring of rings) {
    if (ring.length > largestRing.length) largestRing = ring
  }

  let sumLng = 0
  let sumLat = 0
  for (const [lng, lat] of largestRing) {
    sumLng += lng
    sumLat += lat
  }
  return { lat: sumLat / largestRing.length, lng: sumLng / largestRing.length }
}
