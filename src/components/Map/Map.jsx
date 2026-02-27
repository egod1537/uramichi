import { useCallback, useEffect, useMemo, useRef } from 'react'
import { GoogleMap, Polyline } from '@react-google-maps/api'
import TOOL_MODES from '../../utils/toolModes'
import { COLOR_PRESETS } from '../../utils/constants'
import useProjectStore from '../../stores/useProjectStore'
import PinMarker from './PinMarker'
import PinPopup from './PinPopup'

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
  return path.slice(1).reduce((distanceSum, currentPoint, pointIndex) => {
    const previousPoint = path[pointIndex]
    const segmentDistance = window.google.maps.geometry.spherical.computeDistanceBetween(
      new window.google.maps.LatLng(previousPoint.lat, previousPoint.lng),
      new window.google.maps.LatLng(currentPoint.lat, currentPoint.lng),
    )
    return distanceSum + segmentDistance
  }, 0)
}

function Map() {
  const mapInstanceRef = useRef(null)
  const currentMode = useProjectStore((state) => state.currentMode)
  const markers = useProjectStore((state) => state.markers)
  const linePath = useProjectStore((state) => state.linePath)
  const routePaths = useProjectStore((state) => state.routePaths)
  const measurePath = useProjectStore((state) => state.measurePath)
  const routeDraft = useProjectStore((state) => state.routeDraft)
  const pins = useProjectStore((state) => state.pins)
  const layers = useProjectStore((state) => state.layers)
  const selectedPinId = useProjectStore((state) => state.selectedPinId)
  const addMarker = useProjectStore((state) => state.addMarker)
  const appendLinePoint = useProjectStore((state) => state.appendLinePoint)
  const appendMeasurePoint = useProjectStore((state) => state.appendMeasurePoint)
  const setRouteStart = useProjectStore((state) => state.setRouteStart)
  const commitRoutePath = useProjectStore((state) => state.commitRoutePath)
  const selectPin = useProjectStore((state) => state.selectPin)

  const visiblePins = useMemo(() => {
    const visibleLayerIdSet = new Set(layers.filter((layerItem) => layerItem.visible).map((layerItem) => layerItem.id))
    return pins.filter((pinItem) => visibleLayerIdSet.has(pinItem.layerId))
  }, [layers, pins])

  const selectedPin = useMemo(
    () => visiblePins.find((pinItem) => pinItem.id === selectedPinId) || null,
    [selectedPinId, visiblePins],
  )

  useEffect(() => {
    if (mapInstanceRef.current && selectedPin) {
      mapInstanceRef.current.panTo(selectedPin.position)
    }
  }, [selectedPin])

  const measuredDistanceLabel = useMemo(() => {
    const distanceInMeters = getPathDistanceInMeters(measurePath)
    if (!distanceInMeters) return ''
    if (distanceInMeters < 1000) return `${distanceInMeters.toFixed(0)} m`
    return `${(distanceInMeters / 1000).toFixed(2)} km`
  }, [measurePath])

  const createRoutePath = useCallback(
    (startPoint, endPoint) => {
      const directionsService = new window.google.maps.DirectionsService()
      directionsService.route(getRouteRequest(startPoint, endPoint), (result, status) => {
        if (status !== window.google.maps.DirectionsStatus.OK || !result) return
        const overviewPath = result.routes[0]?.overview_path ?? []
        if (!overviewPath.length) return
        const normalizedPath = overviewPath.map((locationPoint) => ({ lat: locationPoint.lat(), lng: locationPoint.lng() }))
        commitRoutePath(normalizedPath)
      })
    },
    [commitRoutePath],
  )

  const handleMapClick = useCallback(
    (event) => {
      const latitude = event.latLng?.lat()
      const longitude = event.latLng?.lng()
      if (latitude === undefined || longitude === undefined) return
      const clickedPoint = { lat: latitude, lng: longitude }

      if (currentMode === TOOL_MODES.ADD_MARKER) return addMarker(clickedPoint)
      if (currentMode === TOOL_MODES.DRAW_LINE) return appendLinePoint(clickedPoint)
      if (currentMode === TOOL_MODES.MEASURE_DISTANCE) return appendMeasurePoint(clickedPoint)
      if (currentMode === TOOL_MODES.ADD_ROUTE) {
        if (!routeDraft.start) return setRouteStart(clickedPoint)
        createRoutePath(routeDraft.start, clickedPoint)
        setRouteStart(null)
      }
    },
    [addMarker, appendLinePoint, appendMeasurePoint, createRoutePath, currentMode, routeDraft.start, setRouteStart],
  )

  return (
    <>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        options={mapOptions}
        onLoad={(loadedMap) => {
          mapInstanceRef.current = loadedMap
        }}
        onUnmount={() => {
          mapInstanceRef.current = null
        }}
        onClick={handleMapClick}
      >
        {markers.map((markerPoint, markerIndex) => (
          <PinMarker
            key={`marker-${markerIndex}`}
            pin={{ id: `marker-${markerIndex}`, position: markerPoint, category: 'default' }}
            onClick={() => {}}
          />
        ))}

        {visiblePins.map((pinItem, pinIndex) => (
          <PinMarker
            key={pinItem.id}
            pin={pinItem}
            onClick={() => selectPin(pinItem.id)}
            indexLabel={currentMode === TOOL_MODES.ADD_ROUTE ? String(pinIndex + 1) : ''}
          />
        ))}

        {selectedPin ? <PinPopup key={selectedPin.id} pin={selectedPin} /> : null}

        {linePath.length > 1 && <Polyline path={linePath} options={{ strokeColor: COLOR_PRESETS.primaryBlue, strokeWeight: 3, clickable: false }} />}

        {routePaths.map((routePath, routeIndex) => (
          <Polyline key={`route-${routeIndex}`} path={routePath} options={{ strokeColor: COLOR_PRESETS.routeGreen, strokeWeight: 4, clickable: false }} />
        ))}

        {measurePath.length > 1 && (
          <Polyline
            path={measurePath}
            options={{
              strokeColor: COLOR_PRESETS.measureOrange,
              strokeWeight: 3,
              clickable: false,
              icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 }, offset: '0', repeat: '20px' }],
            }}
          />
        )}
      </GoogleMap>

      {routeDraft.start && (
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

export default Map
