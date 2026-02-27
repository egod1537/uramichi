const DEFAULT_PRECISION = 5

const normalizeCoordinate = (coordinate, precision = DEFAULT_PRECISION) =>
  Number.parseFloat(coordinate).toFixed(precision)

const createPointKey = (point) => {
  if (!point) return 'unknown'
  return `${normalizeCoordinate(point.lat)}:${normalizeCoordinate(point.lng)}`
}

class DirectionsCache {
  constructor() {
    this.cacheBySegment = new Map()
  }

  createKey(startPoint, endPoint, travelMode) {
    return `${createPointKey(startPoint)}|${createPointKey(endPoint)}|${travelMode}`
  }

  get(startPoint, endPoint, travelMode) {
    const cacheKey = this.createKey(startPoint, endPoint, travelMode)
    return this.cacheBySegment.get(cacheKey) ?? null
  }

  set(startPoint, endPoint, travelMode, routeData) {
    const cacheKey = this.createKey(startPoint, endPoint, travelMode)
    this.cacheBySegment.set(cacheKey, routeData)
    return routeData
  }
}

const directionsCache = new DirectionsCache()

export default directionsCache
