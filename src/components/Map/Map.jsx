import React from 'react'
import { GoogleMap } from '@react-google-maps/api'
import TOOL_MODES from '../../utils/toolModes'
import { COLOR_PRESETS, MAP_DEFAULT_ZOOM } from '../../utils/config'
import useProjectStore from '../../stores/useProjectStore'
import withStore from '../../utils/withStore'
import { handleMarkerMouseDown, handleMarkerMouseUp } from './controllers/markerController'
import { handleRouteMapClick } from './controllers/routeController'
import { handleSelectMapClick } from './controllers/selectController'
import { ICON_FILTER_OPTIONS, getTravelPinIconKey } from '../../utils/opts'
import { convertTimeStringToMinutes, normalizeOpeningHours } from '../../utils/time'
import RouteService from '../../utils/RouteService'
import PoiDetailOverlay from './PoiDetailOverlay'
import PinLayer from './layers/PinLayer'
import LineLayer from './layers/LineLayer'
import RouteLayer from './layers/RouteLayer'
import MapOverlays from './MapOverlays'
import { LINE_DEFAULT_COLOR, LINE_DEFAULT_WIDTH } from '../../utils/lineStyle'
import {
  ADD_MARKER_DRAG_THRESHOLD_PX,
  MAP_CONTAINER_STYLE,
  MAP_DEFAULT_CENTER,
  MAP_OPTIONS,
} from './config'

const lineColorSequence = [COLOR_PRESETS.primaryBlue, COLOR_PRESETS.routeGreen, COLOR_PRESETS.measureOrange, '#8b5cf6']
const SNAP_PIXELS = 10
const POLYGON_CLOSE_PIXELS = 10

const getNextLineColor = (currentColor) => {
  const currentColorIndex = lineColorSequence.indexOf(currentColor)
  if (currentColorIndex === -1) return lineColorSequence[0]
  return lineColorSequence[(currentColorIndex + 1) % lineColorSequence.length]
}

const createLoadingPoiDetail = (placeId, position) => ({
  placeId,
  position,
  name: '장소 정보 불러오는 중...',
  address: '',
  website: '',
  phoneNumber: '',
  rating: null,
})

const createErrorPoiDetail = (placeId, position, fallbackData = {}) => ({
  placeId,
  position,
  name: fallbackData.name || '장소 정보를 찾을 수 없습니다',
  address: fallbackData.address || '',
  website: '',
  phoneNumber: '',
  rating: null,
})

