import { GoogleMap } from '@react-google-maps/api'
import { useCallback, useState } from 'react'

const containerStyle = { width: '100%', height: '100%' }

const defaultCenter = { lat: 35.6812, lng: 139.7671 }

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  zoomControlOptions: { position: 9 }, // RIGHT_CENTER
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
}

export default function Map() {
  const [, setMap] = useState(null)

  const onLoad = useCallback((m) => setMap(m), [])
  const onUnmount = useCallback(() => setMap(null), [])

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={12}
      options={mapOptions}
      onLoad={onLoad}
      onUnmount={onUnmount}
    />
  )
}
