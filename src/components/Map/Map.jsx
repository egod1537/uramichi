import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GoogleMap } from '@react-google-maps/api'
import TOOL_MODES from '../../utils/toolModes'
import { COLOR_PRESETS } from '../../utils/constants'
import useProjectStore from '../../stores/useProjectStore'
import { handleLineMapClick, handleLineMapMouseMove } from './controllers/lineController'
import { handleMarkerMouseDown, handleMarkerMouseUp } from './controllers/markerController'
import { handleMeasureMapClick } from './controllers/measureController'
import { handleRouteMapClick } from './controllers/routeController'
import { handleSelectMapClick } from './controllers/selectController'
import { syncDraftByMode } from './controllers/syncDraftByMode'
import { ICON_FILTER_OPTIONS, getTravelPinIconKey } from '../../utils/constants'
import RouteService from '../../utils/RouteService'
import useLineInteraction from './measure/useLineInteraction'
import useDistanceMeasureInteraction from './measure/useDistanceMeasureInteraction'
import PoiDetailOverlay from './PoiDetailOverlay'
import usePoiDetail from './hooks/usePoiDetail'
import PinLayer from './layers/PinLayer'
import LineLayer from './layers/LineLayer'
import RouteLayer from './layers/RouteLayer'
import MeasureLayer from './layers/MeasureLayer'
import MapOverlays from './MapOverlays'
import {
  ADD_MARKER_DRAG_THRESHOLD_PX,
  MAP_CONTAINER_STYLE,
  MAP_DEFAULT_CENTER,
  MAP_OPTIONS,
} from './config'

const lineColorSequence = [COLOR_PRESETS.primaryBlue, COLOR_PRESETS.routeGreen, COLOR_PRESETS.measureOrange, '#8b5cf6']

const getNextLineColor = (currentColor) => {
  const currentColorIndex = lineColorSequence.indexOf(currentColor)
  if (currentColorIndex === -1) return lineColorSequence[0]
  return lineColorSequence[(currentColorIndex + 1) % lineColorSequence.length]
}

