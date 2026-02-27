import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api'
import TOOL_MODES from '../../utils/toolModes'
import { COLOR_PRESETS } from '../../utils/constants'
import useProjectStore from '../../stores/useProjectStore'
import PinMarker from './PinMarker'
import PinPopup from './PinPopup'
import { handleLineMapClick, handleLineMapMouseMove } from './controllers/lineController'
import { handleMarkerMouseDown, handleMarkerMouseUp } from './controllers/markerController'
import { handleMeasureMapClick } from './controllers/measureController'
import { handleRouteMapClick } from './controllers/routeController'
import { handleSelectMapClick } from './controllers/selectController'
import { syncDraftByMode } from './controllers/syncDraftByMode'
import { ICON_FILTER_OPTIONS } from '../../utils/constants'
import RouteService from '../../utils/RouteService'
import MeasureLayer from './measure/MeasureLayer'
import MeasureLabels from './measure/MeasureLabels'
import useMeasureInteraction from './measure/useMeasureInteraction'
import PoiDetailOverlay from './PoiDetailOverlay'
import usePoiDetail from './hooks/usePoiDetail'

const containerStyle = { width: '100%', height: '100%' }
const defaultCenter = { lat: 35.6812, lng: 139.7671 }

const mapOptions = {
  disableDefaultUI: true,
  gestureHandling: 'greedy',
  zoomControl: false,
  zoomControlOptions: { position: 9 },
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: true,
}

const lineColorSequence = [COLOR_PRESETS.primaryBlue, COLOR_PRESETS.routeGreen, COLOR_PRESETS.measureOrange, '#8b5cf6']
const routeTravelModeList = [
  { value: 'WALKING', label: '도보' },
  { value: 'TRANSIT', label: '대중교통' },
  { value: 'DRIVING', label: '차량' },
]

const ADD_MARKER_DRAG_THRESHOLD_PX = 6
const LINE_VERTEX_PIXEL_SIZE = 10

const getNextLineColor = (currentColor) => {
  const currentColorIndex = lineColorSequence.indexOf(currentColor)
  if (currentColorIndex === -1) return lineColorSequence[0]
  return lineColorSequence[(currentColorIndex + 1) % lineColorSequence.length]
}

