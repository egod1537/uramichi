import React, { Component, createRef } from 'react'
import { GoogleMap } from '@react-google-maps/api'
import TOOL_MODES from '../../utils/toolModes'
import { COLOR_PRESETS, MAP_DEFAULT_ZOOM, TIME_FILTER_DEFAULT_RANGE } from '../../utils/config'
import useProjectStore from '../../stores/useProjectStore'
import withStore from '../../utils/withStore'
import { handleLineMapClick, handleLineMapMouseMove, handleLineDraftComplete, handleLineMeasurePointDrag } from './controllers/lineController'
import { handleMarkerMouseDown, handleMarkerMouseUp } from './controllers/markerController'
import { handleMeasureMapClick } from './controllers/measureController'
import { handleRouteMapClick } from './controllers/routeController'
import { handleSelectMapClick } from './controllers/selectController'
import { syncDraftByMode } from './controllers/syncDraftByMode'
import { ICON_FILTER_OPTIONS, getTravelPinIconKey } from '../../utils/opts'
import RouteService from '../../utils/RouteService'
import PoiDetailOverlay from './PoiDetailOverlay'
import PinLayer from './layers/PinLayer'
import LineLayer from './layers/LineLayer'
import RouteLayer from './layers/RouteLayer'
import MeasureLayer from './layers/MeasureLayer'
import MapOverlays from './MapOverlays'
import { formatDistanceLabel, getHaversineDistance, getMidpoint, getPathDistanceInMeters } from '../../utils/geo'
import { LINE_DEFAULT_COLOR, LINE_DEFAULT_WIDTH } from '../../utils/lineStyle'
import { POLYGON_CLOSE_DISTANCE_METERS } from './measure/constants'
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

