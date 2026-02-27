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
    this.cacheMap.set(this.createKey(startPoint, endPoint, travelMode), routeData)
  }
}

const directionsCache = new DirectionsCache()

export default directionsCache
