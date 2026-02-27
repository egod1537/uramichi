import { useEffect, useRef } from 'react'

export default function Search() {
  const searchInputRef = useRef(null)

  useEffect(() => {
    if (!searchInputRef.current || !window.google?.maps?.places) return

    const placesAutocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      fields: ['place_id', 'name', 'geometry', 'formatted_address', 'photos'],
    })

    const placeChangedListener = placesAutocomplete.addListener('place_changed', () => {
      placesAutocomplete.getPlace()
    })

    return () => {
      window.google.maps.event.removeListener(placeChangedListener)
    }
  }, [])

  return (
    <input
      ref={searchInputRef}
      type="text"
      placeholder="Search in Google Maps"
      className="h-9 flex-1 rounded-sm border border-gray-300 px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
    />
  )
}
