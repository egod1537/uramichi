const normalizePoint = (point) => `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`

class DirectionsCache {
  constructor() {
    this.cacheMap = new Map()
  }

  createKey(startPoint, endPoint, travelMode) {
    return `${normalizePoint(startPoint)}|${normalizePoint(endPoint)}|${travelMode}`
  }

  get(startPoint, endPoint, travelMode) {
    return this.cacheMap.get(this.createKey(startPoint, endPoint, travelMode)) || null
  }

  set(startPoint, endPoint, travelMode, routeData) {
    const routeCacheData = {
      path: routeData.path || [],
      distanceMeters: routeData.distanceMeters ?? 0,
      durationSeconds: routeData.durationSeconds ?? 0,
      summary: routeData.summary || '',
      lineName: routeData.lineName || '',
    }
    this.cacheMap.set(this.createKey(startPoint, endPoint, travelMode), routeCacheData)
  }
}

const directionsCache = new DirectionsCache()

export default directionsCache
