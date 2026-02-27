import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GoogleMap, OverlayView, Polyline } from '@react-google-maps/api'
import TOOL_MODES from '../../utils/toolModes'
import { COLOR_PRESETS } from '../../utils/constants'
import useProjectStore from '../../stores/useProjectStore'
import PinMarker from './PinMarker'
import PinPopup from './PinPopup'
import { formatDistanceLabel, getMidpoint, getPathDistanceInMeters } from '../../utils/geo'

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

const measureOverlayPane = OverlayView.OVERLAY_MOUSE_TARGET

const createSegmentLabelDataList = (measurePointPath) =>
  measurePointPath.slice(1).map((currentPoint, pointIndex) => {
    const previousPoint = measurePointPath[pointIndex]
    const segmentDistanceInMeters = getPathDistanceInMeters([previousPoint, currentPoint])
    return {
      id: `measure-segment-${pointIndex + 1}`,
      position: getMidpoint(previousPoint, currentPoint),
      label: formatDistanceLabel(segmentDistanceInMeters),
    }
  })

const createTotalLabelData = (measurePointPath) => {
  const totalDistanceInMeters = getPathDistanceInMeters(measurePointPath)
  if (!totalDistanceInMeters) return null
  const terminalPoint = measurePointPath[measurePointPath.length - 1]
  return { id: 'measure-total', position: terminalPoint, label: `총 ${formatDistanceLabel(totalDistanceInMeters)}` }
}

