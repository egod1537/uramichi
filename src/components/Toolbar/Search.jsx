import { useEffect, useRef } from 'react'

export default function Search({ value, onValueChange, onPlaceSelect, className = '' }) {
  const inputElementRef = useRef(null)

  useEffect(() => {
    if (!inputElementRef.current || !window.google?.maps?.places?.Autocomplete) return

    const autocompleteInstance = new window.google.maps.places.Autocomplete(inputElementRef.current, {
      fields: ['place_id', 'name', 'geometry', 'formatted_address', 'photos'],
    })

    const listener = autocompleteInstance.addListener('place_changed', () => {
      const selectedPlace = autocompleteInstance.getPlace()
      if (!selectedPlace?.geometry) return

      onPlaceSelect?.(selectedPlace)
      onValueChange?.(selectedPlace.formatted_address ?? selectedPlace.name ?? '')
    })

    return () => {
      if (listener) {
        window.google.maps.event.removeListener(listener)
      }
    }
  }, [onPlaceSelect, onValueChange])

  const inputProps =
    value === undefined
      ? {}
      : {
          value,
          onChange: (changeEvent) => onValueChange?.(changeEvent.target.value),
        }

  return (
    <input
      ref={inputElementRef}
      type="text"
      placeholder="Search places"
      className={`h-9 flex-1 rounded-sm border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none ${className}`.trim()}
      {...inputProps}
    />
  )
}