function Map() {
  const mapInstanceRef = useRef(null)
  const addMarkerMouseDownPositionRef = useRef(null)
  const shouldIgnoreNextMapClickRef = useRef(false)
  const currentMode = useProjectStore((state) => state.currentMode)
  const lines = useProjectStore((state) => state.lines)
  const measurements = useProjectStore((state) => state.measurements)
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
  const cancelDraftLine = useProjectStore((state) => state.cancelDraftLine)
  const appendMeasurePoint = useProjectStore((state) => state.appendMeasurePoint)
  const setMeasurePath = useProjectStore((state) => state.setMeasurePath)
  const cancelDraftMeasure = useProjectStore((state) => state.cancelDraftMeasure)
  const setRouteStart = useProjectStore((state) => state.setRouteStart)
  const setRouteTravelMode = useProjectStore((state) => state.setRouteTravelMode)
  const addRoute = useProjectStore((state) => state.addRoute)
  const addMeasurement = useProjectStore((state) => state.addMeasurement)
  const selectPin = useProjectStore((state) => state.selectPin)
  const selectLine = useProjectStore((state) => state.selectLine)
  const togglePinInSelection = useProjectStore((state) => state.togglePinInSelection)
  const clearPinSelection = useProjectStore((state) => state.clearPinSelection)
  const updateLine = useProjectStore((state) => state.updateLine)
  const removeLine = useProjectStore((state) => state.removeLine)
  const updatePin = useProjectStore((state) => state.updatePin)
  const commitMarkerDrag = useProjectStore((state) => state.commitMarkerDrag)
  const pinIconFilters = useProjectStore((state) => state.pinIconFilters)
  const togglePinIconFilter = useProjectStore((state) => state.togglePinIconFilter)
  const clearPinIconFilter = useProjectStore((state) => state.clearPinIconFilter)
  const [isPinClickInProgress, setIsPinClickInProgress] = useState(false)
  const removePins = useProjectStore((state) => state.removePins)
  const [draggingPinId, setDraggingPinId] = useState(null)
  const [hoverMeasurePoint, setHoverMeasurePoint] = useState(null)
  const [draggingMeasurePointIndex, setDraggingMeasurePointIndex] = useState(null)
  const [isPinFilterExpanded, setIsPinFilterExpanded] = useState(false)
  const {
    selectedPoiDetail,
    requestPoiDetail,
    clearPoiDetail,
  } = usePoiDetail({ mapInstanceRef })

  const visibleLayerIdSet = useMemo(
    () => new Set(layers.filter((layerItem) => layerItem.visible).map((layerItem) => layerItem.id)),
    [layers],
  )

  const visiblePins = useMemo(() => {
    const layerVisiblePins = pins.filter((pinItem) => visibleLayerIdSet.has(pinItem.layerId))
    if (!pinIconFilters.length) return layerVisiblePins
    const activeIconSet = new Set(ICON_FILTER_OPTIONS.filter((filterItem) => pinIconFilters.includes(filterItem.key)).map((filterItem) => filterItem.icon))
    return layerVisiblePins.filter((pinItem) => activeIconSet.has(pinItem.icon))
  }, [pinIconFilters, pins, visibleLayerIdSet])
  const visibleLines = useMemo(() => lines.filter((lineItem) => visibleLayerIdSet.has(lineItem.layerId)), [lines, visibleLayerIdSet])
  const visibleMeasurements = useMemo(
    () => measurements.filter((measurementItem) => visibleLayerIdSet.has(measurementItem.layerId)),
    [measurements, visibleLayerIdSet],
  )

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
    syncDraftByMode({ currentMode, actions: { cancelDraftMeasure, cancelDraftLine } })
  }, [cancelDraftLine, cancelDraftMeasure, currentMode])

  const {
    measureSegmentLabelDataList,
    measureTotalLabelData,
    previewMeasurePath,
    completeMeasureInteraction,
    handleMeasurePointDrag,
    handleMeasurePointDragStart,
    handleMeasurePointDragEnd,
    isDraggingMeasurePoint,
  } = useMeasureInteraction({
    currentMode,
    measurePath,
    hoverMeasurePoint,
    draggingMeasurePointIndex,
    activeLayerId,
    layers,
    measurements,
    setHoverMeasurePoint,
    cancelDraftMeasure,
    addMeasurement,
    setMeasurePath,
    setDraggingMeasurePointIndex,
  })

  const triggerMeasureComplete = useCallback(() => {
    if (currentMode !== TOOL_MODES.DRAW_LINE) return
    completeMeasureInteraction()
  }, [completeMeasureInteraction, currentMode])

  const requestRoute = useCallback(
    async (startPoint, endPoint, travelMode) => {
      const resolvedLayerId = activeLayerId || layers[0]?.id || null
      const routeEntity = await RouteService.createRouteEntityOrNull({
        start: startPoint,
        end: endPoint,
        travelMode,
        currentRoutes: routes,
        activeLayerId: resolvedLayerId,
      })

      if (!routeEntity) {
        setRouteStart(null)
        return
      }

      addRoute(routeEntity)
    },
    [activeLayerId, addRoute, layers, routes, setRouteStart],
  )

  const createModeEventContext = useCallback(
    (event) => {
      const latitude = event?.latLng?.lat()
      const longitude = event?.latLng?.lng()
      const clickedPoint = latitude === undefined || longitude === undefined ? null : { lat: latitude, lng: longitude }

      return {
        event,
        clickedPoint,
        currentMode,
        state: {
          clickedPoint,
          isPinClickInProgress,
          routeDraft,
          measurePath,
          draggingMeasurePointIndex: isDraggingMeasurePoint ? 0 : null,
          addMarkerDragThresholdPx: ADD_MARKER_DRAG_THRESHOLD_PX,
        },
        actions: {
          setHoverMeasurePoint,
          appendMeasurePoint,
          setRouteStart,
          requestRoute,
          selectPin,
          selectLine,
          clearPinSelection,
          setIsPinClickInProgress,
          addMarker,
        },
        refs: {
          addMarkerMouseDownPositionRef,
        },
      }
    },
    [
      addMarker,
      appendMeasurePoint,
      clearPinSelection,
      currentMode,
      isDraggingMeasurePoint,
      isPinClickInProgress,
      measurePath,
      requestRoute,
      routeDraft,
      selectLine,
      selectPin,
      setHoverMeasurePoint,
      setRouteStart,
    ],
  )

  const mapClickModeHandlerMap = useMemo(
    () => ({
      [TOOL_MODES.DRAW_LINE]: handleLineMapClick,
      [TOOL_MODES.ADD_ROUTE]: handleRouteMapClick,
      [TOOL_MODES.SELECT]: handleSelectMapClick,
      [TOOL_MODES.MEASURE_DISTANCE]: handleMeasureMapClick,
    }),
    [],
  )

  const handleMapClick = useCallback(
    (event) => {
      if (shouldIgnoreNextMapClickRef.current) {
        shouldIgnoreNextMapClickRef.current = false
        return
      }

      if (isPinClickInProgress) {
        setIsPinClickInProgress(false)
        return
      }

      if (event.placeId) {
        event.stop()
        const latitudeFromPoi = event.latLng?.lat()
        const longitudeFromPoi = event.latLng?.lng()
        if (latitudeFromPoi === undefined || longitudeFromPoi === undefined) return
        requestPoiDetail(event.placeId, { lat: latitudeFromPoi, lng: longitudeFromPoi })
        return
      }

      if (selectedPoiDetail) {
        clearPoiDetail()
      }

      const modeEventContext = createModeEventContext(event)
      const modeHandler = mapClickModeHandlerMap[currentMode]
      if (!modeHandler) return
      modeHandler(modeEventContext)
    },
    [
      createModeEventContext,
      currentMode,
      mapClickModeHandlerMap,
      requestPoiDetail,
      selectedPoiDetail,
      isPinClickInProgress,
      clearPoiDetail,
    ],
  )

  const handleMapRightClick = useCallback(
    (event) => {
      event?.domEvent?.preventDefault?.()
      shouldIgnoreNextMapClickRef.current = true
      triggerMeasureComplete()
    },
    [triggerMeasureComplete],
  )

  const handleMapMouseDown = useCallback((event) => {
    handleMarkerMouseDown(createModeEventContext(event))
  }, [createModeEventContext])

  const handleMapMouseUp = useCallback((event) => {
    handleMarkerMouseUp(createModeEventContext(event))
  }, [createModeEventContext])

  const handleMapMouseMove = useCallback(
    (event) => {
      handleLineMapMouseMove(createModeEventContext(event))
    },
    [createModeEventContext],
  )

  const handlePinClick = useCallback(
    (pinId, event) => {
      setIsPinClickInProgress(true)

      if (currentMode !== TOOL_MODES.SELECT) {
        selectPin(pinId)
        return
      }

      selectLine(null)
      if (event?.domEvent?.shiftKey || event?.domEvent?.ctrlKey || event?.domEvent?.metaKey) {
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
    triggerMeasureComplete()
  }, [triggerMeasureComplete])

  useEffect(() => {
    const handleDeleteKeyDown = (event) => {
      const eventTarget = event.target
      const isInputControlTarget =
        eventTarget instanceof HTMLElement
        && (eventTarget.tagName === 'INPUT'
          || eventTarget.tagName === 'TEXTAREA'
          || eventTarget.tagName === 'SELECT'
          || eventTarget.isContentEditable)
      if (isInputControlTarget && event.key !== 'Escape') return

      if (event.key === 'Escape') {
        triggerMeasureComplete()
        return
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
    triggerMeasureComplete,
    currentMode,
    removeLine,
    removePins,
    selectedLine,
    selectedLineId,
    selectedPinIds,
    setHoverMeasurePoint,
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
        onMouseUp={handleMapMouseUp}
        onMouseMove={handleMapMouseMove}
        onMouseDown={handleMapMouseDown}
        onDblClick={handleMapDoubleClick}
        onRightClick={handleMapRightClick}
        options={{ ...mapOptions, disableDoubleClickZoom: currentMode === TOOL_MODES.DRAW_LINE }}
      >
        {visiblePins.map((pinItem, pinIndex) => (
          <PinMarker
            key={pinItem.id}
            pin={pinItem}
            onMouseDown={() => setIsPinClickInProgress(true)}
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
        <PoiDetailOverlay poiDetail={selectedPoiDetail} onClose={clearPoiDetail} />

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

        {visibleLines.map((lineItem) =>
          lineItem.points.map((linePoint, pointIndex) => (
            <Marker
              key={`${lineItem.id}-vertex-${pointIndex}`}
              position={linePoint}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: LINE_VERTEX_PIXEL_SIZE / 2,
                fillColor: '#ffffff',
                fillOpacity: 1,
                strokeColor: lineItem.color || COLOR_PRESETS.primaryBlue,
                strokeWeight: 2,
              }}
              clickable={false}
            />
          )),
        )}

        {routePaths.map((routePath, routeIndex) => (
          <Polyline key={`route-${routeIndex}`} path={routePath} options={{ strokeColor: COLOR_PRESETS.routeGreen, strokeWeight: 4, clickable: false }} />
        ))}

        <MeasureLayer
          currentMode={currentMode}
          visibleMeasurements={visibleMeasurements}
          measurePath={measurePath}
          previewMeasurePath={previewMeasurePath}
          onMeasurePointDragStart={handleMeasurePointDragStart}
          onMeasurePointDrag={handleMeasurePointDrag}
          onMeasurePointDragEnd={handleMeasurePointDragEnd}
        />

        <MeasureLabels
          measureSegmentLabelDataList={measureSegmentLabelDataList}
          measureTotalLabelData={measureTotalLabelData}
        />
      </GoogleMap>


      <div
        className={`absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-lg transition-all duration-200 ${
          isPinFilterExpanded ? 'inline-flex max-w-[92vw] items-center gap-3' : 'inline-flex w-auto items-center gap-2'
        }`}
      >
        <p className="shrink-0 text-xs font-semibold text-gray-600">지도 핀 아이콘 필터</p>

        {isPinFilterExpanded ? (
          <>
            <button
              type="button"
              onClick={clearPinIconFilter}
              disabled={!pinIconFilters.length}
              className="shrink-0 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-40"
            >
              초기화
            </button>
            <div className="flex max-w-[56vw] items-center gap-1 overflow-x-auto">
              {ICON_FILTER_OPTIONS.map((filterItem) => {
                const isActive = pinIconFilters.includes(filterItem.key)
                return (
                  <button
                    key={`map-filter-${filterItem.key}`}
                    type="button"
                    onClick={() => togglePinIconFilter(filterItem.key)}
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${isActive ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}
                  >
                    {filterItem.icon}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => setIsPinFilterExpanded(false)}
              className="shrink-0 rounded-full border border-gray-200 px-2 py-0.5 text-lg font-semibold leading-none text-gray-700 transition hover:bg-gray-100"
              aria-label="핀 아이콘 필터 접기"
              title="핀 아이콘 필터 접기"
            >
              −
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsPinFilterExpanded(true)}
            className="shrink-0 rounded-full border border-gray-200 px-2 py-0.5 text-lg font-semibold leading-none text-gray-700 transition hover:bg-gray-100"
            aria-label="핀 아이콘 필터 펼치기"
            title="핀 아이콘 필터 펼치기"
          >
            +
          </button>
        )}
      </div>

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
