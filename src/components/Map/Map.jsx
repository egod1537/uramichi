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
const lineColorSequence = [COLOR_PRESETS.primaryBlue, COLOR_PRESETS.routeGreen, COLOR_PRESETS.measureOrange, '#8b5cf6']

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

const createLineEntity = (linePointPath, activeLayerId, lineCount) => ({
  id: `line-${Date.now()}-${lineCount + 1}`,
  layerId: activeLayerId,
  points: linePointPath,
  color: COLOR_PRESETS.primaryBlue,
  width: 3,
})

const getNextLineColor = (currentColor) => {
  const currentColorIndex = lineColorSequence.indexOf(currentColor)
  if (currentColorIndex === -1) return lineColorSequence[0]
  return lineColorSequence[(currentColorIndex + 1) % lineColorSequence.length]
}

function Map() {
  const mapInstanceRef = useRef(null)
  const currentMode = useProjectStore((state) => state.currentMode)
  const markers = useProjectStore((state) => state.markers)
  const lines = useProjectStore((state) => state.lines)
  const linePath = useProjectStore((state) => state.linePath)
  const routePaths = useProjectStore((state) => state.routePaths)
  const measurePath = useProjectStore((state) => state.measurePath)
  const routeDraft = useProjectStore((state) => state.routeDraft)
  const pins = useProjectStore((state) => state.pins)
  const layers = useProjectStore((state) => state.layers)
  const selectedPinId = useProjectStore((state) => state.selectedPinId)
  const selectedPinIds = useProjectStore((state) => state.selectedPinIds)
  const selectedLineId = useProjectStore((state) => state.selectedLineId)
  const activeLayerId = useProjectStore((state) => state.activeLayerId)
  const addMarker = useProjectStore((state) => state.addMarker)
  const appendLinePoint = useProjectStore((state) => state.appendLinePoint)
  const cancelDraftLine = useProjectStore((state) => state.cancelDraftLine)
  const appendMeasurePoint = useProjectStore((state) => state.appendMeasurePoint)
  const cancelDraftMeasure = useProjectStore((state) => state.cancelDraftMeasure)
  const setRouteStart = useProjectStore((state) => state.setRouteStart)
  const commitRoutePath = useProjectStore((state) => state.commitRoutePath)
  const selectPin = useProjectStore((state) => state.selectPin)
  const selectLine = useProjectStore((state) => state.selectLine)
  const togglePinInSelection = useProjectStore((state) => state.togglePinInSelection)
  const clearPinSelection = useProjectStore((state) => state.clearPinSelection)
  const addLine = useProjectStore((state) => state.addLine)
  const updateLine = useProjectStore((state) => state.updateLine)
  const removeLine = useProjectStore((state) => state.removeLine)
  const updatePin = useProjectStore((state) => state.updatePin)
  const commitMarkerDrag = useProjectStore((state) => state.commitMarkerDrag)
  const removePins = useProjectStore((state) => state.removePins)
  const [draggingPinId, setDraggingPinId] = useState(null)

  const visibleLayerIdSet = useMemo(
    () => new Set(layers.filter((layerItem) => layerItem.visible).map((layerItem) => layerItem.id)),
    [layers],
  )

  const visiblePins = useMemo(() => pins.filter((pinItem) => visibleLayerIdSet.has(pinItem.layerId)), [pins, visibleLayerIdSet])

  const visibleLines = useMemo(() => lines.filter((lineItem) => visibleLayerIdSet.has(lineItem.layerId)), [lines, visibleLayerIdSet])

  const selectedLine = useMemo(
    () => visibleLines.find((lineItem) => lineItem.id === selectedLineId) || null,
    [selectedLineId, visibleLines],
  )

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
    if (currentMode !== TOOL_MODES.DRAW_LINE) {
      cancelDraftLine()
    }
  }, [cancelDraftLine, cancelDraftMeasure, currentMode])

  const measureSegmentLabelDataList = useMemo(() => createSegmentLabelDataList(measurePath), [measurePath])

  const measureTotalLabelData = useMemo(() => createTotalLabelData(measurePath), [measurePath])

  const completeDraftLine = useCallback(() => {
    if (currentMode !== TOOL_MODES.DRAW_LINE) return
    if (linePath.length < 2) {
      cancelDraftLine()
      return
    }
    const targetLayerId = activeLayerId || layers[0]?.id || null
    if (!targetLayerId) {
      cancelDraftLine()
      return
    }
    addLine(createLineEntity(linePath, targetLayerId, lines.length))
  }, [activeLayerId, addLine, cancelDraftLine, currentMode, layers, linePath, lines.length])

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
        selectLine(null)
        clearPinSelection()
      }
    },
    [
      addMarker,
      appendLinePoint,
      appendMeasurePoint,
      clearPinSelection,
      createRoutePath,
      currentMode,
      routeDraft.start,
      selectLine,
      selectPin,
      setRouteStart,
    ],
  )

  const handlePinClick = useCallback(
    (pinId, event) => {
      if (currentMode !== TOOL_MODES.SELECT) return
      selectLine(null)
      if (event?.domEvent?.shiftKey) {
        togglePinInSelection(pinId)
        return
      }
      selectPin(pinId)
    },
    [currentMode, selectLine, selectPin, togglePinInSelection],
  )

  const handleLineClick = useCallback(
    (lineId) => {
      if (currentMode !== TOOL_MODES.SELECT) return
      selectPin(null)
      clearPinSelection()
      selectLine(lineId)
    },
    [clearPinSelection, currentMode, selectLine, selectPin],
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
    if (currentMode === TOOL_MODES.MEASURE_DISTANCE) {
      cancelDraftMeasure()
      return
    }
    if (currentMode === TOOL_MODES.DRAW_LINE) {
      completeDraftLine()
    }
  }, [cancelDraftMeasure, completeDraftLine, currentMode])

  useEffect(() => {
    const handleDeleteKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (currentMode === TOOL_MODES.MEASURE_DISTANCE) {
          cancelDraftMeasure()
          return
        }
        if (currentMode === TOOL_MODES.DRAW_LINE) {
          completeDraftLine()
          return
        }
      }

      if (currentMode !== TOOL_MODES.SELECT) return

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedPinIds.length) {
          event.preventDefault()
          removePins(selectedPinIds)
          return
        }
        if (selectedLineId) {
          event.preventDefault()
          removeLine(selectedLineId)
        }
      }

      if (event.key.toLowerCase() === 'c' && selectedLine) {
        event.preventDefault()
        updateLine(selectedLine.id, { color: getNextLineColor(selectedLine.color) })
      }
    }

    window.addEventListener('keydown', handleDeleteKeyDown)
    return () => window.removeEventListener('keydown', handleDeleteKeyDown)
  }, [
    cancelDraftMeasure,
    completeDraftLine,
    currentMode,
    removeLine,
    removePins,
    selectedLine,
    selectedLineId,
    selectedPinIds,
    updateLine,
  ])

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
        options={{ ...mapOptions, disableDoubleClickZoom: currentMode === TOOL_MODES.MEASURE_DISTANCE || currentMode === TOOL_MODES.DRAW_LINE }}
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

        {visibleLines.map((lineItem) => (
          <Polyline
            key={lineItem.id}
            path={lineItem.points}
            onClick={() => handleLineClick(lineItem.id)}
            options={{
              strokeColor: lineItem.color || COLOR_PRESETS.primaryBlue,
              strokeWeight: lineItem.width || 3,
              clickable: currentMode === TOOL_MODES.SELECT,
              zIndex: selectedLineId === lineItem.id ? 10 : 5,
              strokeOpacity: selectedLineId === lineItem.id ? 1 : 0.8,
            }}
          />
        ))}

        {linePath.length > 1 && (
          <Polyline
            path={linePath}
            options={{ strokeColor: COLOR_PRESETS.primaryBlue, strokeWeight: 3, clickable: false, strokeOpacity: 0.7 }}
          />
        )}

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