const getRouteRequest = (startPoint, endPoint) => ({
  origin: startPoint,
  destination: endPoint,
  travelMode: window.google.maps.TravelMode.WALKING,
})

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
  const selectedPinIds = useProjectStore((state) => state.selectedPinIds)
  const addMarker = useProjectStore((state) => state.addMarker)
  const appendLinePoint = useProjectStore((state) => state.appendLinePoint)
  const appendMeasurePoint = useProjectStore((state) => state.appendMeasurePoint)
  const cancelDraftMeasure = useProjectStore((state) => state.cancelDraftMeasure)
  const setRouteStart = useProjectStore((state) => state.setRouteStart)
  const commitRoutePath = useProjectStore((state) => state.commitRoutePath)
  const selectPin = useProjectStore((state) => state.selectPin)
  const togglePinInSelection = useProjectStore((state) => state.togglePinInSelection)
  const clearPinSelection = useProjectStore((state) => state.clearPinSelection)
  const updatePin = useProjectStore((state) => state.updatePin)
  const commitMarkerDrag = useProjectStore((state) => state.commitMarkerDrag)
  const removePins = useProjectStore((state) => state.removePins)
  const [draggingPinId, setDraggingPinId] = useState(null)

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

  useEffect(() => {
    if (currentMode !== TOOL_MODES.MEASURE_DISTANCE) {
      cancelDraftMeasure()
    }
  }, [cancelDraftMeasure, currentMode])

  const measureSegmentLabelDataList = useMemo(() => createSegmentLabelDataList(measurePath), [measurePath])

  const measureTotalLabelData = useMemo(() => createTotalLabelData(measurePath), [measurePath])

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

      if (currentMode === TOOL_MODES.SELECT) {
        selectPin(null)
        clearPinSelection()
      }
    },
    [addMarker, appendLinePoint, appendMeasurePoint, clearPinSelection, createRoutePath, currentMode, routeDraft.start, selectPin, setRouteStart],
  )

  const handlePinClick = useCallback(
    (pinId, event) => {
      if (currentMode !== TOOL_MODES.SELECT) return
      if (event?.domEvent?.shiftKey) {
        togglePinInSelection(pinId)
        return
      }
      selectPin(pinId)
    },
    [currentMode, selectPin, togglePinInSelection],
  )

  const handlePinDragStart = useCallback(
    (pinId) => {
      if (currentMode !== TOOL_MODES.SELECT) return
      setDraggingPinId(pinId)
    },
    [currentMode],
  )

  const handlePinDrag = useCallback(
    (pinId, event) => {
      if (currentMode !== TOOL_MODES.SELECT) return
      const latitude = event.latLng?.lat()
      const longitude = event.latLng?.lng()
      if (latitude === undefined || longitude === undefined) return
      updatePin(pinId, { position: { lat: latitude, lng: longitude } })
    },
    [currentMode, updatePin],
  )

  const handlePinDragEnd = useCallback(
    (pinId, event) => {
      if (currentMode !== TOOL_MODES.SELECT) return
      const latitude = event.latLng?.lat()
      const longitude = event.latLng?.lng()
      if (latitude === undefined || longitude === undefined) {
        setDraggingPinId(null)
        return
      }
      const nextPosition = { lat: latitude, lng: longitude }
      updatePin(pinId, { position: nextPosition })
      const currentMarkers = useProjectStore.getState().markers
      commitMarkerDrag(currentMarkers)
      setDraggingPinId(null)
    },
    [commitMarkerDrag, currentMode, updatePin],
  )

  const handleMapDoubleClick = useCallback(() => {
    if (currentMode !== TOOL_MODES.MEASURE_DISTANCE) return
    cancelDraftMeasure()
  }, [cancelDraftMeasure, currentMode])

  useEffect(() => {
    const handleDeleteKeyDown = (event) => {
      if (event.key === 'Escape' && currentMode === TOOL_MODES.MEASURE_DISTANCE) {
        cancelDraftMeasure()
        return
      }

      if (currentMode !== TOOL_MODES.SELECT) return
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      if (!selectedPinIds.length) return
      event.preventDefault()
      removePins(selectedPinIds)
    }

    window.addEventListener('keydown', handleDeleteKeyDown)
    return () => window.removeEventListener('keydown', handleDeleteKeyDown)
  }, [cancelDraftMeasure, currentMode, removePins, selectedPinIds])

  return (
    <>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={(loadedMap) => {
          mapInstanceRef.current = loadedMap
        }}
        onUnmount={() => {
          mapInstanceRef.current = null
        }}
        onClick={handleMapClick}
        onDblClick={handleMapDoubleClick}
        options={{ ...mapOptions, disableDoubleClickZoom: currentMode === TOOL_MODES.MEASURE_DISTANCE }}
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
            onClick={(event) => handlePinClick(pinItem.id, event)}
            indexLabel={currentMode === TOOL_MODES.ADD_ROUTE ? String(pinIndex + 1) : ''}
            draggable={currentMode === TOOL_MODES.SELECT}
            isDragging={draggingPinId === pinItem.id}
            onDragStart={() => handlePinDragStart(pinItem.id)}
            onDrag={(event) => handlePinDrag(pinItem.id, event)}
            onDragEnd={(event) => handlePinDragEnd(pinItem.id, event)}
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

        {measureSegmentLabelDataList.map((segmentLabelData) => (
          <OverlayView key={segmentLabelData.id} position={segmentLabelData.position} mapPaneName={measureOverlayPane}>
            <div className="-translate-x-1/2 -translate-y-1/2 rounded bg-white/95 px-2 py-0.5 text-xs font-medium text-gray-700 shadow">
              {segmentLabelData.label}
            </div>
          </OverlayView>
        ))}

        {measureTotalLabelData ? (
          <OverlayView key={measureTotalLabelData.id} position={measureTotalLabelData.position} mapPaneName={measureOverlayPane}>
            <div className="-translate-x-1/2 -translate-y-[calc(100%+12px)] rounded bg-[#f97316] px-2 py-1 text-xs font-semibold text-white shadow">
              {measureTotalLabelData.label}
            </div>
          </OverlayView>
        ) : null}
      </GoogleMap>

      {routeDraft.start && (
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-md bg-white px-3 py-2 text-sm shadow">
          도착점을 클릭해 경로를 완성하세요
        </div>
      )}
    </>
  )
}

export default Map
