import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GoogleMap, Marker, OverlayView, Polyline } from '@react-google-maps/api'
import TOOL_MODES from '../../utils/toolModes'
import { COLOR_PRESETS } from '../../utils/constants'
import useProjectStore, { createRouteId } from '../../stores/useProjectStore'
import PinMarker from './PinMarker'
import PinPopup from './PinPopup'
import { formatDistanceLabel, getMidpoint, getPathDistanceInMeters } from '../../utils/geo'
import directionsCache from '../../utils/DirectionsCache'
import { ICON_FILTER_OPTIONS } from '../../utils/constants'

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

const measureOverlayPane = OverlayView.OVERLAY_MOUSE_TARGET
const lineColorSequence = [COLOR_PRESETS.primaryBlue, COLOR_PRESETS.routeGreen, COLOR_PRESETS.measureOrange, '#8b5cf6']
const routeTravelModeList = [
  { value: 'WALKING', label: '도보' },
  { value: 'TRANSIT', label: '대중교통' },
  { value: 'DRIVING', label: '차량' },
]

const createGoogleMapsPlaceUrl = (placeId) => `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${placeId}`
const MEASURE_LINE_WIDTH = 6
const MEASURE_VERTEX_PIXEL_SIZE = 12

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

const createMeasurementEntity = (measurePointPath, activeLayerId, measurementCount) => ({
  id: `measure-${Date.now()}-${measurementCount + 1}`,
  layerId: activeLayerId,
  points: measurePointPath,
  color: COLOR_PRESETS.measureOrange,
  width: MEASURE_LINE_WIDTH,
})

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

const createRouteEntity = (
  routeId,
  routeData,
  startPoint,
  endPoint,
  activeLayerId,
  travelMode,
) => ({
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
})

