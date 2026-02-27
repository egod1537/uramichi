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
  { key: 'transit', icon: '🚇', label: '대중교통' },
  { key: 'restaurant', icon: '🍽️', label: '식당' },
  { key: 'tour', icon: '🗼', label: '관광지' },
  { key: 'hotel', icon: '🏨', label: '숙소' },
  { key: 'photo', icon: '📷', label: '포토스팟' },
]

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
