import { GoogleMap, InfoWindow, Marker, Polyline } from '@react-google-maps/api'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useMapStore, { TOOL_MODES } from '../../stores/useMapStore'

const containerStyle = { width: '100%', height: '100%' }

const defaultCenter = { lat: 35.6812, lng: 139.7671 }

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  zoomControlOptions: { position: 9 },
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
}

const getRouteRequest = (startPoint, endPoint) => ({
  origin: startPoint,
  destination: endPoint,
  travelMode: window.google.maps.TravelMode.WALKING,
})

const getPathDistanceInMeters = (path) => {
  if (path.length < 2) return 0

  return path.slice(1).reduce((accumulatedDistance, currentPoint, currentIndex) => {
    const previousPoint = path[currentIndex]
    const segmentDistance = window.google.maps.geometry.spherical.computeDistanceBetween(
      new window.google.maps.LatLng(previousPoint.lat, previousPoint.lng),
      new window.google.maps.LatLng(currentPoint.lat, currentPoint.lng),
    )

    return accumulatedDistance + segmentDistance
  }, 0)
}

export default function Map() {
  const [mapInstance, setMapInstance] = useState(null)
  const currentMode = useMapStore((state) => state.currentMode)
  const markers = useMapStore((state) => state.markers)
  const linePath = useMapStore((state) => state.linePath)
  const routePaths = useMapStore((state) => state.routePaths)
  const measurePath = useMapStore((state) => state.measurePath)
  const routeDraft = useMapStore((state) => state.routeDraft)
  const addMarker = useMapStore((state) => state.addMarker)
  const appendLinePoint = useMapStore((state) => state.appendLinePoint)
  const appendMeasurePoint = useMapStore((state) => state.appendMeasurePoint)
  const setRouteStart = useMapStore((state) => state.setRouteStart)
  const commitRoutePath = useMapStore((state) => state.commitRoutePath)
  const pins = useMapStore((state) => state.pins)
  const layers = useMapStore((state) => state.layers)
  const selectedPinId = useMapStore((state) => state.selectedPinId)
  const selectPin = useMapStore((state) => state.selectPin)


  const measuredDistanceLabel = useMemo(() => {
    const distanceInMeters = getPathDistanceInMeters(measurePath)
    if (!distanceInMeters) return ''
    if (distanceInMeters < 1000) return `${distanceInMeters.toFixed(0)} m`
    return `${(distanceInMeters / 1000).toFixed(2)} km`
  }, [measurePath])

  const visiblePins = useMemo(() => {
    const visibleLayerIdSet = new Set(
      layers.filter((layerItem) => layerItem.visible).map((layerItem) => layerItem.id),
    )

    return pins.filter((pinItem) => visibleLayerIdSet.has(pinItem.layerId))
  }, [pins, layers])

  const selectedPin = useMemo(
    () => visiblePins.find((pinItem) => pinItem.id === selectedPinId) ?? null,
    [visiblePins, selectedPinId],
  )

  const onLoad = useCallback((loadedMap) => setMapInstance(loadedMap), [])
  const onUnmount = useCallback(() => setMapInstance(null), [])

  const createRoutePath = useCallback(
    (startPoint, endPoint) => {
      const directionsService = new window.google.maps.DirectionsService()
      directionsService.route(getRouteRequest(startPoint, endPoint), (result, status) => {
        if (status !== window.google.maps.DirectionsStatus.OK || !result) return

        const overviewPath = result.routes[0]?.overview_path ?? []
        if (!overviewPath.length) return

        const normalizedPath = overviewPath.map((location) => ({
          lat: location.lat(),
          lng: location.lng(),
        }))

        commitRoutePath(normalizedPath)
      })
    },
    [commitRoutePath],
  )

  useEffect(() => {
    if (!mapInstance || !selectedPin) return

    mapInstance.panTo(selectedPin.position)
  }, [mapInstance, selectedPin])

  const handleMapClick = useCallback(
    (event) => {
      const latitude = event.latLng?.lat()
      const longitude = event.latLng?.lng()
      if (latitude === undefined || longitude === undefined) return

      const clickedPoint = { lat: latitude, lng: longitude }

      if (currentMode === TOOL_MODES.ADD_MARKER) {
        addMarker(clickedPoint)
        return
      }

      if (currentMode === TOOL_MODES.DRAW_LINE) {
        appendLinePoint(clickedPoint)
        return
      }

      if (currentMode === TOOL_MODES.MEASURE_DISTANCE) {
        appendMeasurePoint(clickedPoint)
        return
      }

      if (currentMode === TOOL_MODES.ADD_ROUTE) {
        if (!routeDraft.start) {
          setRouteStart(clickedPoint)
          return
        }

        createRoutePath(routeDraft.start, clickedPoint)
        setRouteStart(null)
      }
    },
    [
      currentMode,
      addMarker,
      appendLinePoint,
      appendMeasurePoint,
      routeDraft.start,
      setRouteStart,
      createRoutePath,
    ],
  )

  return (
    <>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
      >
        {markers.map((markerPoint, markerIndex) => (
          <Marker key={`marker-${markerIndex}`} position={markerPoint} />
        ))}

        {visiblePins.map((pinItem) => (
          <Marker
            key={pinItem.id}
            position={pinItem.position}
            onClick={() => selectPin(pinItem.id)}
          />
        ))}

        {selectedPin && (
          <InfoWindow
            position={selectedPin.position}
            onCloseClick={() => selectPin(null)}
          >
            <div className="text-sm">{selectedPin.name}</div>
          </InfoWindow>
        )}

        {linePath.length > 1 && (
          <Polyline
            path={linePath}
            options={{ strokeColor: '#1a73e8', strokeWeight: 3, clickable: false }}
          />
        )}

        {routePaths.map((routePath, routeIndex) => (
          <Polyline
            key={`route-${routeIndex}`}
            path={routePath}
            options={{ strokeColor: '#34a853', strokeWeight: 4, clickable: false }}
          />
        ))}

        {measurePath.length > 1 && (
          <Polyline
            path={measurePath}
            options={{
              strokeColor: '#f9ab00',
              strokeWeight: 3,
              clickable: false,
              icons: [
                {
                  icon: {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: 1,
                    scale: 4,
                  },
                  offset: '0',
                  repeat: '20px',
                },
              ],
            }}
          />
        )}
      </GoogleMap>

      {routeDraft.start && mapInstance && (
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-md bg-white px-3 py-2 text-sm shadow">
          도착점을 클릭해 경로를 완성하세요
        </div>
      )}

      {measuredDistanceLabel && (
        <div className="absolute bottom-16 left-1/2 z-20 -translate-x-1/2 rounded-md bg-white px-3 py-2 text-sm shadow">
          총 거리: {measuredDistanceLabel}
        </div>
      )}
    </>
  )
}
