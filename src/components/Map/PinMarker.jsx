import { useMemo } from 'react'
import { Marker } from '@react-google-maps/api'
import useProjectStore from '../../stores/useProjectStore'
import { CATEGORY_PRESETS, DEFAULT_PIN_SVG_PATH, TRAVEL_PIN_ICON_PRESETS } from '../../utils/constants'

function PinMarker({
  pin,
  onClick,
  onMouseDown,
  indexLabel,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDrag,
  onDragEnd,
}) {
  const selectedPinId = useProjectStore((state) => state.selectedPinId)

  const markerPreset = useMemo(() => {
    const categoryKey = pin.category || 'default'
    const categoryInfo = CATEGORY_PRESETS[categoryKey] || CATEGORY_PRESETS.default
    const pinIcon = pin.icon || categoryInfo.icon
    const iconPreset = TRAVEL_PIN_ICON_PRESETS.find((presetItem) => presetItem.icon === pinIcon)

    return {
      svgPath: iconPreset?.svgPath || DEFAULT_PIN_SVG_PATH,
    }
  }, [pin.category, pin.icon])

  const isSelected = selectedPinId === pin.id

  const markerIcon = useMemo(() => {
    const markerSize = isSelected ? 44 : 40
    const mapsApi = window.google?.maps

    if (!mapsApi?.Size || !mapsApi?.Point) {
      return { url: markerPreset.svgPath }
    }

    return {
      url: markerPreset.svgPath,
      scaledSize: new mapsApi.Size(markerSize, markerSize),
      anchor: new mapsApi.Point(markerSize / 2, markerSize),
      labelOrigin: new mapsApi.Point(markerSize / 2, markerSize / 2.15),
    }
  }, [isSelected, markerPreset.svgPath])

  const markerLabel = useMemo(() => {
    if (!indexLabel) {
      return undefined
    }

    return {
      text: indexLabel,
      color: '#ffffff',
      fontSize: '12px',
      fontWeight: '700',
    }
  }, [indexLabel])

  const handlePinClick = (event) => {
    event?.domEvent?.stopPropagation?.()
    onClick(event)
  }

  const handlePinMouseDown = (event) => {
    event?.domEvent?.stopPropagation?.()
    onMouseDown?.()
  }

  return (
    <Marker
      position={pin.position}
      icon={markerIcon}
      label={markerLabel}
      draggable={draggable}
      clickable
      opacity={isDragging ? 0.6 : 1}
      zIndex={isSelected ? 100 : 10}
      onMouseDown={handlePinMouseDown}
      onClick={handlePinClick}
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
    />
  )
}

export default PinMarker
