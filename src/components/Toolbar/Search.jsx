import { useEffect, useRef } from 'react'

export default function Search() {
  const inputRef = useRef(null)

  useEffect(() => {
    if (!inputRef.current) return

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['place_id', 'name', 'geometry', 'formatted_address', 'photos'],
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (!place.geometry) return

      console.log('선택한 장소:', {
        name: place.name,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address,
      })
    })
  }, [])

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="장소 검색..."
      className="h-9 flex-1 rounded-sm border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none"
    />
  )
}
