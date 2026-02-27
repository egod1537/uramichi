import React from 'react'
import { GoogleMap, InfoWindow, Marker, Polyline } from '@react-google-maps/api'
import TOOL_MODES from '../../utils/toolModes'

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

class Map extends React.Component {
  constructor(props) {
    super(props)
    this.mapInstance = null
  }

  componentDidUpdate(previousProps) {
    if (this.mapInstance && previousProps.selectedPinId !== this.props.selectedPinId && this.getSelectedPin()) {
      this.mapInstance.panTo(this.getSelectedPin().position)
    }
  }

  getVisiblePins = () => {
    const visibleLayerIdSet = new Set(
      this.props.layers.filter((layerItem) => layerItem.visible).map((layerItem) => layerItem.id),
    )
    return this.props.pins.filter((pinItem) => visibleLayerIdSet.has(pinItem.layerId))
  }

  getSelectedPin = () => {
    return this.getVisiblePins().find((pinItem) => pinItem.id === this.props.selectedPinId) || null
  }

  getMeasuredDistanceLabel = () => {
    const distanceInMeters = getPathDistanceInMeters(this.props.measurePath)
    if (!distanceInMeters) return ''
    if (distanceInMeters < 1000) return `${distanceInMeters.toFixed(0)} m`
    return `${(distanceInMeters / 1000).toFixed(2)} km`
  }

  onLoad = (loadedMap) => {
    this.mapInstance = loadedMap
  }

  onUnmount = () => {
    this.mapInstance = null
  }

  createRoutePath = (startPoint, endPoint) => {
    const directionsService = new window.google.maps.DirectionsService()
    directionsService.route(getRouteRequest(startPoint, endPoint), (result, status) => {
      if (status !== window.google.maps.DirectionsStatus.OK || !result) return
      const overviewPath = result.routes[0]?.overview_path ?? []
      if (!overviewPath.length) return
      const normalizedPath = overviewPath.map((locationPoint) => ({ lat: locationPoint.lat(), lng: locationPoint.lng() }))
      this.props.commitRoutePath(normalizedPath)
    })
  }

  handleMapClick = (event) => {
    const latitude = event.latLng?.lat()
    const longitude = event.latLng?.lng()
    if (latitude === undefined || longitude === undefined) return
    const clickedPoint = { lat: latitude, lng: longitude }

    if (this.props.currentMode === TOOL_MODES.ADD_MARKER) {
      this.props.addMarker(clickedPoint)
      return
    }
    if (this.props.currentMode === TOOL_MODES.DRAW_LINE) {
      this.props.appendLinePoint(clickedPoint)
      return
    }
    if (this.props.currentMode === TOOL_MODES.MEASURE_DISTANCE) {
      this.props.appendMeasurePoint(clickedPoint)
      return
    }
    if (this.props.currentMode === TOOL_MODES.ADD_ROUTE) {
      if (!this.props.routeDraft.start) {
        this.props.setRouteStart(clickedPoint)
        return
      }
      this.createRoutePath(this.props.routeDraft.start, clickedPoint)
      this.props.setRouteStart(null)
    }
  }

  render() {
    const visiblePins = this.getVisiblePins()
    const selectedPin = this.getSelectedPin()
    const measuredDistanceLabel = this.getMeasuredDistanceLabel()

    return (
      <>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={12}
          options={mapOptions}
          onLoad={this.onLoad}
          onUnmount={this.onUnmount}
          onClick={this.handleMapClick}
        >
          {this.props.markers.map((markerPoint, markerIndex) => (
            <Marker key={`marker-${markerIndex}`} position={markerPoint} />
          ))}

          {visiblePins.map((pinItem) => (
            <Marker key={pinItem.id} position={pinItem.position} onClick={() => this.props.selectPin(pinItem.id)} />
          ))}

          {selectedPin && (
            <InfoWindow position={selectedPin.position} onCloseClick={() => this.props.selectPin(null)}>
              <div className="text-sm">{selectedPin.name}</div>
            </InfoWindow>
          )}

          {this.props.linePath.length > 1 && (
            <Polyline path={this.props.linePath} options={{ strokeColor: '#1a73e8', strokeWeight: 3, clickable: false }} />
          )}

          {this.props.routePaths.map((routePath, routeIndex) => (
            <Polyline key={`route-${routeIndex}`} path={routePath} options={{ strokeColor: '#34a853', strokeWeight: 4, clickable: false }} />
          ))}

          {this.props.measurePath.length > 1 && (
            <Polyline
              path={this.props.measurePath}
              options={{
                strokeColor: '#f9ab00',
                strokeWeight: 3,
                clickable: false,
                icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 }, offset: '0', repeat: '20px' }],
              }}
            />
          )}
        </GoogleMap>

        {this.props.routeDraft.start && this.mapInstance && (
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
}

export default Map