const createRouteCacheData = (routeResult, routePath) => {
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

const hasRouteIdConflict = (routeId, routeList) => routeList.some((routeItem) => routeItem.id === routeId)

const createUniqueRouteId = (routeList) => {
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

function Map() {
  const mapInstanceRef = useRef(null)
  const currentMode = useProjectStore((state) => state.currentMode)
  const lines = useProjectStore((state) => state.lines)
  const measurements = useProjectStore((state) => state.measurements)
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
  const addMeasurement = useProjectStore((state) => state.addMeasurement)
  const selectPin = useProjectStore((state) => state.selectPin)
  const selectLine = useProjectStore((state) => state.selectLine)
  const togglePinInSelection = useProjectStore((state) => state.togglePinInSelection)
  const clearPinSelection = useProjectStore((state) => state.clearPinSelection)
  const addLine = useProjectStore((state) => state.addLine)
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
  const [pendingMarkerPoint, setPendingMarkerPoint] = useState(null)
  const [selectedPoiDetail, setSelectedPoiDetail] = useState(null)

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

  const requestPoiDetail = useCallback(
    (placeId, position) => {
      if (!mapInstanceRef.current || !window.google?.maps?.places?.PlacesService) return

      const placeServiceInstance = new window.google.maps.places.PlacesService(mapInstanceRef.current)
      setSelectedPoiDetail({
        placeId,
        position,
        isLoading: true,
        name: '장소 정보 불러오는 중...',
      })

      placeServiceInstance.getDetails(
        {
          placeId,
          fields: ['place_id', 'name', 'formatted_address', 'website', 'international_phone_number', 'rating'],
        },
        (placeResult, placeStatus) => {
          if (placeStatus !== window.google.maps.places.PlacesServiceStatus.OK || !placeResult) {
            setSelectedPoiDetail({
              placeId,
              position,
              isLoading: false,
              name: '장소 정보를 찾을 수 없습니다',
            })
            return
          }

          setSelectedPoiDetail({
            placeId,
            position,
            isLoading: false,
            name: placeResult.name || '이름 없음',
            address: placeResult.formatted_address || '',
            website: placeResult.website || '',
            phoneNumber: placeResult.international_phone_number || '',
            rating: placeResult.rating ?? null,
          })
        },
      )
    },
    [],
  )

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

  const completeDraftMeasure = useCallback(() => {
    if (currentMode !== TOOL_MODES.MEASURE_DISTANCE) return
    if (measurePath.length < 2) {
      cancelDraftMeasure()
      return
    }
    const targetLayerId = activeLayerId || layers[0]?.id || null
    if (!targetLayerId) {
      cancelDraftMeasure()
      return
    }
    addMeasurement(createMeasurementEntity(measurePath, targetLayerId, measurements.length))
    cancelDraftMeasure()
  }, [activeLayerId, addMeasurement, cancelDraftMeasure, currentMode, layers, measurePath, measurements.length])

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
      const routeLayerId = activeLayerId || layers[0]?.id || null
      if (!routeLayerId) {
        setRouteStart(null)
        return
      }

      const buildRouteEntity = (routeData) => {
        const routeId = createUniqueRouteId(routes)
        if (!routeId || hasRouteIdConflict(routeId, routes)) return null
        return createRouteEntity(routeId, routeData, startPoint, endPoint, routeLayerId, travelMode)
      }

      const cachedRouteData = directionsCache.get(startPoint, endPoint, travelMode)
      if (cachedRouteData) {
        const cachedRouteEntity = buildRouteEntity(cachedRouteData)
        if (!cachedRouteEntity) return
        addRoute(cachedRouteEntity)
        return
      }

      const directionsService = new window.google.maps.DirectionsService()
      directionsService.route(getRouteRequest(startPoint, endPoint, travelMode), (result, status) => {
        if (status !== window.google.maps.DirectionsStatus.OK || !result) return
        const overviewPath = result.routes[0]?.overview_path ?? []
        if (!overviewPath.length) return
        const normalizedPath = overviewPath.map((locationPoint) => ({ lat: locationPoint.lat(), lng: locationPoint.lng() }))
        const routeCacheData = createRouteCacheData(result, normalizedPath)
        directionsCache.set(startPoint, endPoint, travelMode, routeCacheData)
        const createdRouteEntity = buildRouteEntity(routeCacheData)
        if (!createdRouteEntity) return
        addRoute(createdRouteEntity)
      })
    },
    [activeLayerId, addRoute, layers, routes, setRouteStart],
  )

  const handleMapClick = useCallback(
    (event) => {
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
        setSelectedPoiDetail(null)
      }

      const latitude = event.latLng?.lat()
      const longitude = event.latLng?.lng()
      if (latitude === undefined || longitude === undefined) return
      const clickedPoint = { lat: latitude, lng: longitude }

      if (currentMode === TOOL_MODES.ADD_MARKER) {
        setPendingMarkerPoint(clickedPoint)
        return
      }

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
      requestPoiDetail,
      selectedPoiDetail,
      selectLine,
      selectPin,
      setRouteStart,
      isPinClickInProgress,
      setHoverMeasurePoint,
      setPendingMarkerPoint,
      setSelectedPoiDetail,
    ],
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
    if (currentMode === TOOL_MODES.MEASURE_DISTANCE) {
      setHoverMeasurePoint(null)
      completeDraftMeasure()
      return
    }
    if (currentMode === TOOL_MODES.DRAW_LINE) {
      completeDraftLine()
    }
  }, [completeDraftMeasure, completeDraftLine, currentMode])

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
        if (currentMode === TOOL_MODES.MEASURE_DISTANCE) {
          setHoverMeasurePoint(null)
          completeDraftMeasure()
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
    completeDraftMeasure,
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
    setPendingMarkerPoint(null)
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
        onMouseMove={handleMapMouseMove}
        onDblClick={handleMapDoubleClick}
        onRightClick={() => {
          if (currentMode === TOOL_MODES.MEASURE_DISTANCE) {
            setHoverMeasurePoint(null)
            completeDraftMeasure()
          }
        }}
        options={{ ...mapOptions, disableDoubleClickZoom: currentMode === TOOL_MODES.MEASURE_DISTANCE || currentMode === TOOL_MODES.DRAW_LINE }}
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


        {selectedPoiDetail && (
          <OverlayView position={selectedPoiDetail.position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div className="w-[320px] rounded-2xl bg-white p-4 shadow-2xl">
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">{selectedPoiDetail.name}</h3>
                <button
                  type="button"
                  onClick={() => setSelectedPoiDetail(null)}
                  className="rounded-md px-2 py-1 text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  ×
                </button>
              </div>

              {selectedPoiDetail.address ? <p className="text-sm text-slate-600">{selectedPoiDetail.address}</p> : null}
              {selectedPoiDetail.phoneNumber ? <p className="mt-1 text-sm text-slate-600">{selectedPoiDetail.phoneNumber}</p> : null}
              {selectedPoiDetail.rating !== null ? <p className="mt-2 text-sm font-semibold text-amber-600">평점 {selectedPoiDetail.rating}</p> : null}
              {selectedPoiDetail.website ? (
                <a
                  href={selectedPoiDetail.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block truncate text-sm text-blue-600 hover:underline"
                >
                  {selectedPoiDetail.website}
                </a>
              ) : null}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => window.open(createGoogleMapsPlaceUrl(selectedPoiDetail.placeId), '_blank', 'noopener,noreferrer')}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Google 지도에서 보기
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPoiDetail(null)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  닫기
                </button>
              </div>
            </div>
          </OverlayView>
        )}

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

        {visibleMeasurements.map((measurementItem) => (
          <Fragment key={measurementItem.id}>
            <Polyline
              path={measurementItem.points}
              options={{
                strokeColor: measurementItem.color || COLOR_PRESETS.measureOrange,
                strokeWeight: measurementItem.width || MEASURE_LINE_WIDTH,
                clickable: false,
                strokeOpacity: 0.95,
                icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 5 }, offset: '0', repeat: '20px' }],
              }}
            />
            {measurementItem.points.map((measurementPoint, measurementPointIndex) => (
              <Marker
                key={`${measurementItem.id}-point-${measurementPointIndex}`}
                position={measurementPoint}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: MEASURE_VERTEX_PIXEL_SIZE / 2,
                  fillColor: '#ffffff',
                  fillOpacity: 1,
                  strokeColor: '#ea580c',
                  strokeWeight: Math.max(2, MEASURE_LINE_WIDTH - 2),
                }}
                clickable={false}
              />
            ))}
          </Fragment>
        ))}

        {measurePath.length > 1 && (
          <Polyline
            path={measurePath}
            options={{
              strokeColor: COLOR_PRESETS.measureOrange,
              strokeWeight: MEASURE_LINE_WIDTH,
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
              strokeWeight: Math.max(2, MEASURE_LINE_WIDTH - 2),
              clickable: false,
              strokeOpacity: 0.45,
            }}
          />
        )}

        {measurePath.map((measurePointItem, measurePointIndex) => (
          <Marker
            key={`measure-point-${measurePointIndex}`}
            position={measurePointItem}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: MEASURE_VERTEX_PIXEL_SIZE / 2,
              fillColor: '#ffffff',
              fillOpacity: 1,
              strokeColor: '#ea580c',
              strokeWeight: Math.max(2, MEASURE_LINE_WIDTH - 2),
            }}
            draggable={currentMode === TOOL_MODES.MEASURE_DISTANCE}
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


      <div className="absolute bottom-4 left-1/2 z-20 inline-flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-lg">
        <div className="flex shrink-0 items-center gap-2">
          <p className="text-xs font-semibold text-gray-600">지도 핀 아이콘 필터</p>
          <button
            type="button"
            onClick={clearPinIconFilter}
            disabled={!pinIconFilters.length}
            className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-40"
          >
            초기화
          </button>
        </div>
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
      </div>

      {currentMode === TOOL_MODES.ADD_MARKER && pendingMarkerPoint && (
        <div className="absolute bottom-24 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow">
          <span className="text-gray-700">선택 위치에 핀을 추가할까요?</span>
          <button
            type="button"
            onClick={() => {
              addMarker(pendingMarkerPoint)
              setPendingMarkerPoint(null)
            }}
            className="rounded bg-blue-600 px-2 py-1 text-white hover:bg-blue-700"
          >
            핀 추가
          </button>
          <button
            type="button"
            onClick={() => setPendingMarkerPoint(null)}
            className="rounded border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
        </div>
      )}
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
