export const CATEGORY_PRESETS = {
  default: { icon: '📍', label: 'Default' },
  airport: { icon: '✈️', label: 'Airport' },
  station: { icon: '🚂', label: 'Station' },
  cafe: { icon: '☕', label: 'Cafe' },
  food: { icon: '🍜', label: 'Food' },
  photo: { icon: '📷', label: 'Photo' },
  shopping: { icon: '🛍️', label: 'Shopping' },
  spot: { icon: '📍', label: 'Spot' },
}

export const TRAVEL_PIN_ICON_PRESETS = [
  { key: 'default', icon: '📍', label: '기본 핀', svgPath: '/svg/pin-default.svg' },
  { key: 'transit', icon: '🚇', label: '대중교통', svgPath: '/svg/pin-transit.svg' },
  { key: 'restaurant', icon: '🍽️', label: '식당', svgPath: '/svg/pin-restaurant.svg' },
  { key: 'tour', icon: '🗼', label: '관광지', svgPath: '/svg/pin-tour.svg' },
  { key: 'hotel', icon: '🏨', label: '숙소', svgPath: '/svg/pin-hotel.svg' },
  { key: 'photo', icon: '📷', label: '포토스팟', svgPath: '/svg/pin-photo.svg' },
]

export const getTravelPinIconPreset = (iconValue) => {
  if (!iconValue) {
    return null
  }

  return TRAVEL_PIN_ICON_PRESETS.find((presetItem) => presetItem.key === iconValue || presetItem.icon === iconValue) || null
}

export const getTravelPinIconKey = (iconValue) => {
  const matchedPreset = getTravelPinIconPreset(iconValue)
  return matchedPreset?.key || ''
}

export const DEFAULT_PIN_SVG_PATH = '/svg/pin-default.svg'

export const TRANSPORT_PRESETS = {
  flight: { icon: '✈️', color: '#34a853' },
  train: { icon: '🚂', color: '#4285f4' },
  walk: { icon: '🚶', color: '#f9ab00' },
  car: { icon: '🚗', color: '#ea4335' },
}

export const COLOR_PRESETS = {
  primaryBlue: '#1a73e8',
  routeGreen: '#34a853',
  measureOrange: '#f9ab00',
}


export const PIN_MARKER_COLOR_PRESETS = {
  default: { backgroundColor: '#5f6368', ringColor: '#d1d5db' },
  airport: { backgroundColor: '#2563eb', ringColor: '#93c5fd' },
  station: { backgroundColor: '#4f46e5', ringColor: '#a5b4fc' },
  cafe: { backgroundColor: '#8b5e34', ringColor: '#d6b998' },
  food: { backgroundColor: '#f97316', ringColor: '#fdba74' },
  photo: { backgroundColor: '#db2777', ringColor: '#f9a8d4' },
  shopping: { backgroundColor: '#0d9488', ringColor: '#5eead4' },
  spot: { backgroundColor: '#dc2626', ringColor: '#fca5a5' },
}


export const PIN_ICON_STYLE_PRESETS = {
  transit: { backgroundColor: '#2563eb', ringColor: '#93c5fd' },
  restaurant: { backgroundColor: '#dc2626', ringColor: '#fca5a5' },
  tour: { backgroundColor: '#7c3aed', ringColor: '#c4b5fd' },
  hotel: { backgroundColor: '#0f766e', ringColor: '#5eead4' },
  photo: { backgroundColor: '#db2777', ringColor: '#f9a8d4' },
}

export const ICON_FILTER_OPTIONS = TRAVEL_PIN_ICON_PRESETS