class Map extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isPinClickInProgress: false,
      draggingPinId: null,
      recentRouteInfo: null,
      selectedPoiDetail: null,
      poiDetailStatus: 'idle',
      linePath: [],
      previewLinePoint: null,
      draggingDraftLinePointIndex: null,
      snapTargetPoint: null,
    }
    this.mapInstance = null
    this.addMarkerMouseDownPositionRef = { current: null }
    this.shouldIgnoreNextMapClick = false
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleDeleteKeyDown)
    window.addEventListener('keydown', this.handleLineKeyDown)
  }

  componentDidUpdate(previousProps) {
    const previousStore = previousProps.projectStore
    const currentStore = this.props.projectStore
    const selectedPin = this.getSelectedPin(currentStore)
    const previousSelectedPin = this.getSelectedPin(previousStore)

    if (selectedPin && (!previousSelectedPin || previousSelectedPin.id !== selectedPin.id) && this.mapInstance) {
      this.mapInstance.panTo(selectedPin.position)
    }

    if (previousStore?.poiSearchRequest !== currentStore.poiSearchRequest && currentStore.poiSearchRequest) {
      this.handlePoiSearchRequest(currentStore)
    }

    if (previousStore.currentMode === TOOL_MODES.DRAW_LINE && currentStore.currentMode !== TOOL_MODES.DRAW_LINE) {
      this.completeLineDraft()
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleDeleteKeyDown)
    window.removeEventListener('keydown', this.handleLineKeyDown)
  }

  getVisibleLayerIdSet = (projectStore) => new Set(projectStore.layers.filter((layerItem) => layerItem.visible).map((layerItem) => layerItem.id))

  getVisiblePins = (projectStore) => {
    const visibleLayerIdSet = this.getVisibleLayerIdSet(projectStore)
    const layerVisiblePins = projectStore.pins.filter((pinItem) => visibleLayerIdSet.has(pinItem.layerId))
    const timeFilterStartMinutes = convertTimeStringToMinutes(projectStore.timeFilterRange?.start)
    const timeFilterEndMinutes = convertTimeStringToMinutes(projectStore.timeFilterRange?.end)
    const hasTimeFilter = timeFilterStartMinutes !== null && timeFilterEndMinutes !== null
    const hasIconFilter = projectStore.pinIconFilters.length > 0
    if (!hasTimeFilter && !hasIconFilter) return layerVisiblePins

    const activeIconSet = new Set(ICON_FILTER_OPTIONS.filter((filterItem) => projectStore.pinIconFilters.includes(filterItem.key)).map((filterItem) => filterItem.key))
    return layerVisiblePins.filter((pinItem) => {
      const passesIconFilter = !hasIconFilter || activeIconSet.has(getTravelPinIconKey(pinItem.icon))
      if (!passesIconFilter) return false
      if (!hasTimeFilter) return true
      const normalizedOpeningHours = normalizeOpeningHours(pinItem.openingHours || [])
      if (!normalizedOpeningHours.length) return true
      return normalizedOpeningHours.some((openingHoursItem) => openingHoursItem.startMinutes < timeFilterEndMinutes && openingHoursItem.endMinutes > timeFilterStartMinutes)
    })
  }

  getVisibleLines = (projectStore) => {
    const visibleLayerIdSet = this.getVisibleLayerIdSet(projectStore)
    return projectStore.lines.filter((lineItem) => visibleLayerIdSet.has(lineItem.layerId))
  }

  getSelectedPin = (projectStore) => this.getVisiblePins(projectStore).find((pinItem) => pinItem.id === projectStore.selectedPinId) || null

  getSelectedLine = (projectStore) => this.getVisibleLines(projectStore).find((lineItem) => lineItem.id === projectStore.selectedLineId) || null

  getDistanceMeterByPixel = (referenceLat) => {
    if (!this.mapInstance) return 10
    const zoom = this.mapInstance.getZoom?.() || MAP_DEFAULT_ZOOM
    const metersPerPixel = (156543.03392 * Math.cos((referenceLat * Math.PI) / 180)) / Math.pow(2, zoom)
    return metersPerPixel
  }

  getSnappedPoint = (targetPoint, candidatePointList) => {
    if (!targetPoint || !candidatePointList.length) return { point: targetPoint, isSnapped: false }
    const meterPerPixel = this.getDistanceMeterByPixel(targetPoint.lat)
    const snapDistanceMeters = meterPerPixel * SNAP_PIXELS
    const closeDistanceMeters = meterPerPixel * POLYGON_CLOSE_PIXELS
    let nearestPoint = null
    let nearestDistanceSquared = Number.POSITIVE_INFINITY

    candidatePointList.forEach((candidatePoint) => {
      const latGap = targetPoint.lat - candidatePoint.lat
      const lngGap = targetPoint.lng - candidatePoint.lng
      const distanceSquared = latGap * latGap + lngGap * lngGap
      if (distanceSquared < nearestDistanceSquared) {
        nearestDistanceSquared = distanceSquared
        nearestPoint = candidatePoint
      }
    })

    if (!nearestPoint) return { point: targetPoint, isSnapped: false }
    const latGapMeter = (targetPoint.lat - nearestPoint.lat) * 111000
    const lngGapMeter = (targetPoint.lng - nearestPoint.lng) * 111000
    const distanceMeters = Math.hypot(latGapMeter, lngGapMeter)
    if (distanceMeters > snapDistanceMeters && distanceMeters > closeDistanceMeters) {
      return { point: targetPoint, isSnapped: false }
    }
    return { point: nearestPoint, isSnapped: true }
  }

  getLineSnapPointList = () => {
    const { projectStore } = this.props
    const storedLinePoints = projectStore.lines.flatMap((lineItem) => lineItem.points || [])
    const pinPoints = projectStore.pins.map((pinItem) => pinItem.position)
    const lineStartPoint = this.state.linePath[0] ? [this.state.linePath[0]] : []
    return [...storedLinePoints, ...pinPoints, ...lineStartPoint]
  }

  appendLinePoint = (point) => {
    const snappedResult = this.getSnappedPoint(point, this.getLineSnapPointList())
    this.setState((previousState) => ({
      linePath: [...previousState.linePath, snappedResult.point],
      previewLinePoint: null,
      snapTargetPoint: snappedResult.isSnapped ? snappedResult.point : null,
    }))
  }

  handleLineMouseMove = (event) => {
    const { projectStore } = this.props
    if (projectStore.currentMode !== TOOL_MODES.DRAW_LINE) return
    if (!this.state.linePath.length) return
    const latitude = event?.latLng?.lat()
    const longitude = event?.latLng?.lng()
    if (latitude === undefined || longitude === undefined) return
    const cursorPoint = { lat: latitude, lng: longitude }
    const snappedResult = this.getSnappedPoint(cursorPoint, this.getLineSnapPointList())
    this.setState({
      previewLinePoint: snappedResult.point,
      snapTargetPoint: snappedResult.isSnapped ? snappedResult.point : null,
    })
  }

  createLineEntity = (linePoints) => {
    const { projectStore } = this.props
    const firstPoint = linePoints[0]
    const lastPoint = linePoints[linePoints.length - 1]
    if (!firstPoint || !lastPoint) return null
    const meterPerPixel = this.getDistanceMeterByPixel(firstPoint.lat)
    const closeDistanceMeters = meterPerPixel * POLYGON_CLOSE_PIXELS
    const latGapMeter = (firstPoint.lat - lastPoint.lat) * 111000
    const lngGapMeter = (firstPoint.lng - lastPoint.lng) * 111000
    const isClosed = linePoints.length >= 3 && Math.hypot(latGapMeter, lngGapMeter) <= closeDistanceMeters
    const normalizedPoints = isClosed ? [...linePoints.slice(0, -1), firstPoint] : linePoints
    const shapeType = isClosed ? 'polygon' : 'line'
    const lineNumber = projectStore.lines.filter((lineItem) => lineItem.shapeType !== 'polygon').length + 1
    const polygonNumber = projectStore.lines.filter((lineItem) => lineItem.shapeType === 'polygon').length + 1

    return {
      id: `line-${Date.now()}-${projectStore.lines.length + 1}`,
      layerId: projectStore.activeLayerId,
      points: normalizedPoints,
      color: LINE_DEFAULT_COLOR,
      width: LINE_DEFAULT_WIDTH,
      shapeType,
      fillColor: LINE_DEFAULT_COLOR,
      fillOpacity: shapeType === 'polygon' ? 0.2 : undefined,
      name: shapeType === 'polygon' ? `도형 ${polygonNumber}` : `선 ${lineNumber}`,
      sourceType: 'line',
    }
  }

  completeLineDraft = () => {
    const { projectStore } = this.props
    if (projectStore.currentMode !== TOOL_MODES.DRAW_LINE) return
    if (this.state.linePath.length >= 2) {
      const lineEntity = this.createLineEntity(this.state.linePath)
      if (lineEntity) projectStore.addLine(lineEntity)
      projectStore.setMode(TOOL_MODES.SELECT)
    }
    this.setState({ linePath: [], previewLinePoint: null, snapTargetPoint: null, draggingDraftLinePointIndex: null })
  }

  cancelLineDraft = (shouldResetMode) => {
    const { projectStore } = this.props
    this.setState({ linePath: [], previewLinePoint: null, snapTargetPoint: null, draggingDraftLinePointIndex: null })
    if (shouldResetMode) projectStore.resetToSelectMode()
  }

  clearPoiDetail = () => {
    this.setState({ selectedPoiDetail: null, poiDetailStatus: 'idle' })
  }

  requestPoiDetail = (placeId, position, fallbackData = {}) => {
    if (!this.mapInstance || !window.google?.maps?.places?.PlacesService || !placeId) {
      this.setState({
        selectedPoiDetail: {
          placeId: placeId || `search-${Date.now()}`,
          position,
          name: fallbackData.name || 'POI',
          address: fallbackData.address || '',
          website: '',
          phoneNumber: '',
          rating: typeof fallbackData.rating === 'number' ? fallbackData.rating : null,
        },
        poiDetailStatus: 'success',
      })
      return
    }

    this.setState({ selectedPoiDetail: createLoadingPoiDetail(placeId, position), poiDetailStatus: 'loading' })
    const placeServiceInstance = new window.google.maps.places.PlacesService(this.mapInstance)
    placeServiceInstance.getDetails(
      {
        placeId,
        fields: ['place_id', 'name', 'formatted_address', 'website', 'international_phone_number', 'rating'],
      },
      (placeResult, placeStatus) => {
        if (placeStatus !== window.google.maps.places.PlacesServiceStatus.OK || !placeResult) {
          this.setState({ selectedPoiDetail: createErrorPoiDetail(placeId, position, fallbackData), poiDetailStatus: 'error' })
          return
        }
        this.setState({
          selectedPoiDetail: {
            placeId,
            position,
            name: placeResult.name || '이름 없음',
            address: placeResult.formatted_address || '',
            website: placeResult.website || '',
            phoneNumber: placeResult.international_phone_number || '',
            rating: placeResult.rating ?? null,
          },
          poiDetailStatus: 'success',
        })
      },
    )
  }

  handlePoiSearchRequest = (projectStore) => {
    const searchPosition = projectStore.poiSearchRequest.position
    if (this.mapInstance && searchPosition) {
      this.mapInstance.panTo(searchPosition)
      this.mapInstance.setZoom?.(16)
    }
    if (projectStore.selectedPinId) {
      projectStore.selectPin(null)
      projectStore.clearPinSelection()
    }
    if (projectStore.poiSearchRequest.placeId) {
      this.requestPoiDetail(projectStore.poiSearchRequest.placeId, searchPosition)
      projectStore.consumePoiSearchRequest()
      return
    }
    this.requestPoiDetail(null, searchPosition, {
      name: projectStore.poiSearchRequest.name || 'POI',
      address: projectStore.poiSearchRequest.address || '',
      rating: projectStore.poiSearchRequest.rating,
    })
    projectStore.consumePoiSearchRequest()
  }

  requestRoute = async (startPoint, endPoint, travelMode) => {
    const { projectStore } = this.props
    const resolvedLayerId = projectStore.activeLayerId || projectStore.layers[0]?.id || null
    const routeEntity = await RouteService.createRouteEntityOrNull({
      start: startPoint,
      end: endPoint,
      travelMode,
      currentRoutes: projectStore.routes,
      activeLayerId: resolvedLayerId,
    })
    if (!routeEntity) {
      projectStore.setRouteStart(null)
      return
    }
    projectStore.addRoute(routeEntity)
    this.setState({ recentRouteInfo: routeEntity })
  }

  createModeEventContext = (event) => {
    const { projectStore } = this.props
    const latitude = event?.latLng?.lat()
    const longitude = event?.latLng?.lng()
    const clickedPoint = latitude === undefined || longitude === undefined ? null : { lat: latitude, lng: longitude }

    return {
      event,
      clickedPoint,
      currentMode: projectStore.currentMode,
      state: {
        clickedPoint,
        isPinClickInProgress: this.state.isPinClickInProgress,
        routeDraft: projectStore.routeDraft,
        addMarkerDragThresholdPx: ADD_MARKER_DRAG_THRESHOLD_PX,
      },
      actions: {
        setRouteStart: projectStore.setRouteStart,
        requestRoute: this.requestRoute,
        setRecentRouteInfo: (value) => this.setState({ recentRouteInfo: value }),
        selectPin: projectStore.selectPin,
        selectLine: projectStore.selectLine,
        clearPinSelection: projectStore.clearPinSelection,
        setIsPinClickInProgress: (value) => this.setState({ isPinClickInProgress: value }),
        addMarker: projectStore.addMarker,
        setMode: projectStore.setMode,
      },
      refs: {
        addMarkerMouseDownPositionRef: this.addMarkerMouseDownPositionRef,
      },
    }
  }

  handleMapClick = (event) => {
    const { projectStore } = this.props
    const mapClickModeHandlerMap = {
      [TOOL_MODES.ADD_ROUTE]: handleRouteMapClick,
      [TOOL_MODES.SELECT]: handleSelectMapClick,
    }
    if (this.shouldIgnoreNextMapClick) {
      this.shouldIgnoreNextMapClick = false
      return
    }
    if (this.state.isPinClickInProgress) {
      this.setState({ isPinClickInProgress: false })
      return
    }

    const latitude = event?.latLng?.lat()
    const longitude = event?.latLng?.lng()
    const clickedPoint = latitude === undefined || longitude === undefined ? null : { lat: latitude, lng: longitude }

    if (projectStore.currentMode === TOOL_MODES.DRAW_LINE) {
      if (event.placeId) event.stop()
      if (!clickedPoint) return
      this.appendLinePoint(clickedPoint)
      return
    }

    if (event.placeId) {
      event.stop()
      if (projectStore.currentMode === TOOL_MODES.ADD_MARKER) return
      if (!clickedPoint) return
      if (projectStore.selectedPinId) {
        projectStore.selectPin(null)
        projectStore.clearPinSelection()
      }
      this.requestPoiDetail(event.placeId, clickedPoint)
      return
    }

    if (this.state.selectedPoiDetail) this.clearPoiDetail()
    mapClickModeHandlerMap[projectStore.currentMode]?.(this.createModeEventContext(event))
  }

  handleMapDoubleClick = (event) => {
    if (this.props.projectStore.currentMode !== TOOL_MODES.DRAW_LINE) return
    event?.stop?.()
    this.completeLineDraft()
  }

  handleMapRightClick = (event) => {
    if (this.props.projectStore.currentMode !== TOOL_MODES.DRAW_LINE) return
    event?.domEvent?.preventDefault?.()
    this.completeLineDraft()
    this.shouldIgnoreNextMapClick = true
  }

  handleMapMouseDown = (event) => {
    handleMarkerMouseDown(this.createModeEventContext(event))
  }

  handleMapMouseUp = (event) => {
    handleMarkerMouseUp(this.createModeEventContext(event))
  }

  handlePinClick = (pinId, event) => {
    const { projectStore } = this.props
    this.setState({ isPinClickInProgress: true })
    if (this.state.selectedPoiDetail) this.clearPoiDetail()

    if (projectStore.currentMode !== TOOL_MODES.SELECT) {
      projectStore.selectPin(pinId)
      return
    }

    projectStore.selectLine(null)
    if (event?.domEvent?.shiftKey || event?.domEvent?.ctrlKey || event?.domEvent?.metaKey) {
      projectStore.togglePinInSelection(pinId)
      return
    }
    projectStore.selectPin(pinId)
  }

  handleLineClick = (lineId) => {
    const { projectStore } = this.props
    if (projectStore.currentMode !== TOOL_MODES.SELECT) return
    projectStore.selectPin(null)
    projectStore.clearPinSelection()
    projectStore.selectLine(lineId)
  }

  updateLinePointByIndex = (lineId, linePointIndex, event) => {
    const { projectStore } = this.props
    if (projectStore.currentMode !== TOOL_MODES.SELECT) return
    const latitude = event?.latLng?.lat()
    const longitude = event?.latLng?.lng()
    if (latitude === undefined || longitude === undefined) return

    const targetLine = projectStore.lines.find((lineItem) => lineItem.id === lineId)
    if (!targetLine) return

    const snapCandidates = [...projectStore.pins.map((pinItem) => pinItem.position), ...projectStore.lines.flatMap((lineItem) => lineItem.points)]
    const snappedResult = this.getSnappedPoint({ lat: latitude, lng: longitude }, snapCandidates)
    this.setState({ snapTargetPoint: snappedResult.isSnapped ? snappedResult.point : null })

    const nextLinePointList = targetLine.points.map((linePoint, pointIndex) =>
      pointIndex === linePointIndex ? snappedResult.point : linePoint,
    )

    const isClosedShape =
      targetLine.shapeType === 'polygon'
      && targetLine.points.length > 2
      && targetLine.points[0].lat === targetLine.points[targetLine.points.length - 1].lat
      && targetLine.points[0].lng === targetLine.points[targetLine.points.length - 1].lng
    if (isClosedShape) {
      const lastPointIndex = nextLinePointList.length - 1
      if (linePointIndex === 0) {
        nextLinePointList[lastPointIndex] = snappedResult.point
      }
      if (linePointIndex === lastPointIndex) {
        nextLinePointList[0] = snappedResult.point
      }
    }

    projectStore.updateLine(lineId, { points: nextLinePointList })
  }

  handleLinePointDragStart = (lineId) => {
    const { projectStore } = this.props
    if (projectStore.currentMode !== TOOL_MODES.SELECT) return
    if (projectStore.selectedLineId !== lineId) projectStore.selectLine(lineId)
  }

  handleLinePointDrag = (lineId, linePointIndex, event) => {
    this.updateLinePointByIndex(lineId, linePointIndex, event)
  }

  handleLinePointDragEnd = (lineId, linePointIndex, event) => {
    this.updateLinePointByIndex(lineId, linePointIndex, event)
    this.setState({ snapTargetPoint: null })
  }

  handleDraftLinePointDragStart = (linePointIndex) => {
    this.setState({ draggingDraftLinePointIndex: linePointIndex })
  }

  handleDraftLinePointDrag = (linePointIndex, event) => {
    const latitude = event?.latLng?.lat()
    const longitude = event?.latLng?.lng()
    if (latitude === undefined || longitude === undefined) return
    const draggedPoint = { lat: latitude, lng: longitude }
    const snapCandidates = this.getLineSnapPointList().filter((pointItem, pointIndex) => pointIndex !== linePointIndex)
    const snappedResult = this.getSnappedPoint(draggedPoint, snapCandidates)
    this.setState((previousState) => ({
      linePath: previousState.linePath.map((linePoint, currentIndex) => (currentIndex === linePointIndex ? snappedResult.point : linePoint)),
      snapTargetPoint: snappedResult.isSnapped ? snappedResult.point : null,
    }))
  }

  handleDraftLinePointDragEnd = (linePointIndex, event) => {
    this.handleDraftLinePointDrag(linePointIndex, event)
    this.setState({ draggingDraftLinePointIndex: null, snapTargetPoint: null })
  }

  handleAddPoiToMap = (poiDetail) => {
    const { projectStore } = this.props
    if (!poiDetail?.position) return
    const poiRating = typeof poiDetail.rating === 'number' ? poiDetail.rating.toFixed(1) : null
    projectStore.addMarker(poiDetail.position, {
      name: poiDetail.name || 'POI',
      category: 'tour',
      memo: poiRating ? `Rating: ${poiRating}` : '',
    })
    projectStore.selectPin(null)
    projectStore.clearPinSelection()
    this.clearPoiDetail()
  }

  handlePinDragStart = (pinId) => {
    if (this.props.projectStore.currentMode !== TOOL_MODES.SELECT) return
    this.setState({ draggingPinId: pinId })
  }

  handlePinDrag = (pinId, event) => {
    const { projectStore } = this.props
    if (projectStore.currentMode !== TOOL_MODES.SELECT) return
    const latitude = event.latLng?.lat()
    const longitude = event.latLng?.lng()
    if (latitude === undefined || longitude === undefined) return
    projectStore.updatePin(pinId, { position: { lat: latitude, lng: longitude } })
  }

  handlePinDragEnd = (pinId, event) => {
    const { projectStore } = this.props
    if (projectStore.currentMode !== TOOL_MODES.SELECT) return
    const latitude = event.latLng?.lat()
    const longitude = event.latLng?.lng()
    if (latitude === undefined || longitude === undefined) {
      this.setState({ draggingPinId: null })
      return
    }
    projectStore.updatePin(pinId, { position: { lat: latitude, lng: longitude } })
    projectStore.commitMarkerDrag()
    this.setState({ draggingPinId: null })
  }

  handleLineStyleChange = (lineId, patchData) => {
    this.props.projectStore.updateLine(lineId, patchData)
  }

  handleLineDelete = (lineId) => {
    this.props.projectStore.removeLine(lineId)
  }

  handleLineKeyDown = (event) => {
    const { projectStore } = this.props
    if (projectStore.currentMode !== TOOL_MODES.DRAW_LINE) return
    if (event.key === 'Escape') {
      event.preventDefault()
      this.cancelLineDraft(true)
      return
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      this.setState((previousState) => ({
        linePath: previousState.linePath.slice(0, -1),
        previewLinePoint: null,
        snapTargetPoint: null,
      }))
    }
  }

  handleDeleteKeyDown = (event) => {
    const { projectStore } = this.props
    const eventTarget = event.target
    const isInputControlTarget =
      eventTarget instanceof HTMLElement
      && (eventTarget.tagName === 'INPUT'
        || eventTarget.tagName === 'TEXTAREA'
        || eventTarget.tagName === 'SELECT'
        || eventTarget.isContentEditable)
    if (isInputControlTarget && event.key !== 'Escape') return

    if (event.key === 'Escape') {
      this.props.projectStore.resetToSelectMode()
      return
    }
    if (projectStore.currentMode !== TOOL_MODES.SELECT) return

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (projectStore.selectedPinIds.length) {
        event.preventDefault()
        projectStore.removePins(projectStore.selectedPinIds)
        return
      }
      if (projectStore.selectedLineId) {
        event.preventDefault()
        projectStore.removeLine(projectStore.selectedLineId)
      }
    }

    if (event.key.toLowerCase() === 'c') {
      const selectedLine = this.getSelectedLine(projectStore)
      if (!selectedLine) return
      event.preventDefault()
      projectStore.updateLine(selectedLine.id, { color: getNextLineColor(selectedLine.color) })
    }
  }

  render() {
    const { projectStore } = this.props
    const {
      recentRouteInfo,
      draggingPinId,
      selectedPoiDetail,
      linePath,
      previewLinePoint,
      snapTargetPoint,
    } = this.state

    const visiblePins = this.getVisiblePins(projectStore)
    const visibleLines = this.getVisibleLines(projectStore)
    const selectedPin = this.getSelectedPin(projectStore)
    const selectedLine = this.getSelectedLine(projectStore)
    const previewLinePath = previewLinePoint && linePath.length ? [...linePath, previewLinePoint] : []

    return (
      <>
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={MAP_DEFAULT_CENTER}
          zoom={MAP_DEFAULT_ZOOM}
          onLoad={(loadedMap) => {
            this.mapInstance = loadedMap
          }}
          onUnmount={() => {
            this.mapInstance = null
          }}
          onClick={this.handleMapClick}
          onDblClick={this.handleMapDoubleClick}
          onMouseMove={this.handleLineMouseMove}
          onRightClick={this.handleMapRightClick}
          onMouseUp={this.handleMapMouseUp}
          onMouseDown={this.handleMapMouseDown}
          options={{
            ...MAP_OPTIONS,
            clickableIcons: projectStore.currentMode !== TOOL_MODES.ADD_MARKER && projectStore.currentMode !== TOOL_MODES.DRAW_LINE,
            draggableCursor: projectStore.currentMode === TOOL_MODES.DRAW_LINE ? 'crosshair' : undefined,
          }}
        >
          <PinLayer
            pins={visiblePins}
            selectedPin={selectedPoiDetail ? null : selectedPin}
            selectedPinId={projectStore.selectedPinId}
            currentMode={projectStore.currentMode}
            isPinInteractionBlocked={false}
            draggingPinId={draggingPinId}
            onPinMouseDown={() => this.setState({ isPinClickInProgress: true })}
            onPinClick={this.handlePinClick}
            onPinDragStart={this.handlePinDragStart}
            onPinDrag={this.handlePinDrag}
            onPinDragEnd={this.handlePinDragEnd}
          />

          <PoiDetailOverlay poiDetail={selectedPoiDetail} onClose={this.clearPoiDetail} onAddPoiToMap={this.handleAddPoiToMap} />

          <LineLayer
            lines={visibleLines}
            currentMode={projectStore.currentMode}
            selectedLine={selectedLine}
            selectedLineId={projectStore.selectedLineId}
            linePath={linePath}
            previewLinePath={previewLinePath}
            snapTargetPoint={snapTargetPoint}
            onLineClick={this.handleLineClick}
            onLineStyleChange={this.handleLineStyleChange}
            onLineDelete={this.handleLineDelete}
            onLinePointDragStart={this.handleLinePointDragStart}
            onLinePointDrag={this.handleLinePointDrag}
            onLinePointDragEnd={this.handleLinePointDragEnd}
            onLineDraftPointDragStart={this.handleDraftLinePointDragStart}
            onLineDraftPointDrag={this.handleDraftLinePointDrag}
            onLineDraftPointDragEnd={this.handleDraftLinePointDragEnd}
          />

          <RouteLayer routePaths={projectStore.routePaths} />
        </GoogleMap>

        <MapOverlays
          currentMode={projectStore.currentMode}
          routeDraft={projectStore.routeDraft}
          recentRouteInfo={recentRouteInfo}
          onSetRouteTravelMode={projectStore.setRouteTravelMode}
          onCloseRouteSummary={() => this.setState({ recentRouteInfo: null })}
        />
      </>
    )
  }
}

const ConnectedMap = withStore(Map, { projectStore: useProjectStore })

export default ConnectedMap
