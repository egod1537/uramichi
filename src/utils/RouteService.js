import directionsCache from './DirectionsCache'
import { createRouteId } from '../stores/useProjectStore'

class RouteService {
  static getRouteRequest(startPoint, endPoint, travelMode) {
    return {
      origin: startPoint,
      destination: endPoint,
      travelMode: window.google.maps.TravelMode[travelMode],
    }
  }

  static createRouteCacheData(routeResult, routePath) {
    const primaryRoute = routeResult.routes?.[0]
    const firstLeg = primaryRoute?.legs?.[0]
    const firstTransitStep = firstLeg?.steps?.find((stepItem) => stepItem.travel_mode === 'TRANSIT')
    const transitLineName =
      firstTransitStep?.transit?.line?.short_name || firstTransitStep?.transit?.line?.name || firstTransitStep?.instructions || ''

    return {
      path: routePath,
      distanceMeters: firstLeg?.distance?.value ?? 0,
      durationSeconds: firstLeg?.duration?.value ?? 0,
      summary: primaryRoute?.summary || '',
      lineName: transitLineName,
    }
  }

  static hasRouteIdConflict(routeId, routeList) {
    return routeList.some((routeItem) => routeItem.id === routeId)
  }

  static createUniqueRouteId(routeList) {
    const routeIdSet = new Set(routeList.map((routeItem) => routeItem.id))
    let retryCount = 0
    let generatedRouteId = createRouteId(routeList.length)

    while (routeIdSet.has(generatedRouteId) && retryCount < 5) {
      generatedRouteId = createRouteId(routeList.length + retryCount + 1)
      retryCount += 1
    }

    if (routeIdSet.has(generatedRouteId)) return null
    return generatedRouteId
  }

  static createRouteEntity(routeId, routeData, startPoint, endPoint, activeLayerId, travelMode) {
    return {
      id: routeId,
      layerId: activeLayerId,
      start: startPoint,
      end: endPoint,
      travelMode,
      summary: routeData.summary || '',
      path: routeData.path,
      distanceMeters: routeData.distanceMeters ?? 0,
      durationSeconds: routeData.durationSeconds ?? 0,
      lineName: routeData.lineName || '',
    }
  }

  static async createRouteEntityOrNull({ start, end, travelMode, currentRoutes, activeLayerId }) {
    if (!start || !end || !activeLayerId) return null

    const buildRouteEntity = (routeData) => {
      const routeId = RouteService.createUniqueRouteId(currentRoutes)
      if (!routeId || RouteService.hasRouteIdConflict(routeId, currentRoutes)) return null
      return RouteService.createRouteEntity(routeId, routeData, start, end, activeLayerId, travelMode)
    }

    const cachedRouteData = directionsCache.get(start, end, travelMode)
    if (cachedRouteData) {
      return buildRouteEntity(cachedRouteData)
    }

    return new Promise((resolve) => {
      const directionsService = new window.google.maps.DirectionsService()
      directionsService.route(RouteService.getRouteRequest(start, end, travelMode), (result, status) => {
        if (status !== window.google.maps.DirectionsStatus.OK || !result) {
          resolve(null)
          return
        }

        const overviewPath = result.routes?.[0]?.overview_path ?? []
        if (!overviewPath.length) {
          resolve(null)
          return
        }

        const normalizedPath = overviewPath.map((locationPoint) => ({ lat: locationPoint.lat(), lng: locationPoint.lng() }))
        const routeCacheData = RouteService.createRouteCacheData(result, normalizedPath)
        directionsCache.set(start, end, travelMode, routeCacheData)
        resolve(buildRouteEntity(routeCacheData))
      })
    })
  }
}

export default RouteService
