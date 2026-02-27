const EARTH_RADIUS_METERS = 6371000

const toRadians = (degreeValue) => (degreeValue * Math.PI) / 180

export const getHaversineDistance = (startPoint, endPoint) => {
  if (!startPoint || !endPoint) return 0

  const latitudeDelta = toRadians(endPoint.lat - startPoint.lat)
  const longitudeDelta = toRadians(endPoint.lng - startPoint.lng)
  const startLatitudeRadians = toRadians(startPoint.lat)
  const endLatitudeRadians = toRadians(endPoint.lat)

  const haversineFactor =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(startLatitudeRadians) * Math.cos(endLatitudeRadians) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2)

  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(haversineFactor), Math.sqrt(1 - haversineFactor))
}

export const getPathDistanceInMeters = (pointPath) => {
  if (pointPath.length < 2) return 0

  return pointPath.slice(1).reduce((accumulatedDistance, currentPoint, pointIndex) => {
    const previousPoint = pointPath[pointIndex]
    return accumulatedDistance + getHaversineDistance(previousPoint, currentPoint)
  }, 0)
}

export const formatDistanceLabel = (distanceInMeters) => {
  if (!distanceInMeters) return ''
  if (distanceInMeters < 1000) return `${distanceInMeters.toFixed(0)} m`
  return `${(distanceInMeters / 1000).toFixed(2)} km`
}

export const getMidpoint = (startPoint, endPoint) => ({
  lat: (startPoint.lat + endPoint.lat) / 2,
  lng: (startPoint.lng + endPoint.lng) / 2,
})
