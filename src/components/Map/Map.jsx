import React from 'react'
import { GoogleMap } from '@react-google-maps/api'
import TOOL_MODES from '../../utils/toolModes'
import { COLOR_PRESETS, MAP_DEFAULT_ZOOM, TIME_FILTER_DEFAULT_RANGE } from '../../utils/config'
import useProjectStore from '../../stores/useProjectStore'
import withStore from '../../utils/withStore'
import { handleMarkerMouseDown, handleMarkerMouseUp } from './controllers/markerController'
import { handleRouteMapClick } from './controllers/routeController'
import { handleSelectMapClick } from './controllers/selectController'
import { ICON_FILTER_OPTIONS, getTravelPinIconKey } from '../../utils/opts'
import RouteService from '../../utils/RouteService'
import PoiDetailOverlay from './PoiDetailOverlay'
import PinLayer from './layers/PinLayer'
import LineLayer from './layers/LineLayer'
import RouteLayer from './layers/RouteLayer'
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
      isPinFilterExpanded: false,
      isTimeFilterExpanded: false,
      timeFilterRange: TIME_FILTER_DEFAULT_RANGE,
      recentRouteInfo: null,
      selectedPoiDetail: null,
      poiDetailStatus: 'idle',
    }
    this.mapInstance = null
    this.addMarkerMouseDownPositionRef = { current: null }
    this.shouldIgnoreNextMapClick = false
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleDeleteKeyDown)
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

  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleDeleteKeyDown)
  }

  getVisibleLayerIdSet = (projectStore) => new Set(projectStore.layers.filter((layerItem) => layerItem.visible).map((layerItem) => layerItem.id))

  getVisiblePins = (projectStore) => {
    const visibleLayerIdSet = this.getVisibleLayerIdSet(projectStore)
    const layerVisiblePins = projectStore.pins.filter((pinItem) => visibleLayerIdSet.has(pinItem.layerId))
    if (!projectStore.pinIconFilters.length) return layerVisiblePins
    const activeIconSet = new Set(ICON_FILTER_OPTIONS.filter((filterItem) => projectStore.pinIconFilters.includes(filterItem.key)).map((filterItem) => filterItem.key))
    return layerVisiblePins.filter((pinItem) => activeIconSet.has(getTravelPinIconKey(pinItem.icon)))
  }

  getVisibleLines = (projectStore) => {
    const visibleLayerIdSet = this.getVisibleLayerIdSet(projectStore)
    return projectStore.lines.filter((lineItem) => visibleLayerIdSet.has(lineItem.layerId))
  }

  getSelectedPin = (projectStore) => this.getVisiblePins(projectStore).find((pinItem) => pinItem.id === projectStore.selectedPinId) || null

  getSelectedLine = (projectStore) => this.getVisibleLines(projectStore).find((lineItem) => lineItem.id === projectStore.selectedLineId) || null

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

    const nextLinePointList = targetLine.points.map((linePoint, pointIndex) =>
      pointIndex === linePointIndex ? { lat: latitude, lng: longitude } : linePoint,
    )

    const isClosedShape =
      targetLine.shapeType === 'polygon'
      && targetLine.points.length > 2
      && targetLine.points[0].lat === targetLine.points[targetLine.points.length - 1].lat
      && targetLine.points[0].lng === targetLine.points[targetLine.points.length - 1].lng
    if (isClosedShape) {
      const lastPointIndex = nextLinePointList.length - 1
      if (linePointIndex === 0) {
        nextLinePointList[lastPointIndex] = { lat: latitude, lng: longitude }
      }
      if (linePointIndex === lastPointIndex) {
        nextLinePointList[0] = { lat: latitude, lng: longitude }
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
      isTimeFilterExpanded,
      isPinFilterExpanded,
      timeFilterRange,
      recentRouteInfo,
      draggingPinId,
      selectedPoiDetail,
    } = this.state

    const visiblePins = this.getVisiblePins(projectStore)
    const visibleLines = this.getVisibleLines(projectStore)
    const selectedPin = this.getSelectedPin(projectStore)

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
          onMouseUp={this.handleMapMouseUp}
          onMouseDown={this.handleMapMouseDown}
          options={{
            ...MAP_OPTIONS,
            clickableIcons: projectStore.currentMode !== TOOL_MODES.ADD_MARKER,
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
            selectedLineId={projectStore.selectedLineId}
            onLineClick={this.handleLineClick}
            onLinePointDragStart={this.handleLinePointDragStart}
            onLinePointDrag={this.handleLinePointDrag}
            onLinePointDragEnd={this.handleLinePointDragEnd}
          />

          <RouteLayer routePaths={projectStore.routePaths} />
        </GoogleMap>

        <MapOverlays
          currentMode={projectStore.currentMode}
          isTimeFilterExpanded={isTimeFilterExpanded}
          isPinFilterExpanded={isPinFilterExpanded}
          pinIconFilters={projectStore.pinIconFilters}
          routeDraft={projectStore.routeDraft}
          recentRouteInfo={recentRouteInfo}
          timeFilterRange={timeFilterRange}
          onSetTimeFilterExpanded={(nextValue) => this.setState({ isTimeFilterExpanded: nextValue })}
          onSetTimeFilterRange={(timeFieldKey, nextTimeValue) => {
            this.setState((previousState) => ({
              timeFilterRange: {
                ...previousState.timeFilterRange,
                [timeFieldKey]: nextTimeValue,
              },
            }))
          }}
          onClearPinIconFilter={projectStore.clearPinIconFilter}
          onTogglePinIconFilter={projectStore.togglePinIconFilter}
          onSetPinFilterExpanded={(nextValue) => this.setState({ isPinFilterExpanded: nextValue })}
          onSetRouteTravelMode={projectStore.setRouteTravelMode}
          onCloseRouteSummary={() => this.setState({ recentRouteInfo: null })}
        />
      </>
    )
  }
}

const ConnectedMap = withStore(Map, { projectStore: useProjectStore })

export default ConnectedMap
