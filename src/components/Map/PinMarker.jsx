import { useMemo } from 'react'
import { Marker } from '@react-google-maps/api'
import useProjectStore from '../../stores/useProjectStore'
import { CATEGORY_PRESETS, PIN_ICON_STYLE_PRESETS, PIN_MARKER_COLOR_PRESETS, TRAVEL_PIN_ICON_PRESETS } from '../../utils/constants'

const MARKER_CIRCLE_PATH = 'M 0,0 m -1,0 a 1,1 0 1,0 2,0 a 1,1 0 1,0 -2,0'

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
    const iconPresetKey = TRAVEL_PIN_ICON_PRESETS.find((iconPreset) => iconPreset.icon === pinIcon)?.key
    const categoryColorInfo = PIN_MARKER_COLOR_PRESETS[categoryKey] || PIN_MARKER_COLOR_PRESETS.default
    const iconStyleInfo = iconPresetKey ? PIN_ICON_STYLE_PRESETS[iconPresetKey] : null

    return {
      icon: pinIcon,
      backgroundColor: pin.color || iconStyleInfo?.backgroundColor || categoryColorInfo.backgroundColor,
      ringColor: iconStyleInfo?.ringColor || categoryColorInfo.ringColor,
    }
  }, [pin.category, pin.color, pin.icon])

  const isSelected = selectedPinId === pin.id
  const markerLabelText = indexLabel || markerPreset.icon

  const markerSymbol = useMemo(
    () => ({
      path: MARKER_CIRCLE_PATH,
      fillColor: markerPreset.backgroundColor,
      fillOpacity: isDragging ? 0.6 : 1,
      strokeColor: markerPreset.ringColor,
      strokeOpacity: 1,
      strokeWeight: isSelected ? 0.24 : 0.16,
      scale: isSelected ? 24 : 22,
    }),
    [isDragging, isSelected, markerPreset.backgroundColor, markerPreset.ringColor],
  )

  const markerLabel = useMemo(
    () => ({
      text: markerLabelText,
      className: 'text-base font-semibold',
      color: '#ffffff',
    }),
    [markerLabelText],
  )

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
      icon={markerSymbol}
      label={markerLabel}
      draggable={draggable}
      clickable
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
