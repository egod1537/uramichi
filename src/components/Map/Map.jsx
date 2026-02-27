import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Circle, GoogleMap, OverlayView, Polyline } from '@react-google-maps/api'
import TOOL_MODES from '../../utils/toolModes'
import { COLOR_PRESETS } from '../../utils/constants'
import useProjectStore from '../../stores/useProjectStore'
import PinMarker from './PinMarker'
import PinPopup from './PinPopup'
import { formatDistanceLabel, getMidpoint, getPathDistanceInMeters } from '../../utils/geo'
import directionsCache from '../../utils/DirectionsCache'

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
const routeTravelModeList = [
  { value: 'WALKING', label: '도보' },
  { value: 'TRANSIT', label: '대중교통' },
  { value: 'DRIVING', label: '차량' },
]

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

const getRouteRequest = (startPoint, endPoint, travelMode) => ({
  origin: startPoint,
  destination: endPoint,
  travelMode: window.google.maps.TravelMode[travelMode],
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

const createRouteEntity = (routeResult, routePath, startPoint, endPoint, activeLayerId, travelMode, routeCount) => {
  const primaryRoute = routeResult.routes?.[0]
  const firstLeg = primaryRoute?.legs?.[0]
  const firstTransitStep = firstLeg?.steps?.find((stepItem) => stepItem.travel_mode === 'TRANSIT')
  const transitLineName =
    firstTransitStep?.transit?.line?.short_name || firstTransitStep?.transit?.line?.name || firstTransitStep?.instructions || ''

  return {
    id: `route-${Date.now()}-${routeCount + 1}`,
    layerId: activeLayerId,
    start: startPoint,
    end: endPoint,
    travelMode,
    summary: primaryRoute?.summary || '',
    path: routePath,
    distanceMeters: firstLeg?.distance?.value ?? 0,
    durationSeconds: firstLeg?.duration?.value ?? 0,
    lineName: transitLineName,
  }
}

function Map() {
  const mapInstanceRef = useRef(null)
  const currentMode = useProjectStore((state) => state.currentMode)
  const lines = useProjectStore((state) => state.lines)
  const linePath = useProjectStore((state) => state.linePath)
  const routePaths = useProjectStore((state) => state.routePaths)
  const measurePath = useProjectStore((state) => state.measurePath)
  const routeDraft = useProjectStore((state) => state.routeDraft)
  const pins = useProjectStore((state) => state.pins)
  const layers = useProjectStore((state) => state.layers)
  const routes = useProjectStore((state) => state.routes)
  const selectedPinId = useProjectStore((state) => state.selectedPinId)
  const selectedPinIds = useProjectStore((state) => state.selectedPinIds)
  const selectedLineId = useProjectStore((state) => state.selectedLineId)
  const activeLayerId = useProjectStore((state) => state.activeLayerId)
  const addMarker = useProjectStore((state) => state.addMarker)
  const appendLinePoint = useProjectStore((state) => state.appendLinePoint)
  const cancelDraftLine = useProjectStore((state) => state.cancelDraftLine)
  const appendMeasurePoint = useProjectStore((state) => state.appendMeasurePoint)
  const setMeasurePath = useProjectStore((state) => state.setMeasurePath)
  const cancelDraftMeasure = useProjectStore((state) => state.cancelDraftMeasure)
  const setRouteStart = useProjectStore((state) => state.setRouteStart)
  const setRouteTravelMode = useProjectStore((state) => state.setRouteTravelMode)
  const addRoute = useProjectStore((state) => state.addRoute)
  const selectPin = useProjectStore((state) => state.selectPin)
  const selectLine = useProjectStore((state) => state.selectLine)
  const togglePinInSelection = useProjectStore((state) => state.togglePinInSelection)
  const clearPinSelection = useProjectStore((state) => state.clearPinSelection)
  const addLine = useProjectStore((state) => state.addLine)
  const updateLine = useProjectStore((state) => state.updateLine)
  const removeLine = useProjectStore((state) => state.removeLine)
  const updatePin = useProjectStore((state) => state.updatePin)
  const commitMarkerDrag = useProjectStore((state) => state.commitMarkerDrag)
  const [isPinClickInProgress, setIsPinClickInProgress] = useState(false)
  const removePins = useProjectStore((state) => state.removePins)
  const [draggingPinId, setDraggingPinId] = useState(null)
  const [hoverMeasurePoint, setHoverMeasurePoint] = useState(null)
  const [draggingMeasurePointIndex, setDraggingMeasurePointIndex] = useState(null)

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
  const previewMeasurePath = useMemo(() => {
    if (currentMode !== TOOL_MODES.MEASURE_DISTANCE) return []
    if (!measurePath.length || !hoverMeasurePoint) return []
    return [...measurePath, hoverMeasurePoint]
  }, [currentMode, hoverMeasurePoint, measurePath])

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

  const requestRoute = useCallback(
    (startPoint, endPoint, travelMode) => {
      const cachedRouteData = directionsCache.get(startPoint, endPoint, travelMode)
      if (cachedRouteData) {
        addRoute(cachedRouteData)
        return
      }

      const routeLayerId = activeLayerId || layers[0]?.id || null
      if (!routeLayerId) {
        setRouteStart(null)
        return
      }

      const directionsService = new window.google.maps.DirectionsService()
      directionsService.route(getRouteRequest(startPoint, endPoint, travelMode), (result, status) => {
        if (status !== window.google.maps.DirectionsStatus.OK || !result) return
        const overviewPath = result.routes[0]?.overview_path ?? []
        if (!overviewPath.length) return
        const normalizedPath = overviewPath.map((locationPoint) => ({ lat: locationPoint.lat(), lng: locationPoint.lng() }))
        const routeEntity = createRouteEntity(result, normalizedPath, startPoint, endPoint, routeLayerId, travelMode, routes.length)
        directionsCache.set(startPoint, endPoint, travelMode, routeEntity)
        addRoute(routeEntity)
      })
    },
    [activeLayerId, addRoute, layers, routes.length, setRouteStart],
  )

  const handleMapClick = useCallback(
    (event) => {
      if (isPinClickInProgress) {
        setIsPinClickInProgress(false)
        return
      }

      const latitude = event.latLng?.lat()
      const longitude = event.latLng?.lng()
      if (latitude === undefined || longitude === undefined) return
      const clickedPoint = { lat: latitude, lng: longitude }

      if (currentMode === TOOL_MODES.DRAW_LINE) {
        appendLinePoint(clickedPoint)
        return
      }

      if (currentMode === TOOL_MODES.ADD_ROUTE) {
        if (!routeDraft.start) {
          setRouteStart(clickedPoint)
          return
        }
        requestRoute(routeDraft.start, clickedPoint, routeDraft.travelMode || 'WALKING')
        setRouteStart(null)
        return
      }

      if (currentMode === TOOL_MODES.MEASURE_DISTANCE) {
        setHoverMeasurePoint(null)
        appendMeasurePoint(clickedPoint)
        return
      }

      if (currentMode === TOOL_MODES.SELECT) {
        selectPin(null)
        selectLine(null)
        clearPinSelection()
      }
    },
    [
      appendLinePoint,
      appendMeasurePoint,
      clearPinSelection,
      currentMode,
      requestRoute,
      routeDraft.start,
      routeDraft.travelMode,
      selectLine,
      selectPin,
      setRouteStart,
      isPinClickInProgress,
      setHoverMeasurePoint,
    ],
  )

  const handleMapMouseDown = useCallback(
    (event) => {
      if (currentMode !== TOOL_MODES.ADD_MARKER) return
      const latitude = event.latLng?.lat()
      const longitude = event.latLng?.lng()
      if (latitude === undefined || longitude === undefined) return
      addMarker({ lat: latitude, lng: longitude })
    },
    [addMarker, currentMode],
  )

  const handleMapMouseMove = useCallback(
    (event) => {
      if (currentMode !== TOOL_MODES.MEASURE_DISTANCE) return
      if (!measurePath.length) return
      if (draggingMeasurePointIndex !== null) return
      const latitude = event.latLng?.lat()
      const longitude = event.latLng?.lng()
      if (latitude === undefined || longitude === undefined) return
      setHoverMeasurePoint({ lat: latitude, lng: longitude })
    },
    [currentMode, draggingMeasurePointIndex, measurePath.length],
  )

  const handleMeasurePointDrag = useCallback(
    (pointIndex, event) => {
      if (currentMode !== TOOL_MODES.MEASURE_DISTANCE) return
      const latitude = event.latLng?.lat()
      const longitude = event.latLng?.lng()
      if (latitude === undefined || longitude === undefined) return
      const nextMeasurePointList = measurePath.map((measurePointItem, measurePointIndex) =>
        measurePointIndex === pointIndex ? { lat: latitude, lng: longitude } : measurePointItem,
      )
      setMeasurePath(nextMeasurePointList)
    },
    [currentMode, measurePath, setMeasurePath],
  )

  const handlePinClick = useCallback(
    (pinId, event) => {
      setIsPinClickInProgress(true)

      if (currentMode !== TOOL_MODES.SELECT) {
        selectPin(pinId)
        return
      }

      selectLine(null)
      if (event?.domEvent?.shiftKey) {
        togglePinInSelection(pinId)
        return
      }
      selectPin(pinId)
    },
    [currentMode, selectLine, selectPin, togglePinInSelection, setIsPinClickInProgress],
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
      commitMarkerDrag()
      setDraggingPinId(null)
    },
    [commitMarkerDrag, currentMode, updatePin],
  )

  const handleMapDoubleClick = useCallback(() => {
    if (currentMode === TOOL_MODES.MEASURE_DISTANCE) {
      setHoverMeasurePoint(null)
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
          setHoverMeasurePoint(null)
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
    setHoverMeasurePoint,
    updateLine,
  ])

  useEffect(() => {
    if (currentMode === TOOL_MODES.MEASURE_DISTANCE) return
    setHoverMeasurePoint(null)
    setDraggingMeasurePointIndex(null)
  }, [currentMode])

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
        onMouseDown={handleMapMouseDown}
        onMouseMove={handleMapMouseMove}
        onDblClick={handleMapDoubleClick}
        options={{ ...mapOptions, disableDoubleClickZoom: currentMode === TOOL_MODES.MEASURE_DISTANCE || currentMode === TOOL_MODES.DRAW_LINE }}
      >
        {visiblePins.map((pinItem, pinIndex) => (
          <PinMarker
            key={pinItem.id}
            pin={pinItem}
            onClick={(event) => handlePinClick(pinItem.id, event)}
            indexLabel={currentMode === TOOL_MODES.ADD_ROUTE ? String(pinIndex + 1) : ''}
            draggable={currentMode === TOOL_MODES.SELECT && selectedPinId === pinItem.id}
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

        {previewMeasurePath.length > 1 && (
          <Polyline
            path={previewMeasurePath}
            options={{
              strokeColor: COLOR_PRESETS.measureOrange,
              strokeWeight: 2,
              clickable: false,
              strokeOpacity: 0.45,
            }}
          />
        )}

        {measurePath.map((measurePointItem, measurePointIndex) => (
          <Circle
            key={`measure-point-${measurePointIndex}`}
            center={measurePointItem}
            radius={4}
            options={{
              strokeColor: '#ea580c',
              strokeWeight: 2,
              fillColor: '#ffffff',
              fillOpacity: 1,
              clickable: currentMode === TOOL_MODES.MEASURE_DISTANCE,
              draggable: currentMode === TOOL_MODES.MEASURE_DISTANCE,
              zIndex: 12,
            }}
            onDragStart={() => setDraggingMeasurePointIndex(measurePointIndex)}
            onDrag={(event) => handleMeasurePointDrag(measurePointIndex, event)}
            onDragEnd={(event) => {
              handleMeasurePointDrag(measurePointIndex, event)
              setDraggingMeasurePointIndex(null)
            }}
          />
        ))}

        {measureSegmentLabelDataList.map((segmentLabelData) => (
          <OverlayView key={segmentLabelData.id} position={segmentLabelData.position} mapPaneName={measureOverlayPane}>
            <div className="-translate-x-1/2 -translate-y-[calc(100%+8px)] whitespace-nowrap rounded bg-white/95 px-2 py-1 text-xs font-medium leading-none text-gray-700 shadow">
              {segmentLabelData.label}
            </div>
          </OverlayView>
        ))}

        {measureTotalLabelData ? (
          <OverlayView key={measureTotalLabelData.id} position={measureTotalLabelData.position} mapPaneName={measureOverlayPane}>
            <div className="-translate-x-1/2 -translate-y-[calc(100%+16px)] whitespace-nowrap rounded bg-[#f97316] px-2 py-1 text-xs font-semibold leading-none text-white shadow">
              {measureTotalLabelData.label}
            </div>
          </OverlayView>
        ) : null}
      </GoogleMap>

      {currentMode === TOOL_MODES.ADD_ROUTE && (
        <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-2 rounded-md bg-white px-3 py-2 text-sm shadow">
          <select
            value={routeDraft.travelMode || 'WALKING'}
            onChange={(event) => setRouteTravelMode(event.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-700"
          >
            {routeTravelModeList.map((routeTravelModeItem) => (
              <option key={routeTravelModeItem.value} value={routeTravelModeItem.value}>
                {routeTravelModeItem.label}
              </option>
            ))}
          </select>
          <span className="text-gray-700">{routeDraft.start ? '도착점을 클릭해 경로를 완성하세요' : '출발점을 클릭하세요'}</span>
        </div>
      )}
    </>
  )
}

export default Map
