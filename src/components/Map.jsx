import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'
import { useCallback, useState } from 'react'

const containerStyle = {
  width: '100%',
  height: '100%',
}

// ?�쿄 중심
const defaultCenter = {
  lat: 35.6812,
  lng: 139.7671,
}

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
}

export default function Map() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  })

  const [map, setMap] = useState(null)

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  if (loadError) return <div className="p-4 text-red-500">�?로딩 ?�패</div>
  if (!isLoaded) return <div className="p-4">�?로딩 �?..</div>

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
