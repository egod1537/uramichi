import { useRef, useEffect } from 'react'

export default function Search() {
  const inputRef = useRef(null)

  useEffect(() => {
    if (!inputRef.current) return

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
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

      // TODO: 핀 추가 로직
    })
  }, [])

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="장소 검색..."
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    />
  )
}
