import { MAP_DEFAULT_CENTER } from '../../utils/config'

export const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' }

export const MAP_OPTIONS = {
  disableDefaultUI: true,
  gestureHandling: 'greedy',
  zoomControl: false,
  zoomControlOptions: { position: 9 },
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: true,
}

export const ADD_MARKER_DRAG_THRESHOLD_PX = 6

export { MAP_DEFAULT_CENTER }