function Map() {
  const mapInstanceRef = useRef(null)
  const addMarkerMouseDownPositionRef = useRef(null)
  const shouldIgnoreNextMapClickRef = useRef(false)
  const rightClickCompleteLockRef = useRef(false)
  const currentMode = useProjectStore((state) => state.currentMode)
  const lines = useProjectStore((state) => state.lines)
  const measurements = useProjectStore((state) => state.measurements)
  const routePaths = useProjectStore((state) => state.routePaths)
  const linePath = useProjectStore((state) => state.linePath)
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
  const setMode = useProjectStore((state) => state.setMode)
  const cancelDraftLine = useProjectStore((state) => state.cancelDraftLine)
  const appendLinePoint = useProjectStore((state) => state.appendLinePoint)
  const setLinePath = useProjectStore((state) => state.setLinePath)
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
  const [isTimeFilterExpanded, setIsTimeFilterExpanded] = useState(false)
  const [timeFilterRange, setTimeFilterRange] = useState({ start: '09:00', end: '18:00' })
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
    const activeIconSet = new Set(ICON_FILTER_OPTIONS.filter((filterItem) => pinIconFilters.includes(filterItem.key)).map((filterItem) => filterItem.key))
    return layerVisiblePins.filter((pinItem) => activeIconSet.has(getTravelPinIconKey(pinItem.icon)))
  }, [pinIconFilters, pins, visibleLayerIdSet])
  const visibleLines = useMemo(() => lines.filter((lineItem) => visibleLayerIdSet.has(lineItem.layerId)), [lines, visibleLayerIdSet])
  const visibleMeasurements = useMemo(
    () => measurements.filter((measurementItem) => visibleLayerIdSet.has(measurementItem.layerId)),
    [measurements, visibleLayerIdSet],
  )
  const lineSnapPointList = useMemo(
    () => [...visibleLines.flatMap((lineItem) => lineItem.points), ...visibleMeasurements.flatMap((measurementItem) => measurementItem.points)],
    [visibleLines, visibleMeasurements],
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
    lineSegmentLabelDataList,
    lineTotalLabelData,
    linePreviewPath,
    completeLineInteraction,
    handleLineDraftPointDrag,
    handleLineDraftPointDragStart,
    handleLineDraftPointDragEnd,
    isLinePointDragging,
  } = useLineInteraction({
    linePath,
    hoverMeasurePoint,
    draggingMeasurePointIndex,
    activeLayerId,
    layers,
    measurements,
    setHoverMeasurePoint,
    cancelDraftLine,
    addMeasurement,
    setLinePath,
    setDraggingMeasurePointIndex,
    setMode,
  })

  const {
    measureSegmentLabelDataList,
    measureTotalLabelData,
    previewMeasurePath,
    completeDistanceMeasureInteraction,
    completeDistanceMeasureInteractionByContextMenu,
    completeDistanceMeasureInteractionByEscape,
    handleMeasurePointDrag,
    handleMeasurePointDragStart,
    handleMeasurePointDragEnd,
    isMeasurePointDragging,
  } = useDistanceMeasureInteraction({
    measurePath,
    hoverMeasurePoint,
    draggingMeasurePointIndex,
    setHoverMeasurePoint,
    cancelDraftMeasure,
    setMeasurePath,
    setDraggingMeasurePointIndex,
    setMode,
  })

  const isDraggingDraftPoint = isLinePointDragging || isMeasurePointDragging

  const activeSegmentLabelDataList = currentMode === TOOL_MODES.DRAW_LINE ? lineSegmentLabelDataList : measureSegmentLabelDataList
  const activeTotalLabelData = currentMode === TOOL_MODES.DRAW_LINE ? lineTotalLabelData : measureTotalLabelData
  const activeDraftPath = currentMode === TOOL_MODES.DRAW_LINE ? linePath : measurePath
  const activePreviewPath = currentMode === TOOL_MODES.DRAW_LINE ? linePreviewPath : previewMeasurePath
  const activeHandleDraftPointDragStart =
    currentMode === TOOL_MODES.DRAW_LINE ? handleLineDraftPointDragStart : handleMeasurePointDragStart
  const activeHandleDraftPointDrag =
    currentMode === TOOL_MODES.DRAW_LINE ? handleLineDraftPointDrag : handleMeasurePointDrag
  const activeHandleDraftPointDragEnd =
    currentMode === TOOL_MODES.DRAW_LINE ? handleLineDraftPointDragEnd : handleMeasurePointDragEnd

  const triggerMeasureComplete = useCallback((triggerType = 'default') => {
    if (currentMode === TOOL_MODES.DRAW_LINE) {
      completeLineInteraction()
      return
    }
    if (currentMode === TOOL_MODES.MEASURE_DISTANCE) {
      if (triggerType === 'contextmenu') {
        completeDistanceMeasureInteractionByContextMenu()
        return
      }
      if (triggerType === 'escape') {
        completeDistanceMeasureInteractionByEscape()
        return
      }
      completeDistanceMeasureInteraction()
    }
  }, [
    completeDistanceMeasureInteraction,
    completeDistanceMeasureInteractionByContextMenu,
    completeDistanceMeasureInteractionByEscape,
    completeLineInteraction,
    currentMode,
  ])

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
          linePath,
          measurePath,
          draggingMeasurePointIndex: isDraggingDraftPoint ? 0 : null,
          addMarkerDragThresholdPx: ADD_MARKER_DRAG_THRESHOLD_PX,
        },
        actions: {
          setHoverMeasurePoint,
          appendLinePoint,
          appendMeasurePoint,
          setRouteStart,
          requestRoute,
          selectPin,
          selectLine,
          clearPinSelection,
          setIsPinClickInProgress,
          addMarker,
          setMode,
          lineSnapPointList,
        },
        refs: {
          addMarkerMouseDownPositionRef,
        },
      }
    },
    [
      addMarker,
      appendLinePoint,
      appendMeasurePoint,
      clearPinSelection,
      currentMode,
      isDraggingDraftPoint,
      isPinClickInProgress,
      linePath,
      measurePath,
      requestRoute,
      routeDraft,
      selectLine,
      selectPin,
      setHoverMeasurePoint,
      setRouteStart,
      setMode,
      lineSnapPointList,
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
        if (currentMode === TOOL_MODES.MEASURE_DISTANCE) {
          const modeEventContext = createModeEventContext(event)
          const modeHandler = mapClickModeHandlerMap[currentMode]
          if (!modeHandler) return
          modeHandler(modeEventContext)
          return
        }
        const latitudeFromPoi = event.latLng?.lat()
        const longitudeFromPoi = event.latLng?.lng()
        if (latitudeFromPoi === undefined || longitudeFromPoi === undefined) return
        if (selectedPinId) {
          selectPin(null)
          clearPinSelection()
        }
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
      clearPinSelection,
      createModeEventContext,
      currentMode,
      mapClickModeHandlerMap,
      requestPoiDetail,
      selectPin,
      selectedPoiDetail,
      selectedPinId,
      isPinClickInProgress,
      clearPoiDetail,
    ],
  )

  const handleMapRightClick = useCallback(
    (event) => {
      event?.domEvent?.preventDefault?.()
      if (rightClickCompleteLockRef.current) return
      rightClickCompleteLockRef.current = true
      window.setTimeout(() => {
        rightClickCompleteLockRef.current = false
      }, 0)
      shouldIgnoreNextMapClickRef.current = true
      triggerMeasureComplete('contextmenu')
    },
    [triggerMeasureComplete],
  )

  useEffect(() => {
    const mapDivElement = mapInstanceRef.current?.getDiv?.()
    if (!mapDivElement) return undefined

    const handleMapContextMenu = (event) => {
      event.preventDefault()
      if (rightClickCompleteLockRef.current) return
      rightClickCompleteLockRef.current = true
      window.setTimeout(() => {
        rightClickCompleteLockRef.current = false
      }, 0)
      shouldIgnoreNextMapClickRef.current = true
      triggerMeasureComplete('contextmenu')
    }

    mapDivElement.addEventListener('contextmenu', handleMapContextMenu)
    return () => {
      mapDivElement.removeEventListener('contextmenu', handleMapContextMenu)
    }
  }, [triggerMeasureComplete])

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
      if (selectedPoiDetail) {
        clearPoiDetail()
      }

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
    [clearPoiDetail, currentMode, selectLine, selectPin, selectedPoiDetail, togglePinInSelection, setIsPinClickInProgress],
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

  const handleAddPoiToMap = useCallback(
    (poiDetail) => {
      if (!poiDetail?.position) return
      const poiRating = typeof poiDetail.rating === 'number' ? poiDetail.rating.toFixed(1) : null
      addMarker(poiDetail.position, {
        name: poiDetail.name || 'POI',
        category: 'tour',
        memo: poiRating ? `Rating: ${poiRating}` : '',
      })
      selectPin(null)
      clearPinSelection()
      clearPoiDetail()
    },
    [addMarker, clearPinSelection, clearPoiDetail, selectPin],
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
        triggerMeasureComplete('escape')
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
    currentMode,
    removeLine,
    removePins,
    selectedLine,
    selectedLineId,
    selectedPinIds,
    updateLine,
    triggerMeasureComplete,
  ])

  return (
    <>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={MAP_DEFAULT_CENTER}
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
        onRightClick={handleMapRightClick}
        options={{
          ...MAP_OPTIONS,
          clickableIcons: currentMode !== TOOL_MODES.MEASURE_DISTANCE,
          disableDoubleClickZoom: currentMode === TOOL_MODES.DRAW_LINE,
        }}
      >
        <PinLayer
          pins={visiblePins}
          selectedPin={selectedPoiDetail ? null : selectedPin}
          selectedPinId={selectedPinId}
          currentMode={currentMode}
          isPinInteractionBlocked={currentMode === TOOL_MODES.MEASURE_DISTANCE}
          draggingPinId={draggingPinId}
          onPinMouseDown={() => setIsPinClickInProgress(true)}
          onPinClick={handlePinClick}
          onPinDragStart={handlePinDragStart}
          onPinDrag={handlePinDrag}
          onPinDragEnd={handlePinDragEnd}
        />

        <PoiDetailOverlay poiDetail={selectedPoiDetail} onClose={clearPoiDetail} onAddPoiToMap={handleAddPoiToMap} />

        <LineLayer lines={visibleLines} currentMode={currentMode} selectedLineId={selectedLineId} onLineClick={handleLineClick} />

        <RouteLayer routePaths={routePaths} />

        <MeasureLayer
          currentMode={currentMode}
          visibleMeasurements={visibleMeasurements}
          measurePath={activeDraftPath}
          previewMeasurePath={activePreviewPath}
          measureSegmentLabelDataList={activeSegmentLabelDataList}
          measureTotalLabelData={activeTotalLabelData}
          onMeasurePointDragStart={activeHandleDraftPointDragStart}
          onMeasurePointDrag={activeHandleDraftPointDrag}
          onMeasurePointDragEnd={activeHandleDraftPointDragEnd}
        />
      </GoogleMap>

      <MapOverlays
        currentMode={currentMode}
        isTimeFilterExpanded={isTimeFilterExpanded}
        isPinFilterExpanded={isPinFilterExpanded}
        pinIconFilters={pinIconFilters}
        routeDraft={routeDraft}
        timeFilterRange={timeFilterRange}
        onSetTimeFilterExpanded={setIsTimeFilterExpanded}
        onSetTimeFilterRange={(timeFieldKey, nextTimeValue) => {
          setTimeFilterRange((previousTimeFilterRange) => ({
            ...previousTimeFilterRange,
            [timeFieldKey]: nextTimeValue,
          }))
        }}
        onClearPinIconFilter={clearPinIconFilter}
        onTogglePinIconFilter={togglePinIconFilter}
        onSetPinFilterExpanded={setIsPinFilterExpanded}
        onSetRouteTravelMode={setRouteTravelMode}
      />
    </>
  )
}

export default Map