class Map extends Component {
  constructor(props) {
    super(props)
    this.mapInstanceRef = createRef()
    this.addMarkerMouseDownPositionRef = createRef()
    this.shouldIgnoreNextMapClick = false
    this.rightClickCompleteLock = false
    this.state = {
      isPinClickInProgress: false,
      draggingPinId: null,
      hoverMeasurePoint: null,
      draggingMeasurePointIndex: null,
      isPinFilterExpanded: false,
      isTimeFilterExpanded: false,
      timeFilterRange: TIME_FILTER_DEFAULT_RANGE,
      recentRouteInfo: null,
      selectedPoiDetail: null,
      poiDetailStatus: 'idle',
    }
    this.mapContextMenuElement = null
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleDeleteKeyDown)
  }

  componentDidUpdate(previousProps) {
    const { projectStore } = this.props
    if (projectStore.selectedPinId !== previousProps.projectStore.selectedPinId) {
      const selectedPin = this.getSelectedPin()
      if (this.mapInstanceRef.current && selectedPin) {
        this.mapInstanceRef.current.panTo(selectedPin.position)
      }
    }

    if (projectStore.poiSearchRequest && projectStore.poiSearchRequest !== previousProps.projectStore.poiSearchRequest) {
      this.handlePoiSearchRequest(projectStore.poiSearchRequest)
    }

    if (projectStore.currentMode !== previousProps.projectStore.currentMode) {
      this.syncDraftByMode(projectStore.currentMode)
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleDeleteKeyDown)
    this.detachMapContextMenuListener()
  }

  getVisibleLayerIdSet() {
    const { layers } = this.props.projectStore
    return new Set(layers.filter((layerItem) => layerItem.visible).map((layerItem) => layerItem.id))
  }

  getVisiblePins() {
    const { pins, pinIconFilters } = this.props.projectStore
    const visibleLayerIdSet = this.getVisibleLayerIdSet()
    const layerVisiblePins = pins.filter((pinItem) => visibleLayerIdSet.has(pinItem.layerId))
    if (!pinIconFilters.length) return layerVisiblePins
    const activeIconSet = new Set(ICON_FILTER_OPTIONS.filter((filterItem) => pinIconFilters.includes(filterItem.key)).map((filterItem) => filterItem.key))
    return layerVisiblePins.filter((pinItem) => activeIconSet.has(getTravelPinIconKey(pinItem.icon)))
  }

  getVisibleLines() {
    const { lines } = this.props.projectStore
    const visibleLayerIdSet = this.getVisibleLayerIdSet()
    return lines.filter((lineItem) => visibleLayerIdSet.has(lineItem.layerId))
  }

  getSelectedPin() {
    const { selectedPinId } = this.props.projectStore
    return this.getVisiblePins().find((pinItem) => pinItem.id === selectedPinId) || null
  }

  syncDraftByMode(currentMode) {
    const { cancelDraftMeasure, cancelDraftLine } = this.props.projectStore
    syncDraftByMode({ currentMode, actions: { cancelDraftMeasure, cancelDraftLine } })
  }

  setMapInstance = (loadedMap) => {
    this.mapInstanceRef.current = loadedMap
    this.attachMapContextMenuListener()
  }

  clearMapInstance = () => {
    this.detachMapContextMenuListener()
    this.mapInstanceRef.current = null
  }

  attachMapContextMenuListener() {
    this.detachMapContextMenuListener()
    const mapDivElement = this.mapInstanceRef.current?.getDiv?.()
    if (!mapDivElement) return
    this.mapContextMenuElement = mapDivElement
    mapDivElement.addEventListener('contextmenu', this.handleMapContextMenu)
  }

  detachMapContextMenuListener() {
    if (!this.mapContextMenuElement) return
    this.mapContextMenuElement.removeEventListener('contextmenu', this.handleMapContextMenu)
    this.mapContextMenuElement = null
  }

  handlePoiSearchRequest(poiSearchRequest) {
    const { selectedPinId, selectPin, clearPinSelection, consumePoiSearchRequest } = this.props.projectStore
    const searchPosition = poiSearchRequest.position
    if (this.mapInstanceRef.current && searchPosition) {
      this.mapInstanceRef.current.panTo(searchPosition)
      this.mapInstanceRef.current.setZoom?.(16)
    }

    if (selectedPinId) {
      selectPin(null)
      clearPinSelection()
    }

    if (poiSearchRequest.placeId) {
      this.requestPoiDetail(poiSearchRequest.placeId, searchPosition)
      consumePoiSearchRequest()
      return
    }

    this.requestPoiDetail(null, searchPosition, {
      name: poiSearchRequest.name || 'POI',
      address: poiSearchRequest.address || '',
      rating: poiSearchRequest.rating,
    })
    consumePoiSearchRequest()
  }

  requestPoiDetail = (placeId, position, fallbackData = {}) => {
    if (!this.mapInstanceRef.current || !window.google?.maps?.places?.PlacesService || !placeId) {
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
    const placeServiceInstance = new window.google.maps.places.PlacesService(this.mapInstanceRef.current)
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

  clearPoiDetail = () => {
    this.setState({ selectedPoiDetail: null, poiDetailStatus: 'idle' })
  }

  createLineEntity(linePointPath, activeLayerId, lineCount) {
    const firstPoint = linePointPath[0]
    const lastPoint = linePointPath[linePointPath.length - 1]
    const isLoopClosed = linePointPath.length >= 3 && getHaversineDistance(firstPoint, lastPoint) <= POLYGON_CLOSE_DISTANCE_METERS
    const shapeType = isLoopClosed ? 'polygon' : 'line'
    const pointsForPolygon =
      shapeType === 'polygon' && firstPoint && lastPoint && (firstPoint.lat !== lastPoint.lat || firstPoint.lng !== lastPoint.lng)
        ? [...linePointPath, firstPoint]
        : linePointPath

    return {
      id: `line-${Date.now()}-${lineCount + 1}`,
      layerId: activeLayerId,
      points: pointsForPolygon,
      color: LINE_DEFAULT_COLOR,
      width: LINE_DEFAULT_WIDTH,
      shapeType,
      sourceType: 'line',
    }
  }

  getLinePreviewPath() {
    const { linePath } = this.props.projectStore
    const { hoverMeasurePoint } = this.state
    if (!linePath.length || !hoverMeasurePoint) return []
    return [...linePath, hoverMeasurePoint]
  }

  getPreviewMeasurePath() {
    const { measurePath } = this.props.projectStore
    const { hoverMeasurePoint } = this.state
    if (!measurePath.length || !hoverMeasurePoint) return []
    return [...measurePath, hoverMeasurePoint]
  }

  getMeasureSegmentLabelDataList() {
    const { measurePath } = this.props.projectStore
    return measurePath.slice(1).map((currentPoint, pointIndex) => {
      const previousPoint = measurePath[pointIndex]
      const segmentDistanceInMeters = getPathDistanceInMeters([previousPoint, currentPoint])
      return {
        id: `measure-segment-${pointIndex + 1}`,
        position: getMidpoint(previousPoint, currentPoint),
        label: formatDistanceLabel(segmentDistanceInMeters),
      }
    })
  }

  getMeasureTotalLabelData() {
    const { measurePath } = this.props.projectStore
    const totalDistanceInMeters = getPathDistanceInMeters(measurePath)
    if (!totalDistanceInMeters) return null
    const terminalPoint = measurePath[measurePath.length - 1]
    return { id: 'measure-total', position: terminalPoint, label: `총 ${formatDistanceLabel(totalDistanceInMeters)}` }
  }

  triggerMeasureComplete = (triggerType = 'default') => {
    const { currentMode, cancelDraftMeasure, setMode } = this.props.projectStore
    if (currentMode === TOOL_MODES.DRAW_LINE) {
      const { linePath, activeLayerId, layers, lines, cancelDraftLine, addLine } = this.props.projectStore
      handleLineDraftComplete({
        currentMode: TOOL_MODES.DRAW_LINE,
        state: { linePath, activeLayerId, layers, lines, createLineEntity: this.createLineEntity },
        actions: {
          setHoverMeasurePoint: (value) => this.setState({ hoverMeasurePoint: value }),
          cancelDraftLine,
          addLine,
          setMode,
        },
      })
      return
    }

    if (currentMode === TOOL_MODES.MEASURE_DISTANCE) {
      if (triggerType === 'escape') {
        this.setState({ hoverMeasurePoint: null, draggingMeasurePointIndex: null })
        cancelDraftMeasure()
        setMode?.(TOOL_MODES.SELECT)
        return
      }
      this.setState({ hoverMeasurePoint: null, draggingMeasurePointIndex: null })
      cancelDraftMeasure()
      if (triggerType === 'contextmenu') {
        setMode?.(TOOL_MODES.MEASURE_DISTANCE)
      }
    }
  }

  requestRoute = async (startPoint, endPoint, travelMode) => {
    const { activeLayerId, layers, routes, setRouteStart, addRoute } = this.props.projectStore
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
    this.setState({ recentRouteInfo: routeEntity })
  }

  createModeEventContext(event) {
    const { currentMode, routeDraft, linePath, measurePath, appendLinePoint, appendMeasurePoint, setRouteStart, selectPin, selectLine, clearPinSelection, addMarker, setMode } = this.props.projectStore
    const latitude = event?.latLng?.lat()
    const longitude = event?.latLng?.lng()
    const clickedPoint = latitude === undefined || longitude === undefined ? null : { lat: latitude, lng: longitude }
    const lineSnapPointList = this.getVisibleLines().flatMap((lineItem) => lineItem.points)

    return {
      event,
      clickedPoint,
      currentMode,
      state: {
        clickedPoint,
        isPinClickInProgress: this.state.isPinClickInProgress,
        routeDraft,
        linePath,
        measurePath,
        draggingMeasurePointIndex: this.state.draggingMeasurePointIndex !== null ? 0 : null,
        addMarkerDragThresholdPx: ADD_MARKER_DRAG_THRESHOLD_PX,
      },
      actions: {
        setHoverMeasurePoint: (hoverMeasurePoint) => this.setState({ hoverMeasurePoint }),
        appendLinePoint,
        appendMeasurePoint,
        setRouteStart,
        requestRoute: this.requestRoute,
        setRecentRouteInfo: (recentRouteInfo) => this.setState({ recentRouteInfo }),
        selectPin,
        selectLine,
        clearPinSelection,
        setIsPinClickInProgress: (isPinClickInProgress) => this.setState({ isPinClickInProgress }),
        addMarker,
        setMode,
        lineSnapPointList,
      },
      refs: {
        addMarkerMouseDownPositionRef: this.addMarkerMouseDownPositionRef,
      },
    }
  }

  handleMapClick = (event) => {
    const { currentMode, selectedPinId, selectPin, clearPinSelection } = this.props.projectStore
    const isLineOrMeasureMode = currentMode === TOOL_MODES.DRAW_LINE || currentMode === TOOL_MODES.MEASURE_DISTANCE
    if (isLineOrMeasureMode && event?.domEvent?.type === 'contextmenu') return
    if (isLineOrMeasureMode && event?.domEvent?.button !== 0) return

    if (this.shouldIgnoreNextMapClick) {
      this.shouldIgnoreNextMapClick = false
      return
    }

    if (this.state.isPinClickInProgress) {
      this.setState({ isPinClickInProgress: false })
      return
    }

    const mapClickModeHandlerMap = {
      [TOOL_MODES.DRAW_LINE]: handleLineMapClick,
      [TOOL_MODES.ADD_ROUTE]: handleRouteMapClick,
      [TOOL_MODES.SELECT]: handleSelectMapClick,
      [TOOL_MODES.MEASURE_DISTANCE]: handleMeasureMapClick,
    }

    if (event.placeId) {
      event.stop()
      if (currentMode === TOOL_MODES.MEASURE_DISTANCE) {
        mapClickModeHandlerMap[currentMode]?.(this.createModeEventContext(event))
        return
      }
      const latitudeFromPoi = event.latLng?.lat()
      const longitudeFromPoi = event.latLng?.lng()
      if (latitudeFromPoi === undefined || longitudeFromPoi === undefined) return
      if (selectedPinId) {
        selectPin(null)
        clearPinSelection()
      }
      this.requestPoiDetail(event.placeId, { lat: latitudeFromPoi, lng: longitudeFromPoi })
      return
    }

    if (this.state.selectedPoiDetail) {
      this.clearPoiDetail()
    }

    mapClickModeHandlerMap[currentMode]?.(this.createModeEventContext(event))
  }

  handleMapRightClick = (event) => {
    event?.domEvent?.preventDefault?.()
    if (this.rightClickCompleteLock) return
    this.rightClickCompleteLock = true
    window.setTimeout(() => {
      this.rightClickCompleteLock = false
    }, 0)
    this.shouldIgnoreNextMapClick = true
    this.triggerMeasureComplete('contextmenu')
  }

  handleMapContextMenu = (event) => {
    event.preventDefault()
    if (this.rightClickCompleteLock) return
    this.rightClickCompleteLock = true
    window.setTimeout(() => {
      this.rightClickCompleteLock = false
    }, 0)
    this.shouldIgnoreNextMapClick = true
    this.triggerMeasureComplete('contextmenu')
  }

  handleMapMouseDown = (event) => {
    handleMarkerMouseDown(this.createModeEventContext(event))
  }

  handleMapMouseUp = (event) => {
    handleMarkerMouseUp(this.createModeEventContext(event))
  }

  handleMapMouseMove = (event) => {
    handleLineMapMouseMove(this.createModeEventContext(event))
  }

  handlePinClick = (pinId, event) => {
    const { currentMode, selectPin, selectLine, togglePinInSelection } = this.props.projectStore
    this.setState({ isPinClickInProgress: true })
    if (this.state.selectedPoiDetail) {
      this.clearPoiDetail()
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
  }

  handleLineClick = (lineId) => {
    const { currentMode, selectPin, clearPinSelection, selectLine } = this.props.projectStore
    if (currentMode !== TOOL_MODES.SELECT) return
    selectPin(null)
    clearPinSelection()
    selectLine(lineId)
  }

  handleAddPoiToMap = (poiDetail) => {
    const { addMarker, selectPin, clearPinSelection } = this.props.projectStore
    if (!poiDetail?.position) return
    const poiRating = typeof poiDetail.rating === 'number' ? poiDetail.rating.toFixed(1) : null
    addMarker(poiDetail.position, {
      name: poiDetail.name || 'POI',
      category: 'tour',
      memo: poiRating ? `Rating: ${poiRating}` : '',
    })
    selectPin(null)
    clearPinSelection()
    this.clearPoiDetail()
  }

  handlePinDragStart = (pinId) => {
    const { currentMode } = this.props.projectStore
    if (currentMode !== TOOL_MODES.SELECT) return
    this.setState({ draggingPinId: pinId })
  }

  handlePinDrag = (pinId, event) => {
    const { currentMode, updatePin } = this.props.projectStore
    if (currentMode !== TOOL_MODES.SELECT) return
    const latitude = event.latLng?.lat()
    const longitude = event.latLng?.lng()
    if (latitude === undefined || longitude === undefined) return
    updatePin(pinId, { position: { lat: latitude, lng: longitude } })
  }

  handlePinDragEnd = (pinId, event) => {
    const { currentMode, updatePin, commitMarkerDrag } = this.props.projectStore
    if (currentMode !== TOOL_MODES.SELECT) return
    const latitude = event.latLng?.lat()
    const longitude = event.latLng?.lng()
    if (latitude === undefined || longitude === undefined) {
      this.setState({ draggingPinId: null })
      return
    }
    const nextPosition = { lat: latitude, lng: longitude }
    updatePin(pinId, { position: nextPosition })
    commitMarkerDrag()
    this.setState({ draggingPinId: null })
  }

  handleDeleteKeyDown = (event) => {
    const { currentMode, selectedPinIds, removePins, selectedLineId, removeLine, updateLine } = this.props.projectStore
    const selectedLine = this.getVisibleLines().find((lineItem) => lineItem.id === selectedLineId) || null
    const eventTarget = event.target
    const isInputControlTarget =
      eventTarget instanceof HTMLElement
      && (eventTarget.tagName === 'INPUT'
        || eventTarget.tagName === 'TEXTAREA'
        || eventTarget.tagName === 'SELECT'
        || eventTarget.isContentEditable)
    if (isInputControlTarget && event.key !== 'Escape') return

    if (event.key === 'Escape') {
      this.triggerMeasureComplete('escape')
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

  handleLineDraftPointDragStart = (pointIndex) => {
    this.setState({ draggingMeasurePointIndex: pointIndex })
  }

  handleLineDraftPointDrag = (pointIndex, event) => {
    const { linePath, lines, setLinePath } = this.props.projectStore
    const latitude = event?.latLng?.lat()
    const longitude = event?.latLng?.lng()
    const clickedPoint = latitude === undefined || longitude === undefined ? null : { lat: latitude, lng: longitude }
    handleLineMeasurePointDrag({
      currentMode: TOOL_MODES.DRAW_LINE,
      pointIndex,
      clickedPoint,
      state: { linePath },
      actions: { setLinePath, lineSnapPointList: [...linePath, ...lines.flatMap((lineItem) => lineItem.points)] },
    })
  }

  handleLineDraftPointDragEnd = (pointIndex, event) => {
    this.handleLineDraftPointDrag(pointIndex, event)
    this.setState({ draggingMeasurePointIndex: null })
  }

  handleMeasurePointDragStart = (pointIndex) => {
    this.setState({ draggingMeasurePointIndex: pointIndex })
  }

  handleMeasurePointDrag = (pointIndex, event) => {
    const { measurePath, setMeasurePath } = this.props.projectStore
    const latitude = event?.latLng?.lat()
    const longitude = event?.latLng?.lng()
    if (latitude === undefined || longitude === undefined) return
    const nextMeasurePointList = measurePath.map((measurePointItem, measurePointIndex) =>
      measurePointIndex === pointIndex ? { lat: latitude, lng: longitude } : measurePointItem,
    )
    setMeasurePath(nextMeasurePointList)
  }

  handleMeasurePointDragEnd = (pointIndex, event) => {
    this.handleMeasurePointDrag(pointIndex, event)
    this.setState({ draggingMeasurePointIndex: null })
  }

  render() {
    const {
      currentMode,
      routePaths,
      linePath,
      measurePath,
      routeDraft,
      selectedPinId,
      selectedLineId,
      pinIconFilters,
      clearPinIconFilter,
      togglePinIconFilter,
      setRouteTravelMode,
    } = this.props.projectStore

    const visiblePins = this.getVisiblePins()
    const visibleLines = this.getVisibleLines()
    const selectedPin = this.getSelectedPin()

    return (
      <>
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={MAP_DEFAULT_CENTER}
          zoom={MAP_DEFAULT_ZOOM}
          onLoad={this.setMapInstance}
          onUnmount={this.clearMapInstance}
          onClick={this.handleMapClick}
          onMouseUp={this.handleMapMouseUp}
          onMouseMove={this.handleMapMouseMove}
          onMouseDown={this.handleMapMouseDown}
          onRightClick={this.handleMapRightClick}
          options={{
            ...MAP_OPTIONS,
            clickableIcons: currentMode !== TOOL_MODES.MEASURE_DISTANCE,
            disableDoubleClickZoom: currentMode === TOOL_MODES.DRAW_LINE,
          }}
        >
          <PinLayer
            pins={visiblePins}
            selectedPin={this.state.selectedPoiDetail ? null : selectedPin}
            selectedPinId={selectedPinId}
            currentMode={currentMode}
            isPinInteractionBlocked={currentMode === TOOL_MODES.MEASURE_DISTANCE}
            draggingPinId={this.state.draggingPinId}
            onPinMouseDown={() => this.setState({ isPinClickInProgress: true })}
            onPinClick={this.handlePinClick}
            onPinDragStart={this.handlePinDragStart}
            onPinDrag={this.handlePinDrag}
            onPinDragEnd={this.handlePinDragEnd}
          />

          <PoiDetailOverlay poiDetail={this.state.selectedPoiDetail} onClose={this.clearPoiDetail} onAddPoiToMap={this.handleAddPoiToMap} />

          <LineLayer
            lines={visibleLines}
            currentMode={currentMode}
            selectedLineId={selectedLineId}
            linePath={linePath}
            previewLinePath={this.getLinePreviewPath()}
            onLineClick={this.handleLineClick}
            onLinePointDragStart={this.handleLineDraftPointDragStart}
            onLinePointDrag={this.handleLineDraftPointDrag}
            onLinePointDragEnd={this.handleLineDraftPointDragEnd}
          />

          <RouteLayer routePaths={routePaths} />

          <MeasureLayer
            currentMode={currentMode}
            measurePath={measurePath}
            previewMeasurePath={this.getPreviewMeasurePath()}
            measureSegmentLabelDataList={this.getMeasureSegmentLabelDataList()}
            measureTotalLabelData={this.getMeasureTotalLabelData()}
            onMeasurePointDragStart={this.handleMeasurePointDragStart}
            onMeasurePointDrag={this.handleMeasurePointDrag}
            onMeasurePointDragEnd={this.handleMeasurePointDragEnd}
          />
        </GoogleMap>

        <MapOverlays
          currentMode={currentMode}
          isTimeFilterExpanded={this.state.isTimeFilterExpanded}
          isPinFilterExpanded={this.state.isPinFilterExpanded}
          pinIconFilters={pinIconFilters}
          routeDraft={routeDraft}
          recentRouteInfo={this.state.recentRouteInfo}
          timeFilterRange={this.state.timeFilterRange}
          onSetTimeFilterExpanded={(isTimeFilterExpanded) => this.setState({ isTimeFilterExpanded })}
          onSetTimeFilterRange={(timeFieldKey, nextTimeValue) => {
            this.setState((previousState) => ({
              timeFilterRange: {
                ...previousState.timeFilterRange,
                [timeFieldKey]: nextTimeValue,
              },
            }))
          }}
          onClearPinIconFilter={clearPinIconFilter}
          onTogglePinIconFilter={togglePinIconFilter}
          onSetPinFilterExpanded={(isPinFilterExpanded) => this.setState({ isPinFilterExpanded })}
          onSetRouteTravelMode={setRouteTravelMode}
          onCloseRouteSummary={() => this.setState({ recentRouteInfo: null })}
        />
      </>
    )
  }
}

export default withStore(Map, { projectStore: useProjectStore })
