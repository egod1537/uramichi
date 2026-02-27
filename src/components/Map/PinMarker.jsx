import { useMemo } from 'react'
import { Marker, OverlayView } from '@react-google-maps/api'
import useProjectStore from '../../stores/useProjectStore'
import { CATEGORY_PRESETS, PIN_MARKER_COLOR_PRESETS } from '../../utils/constants'

const overlayPane = OverlayView.OVERLAY_MOUSE_TARGET

function PinMarker({
  pin,
  onClick,
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
    const colorInfo = PIN_MARKER_COLOR_PRESETS[categoryKey] || PIN_MARKER_COLOR_PRESETS.default

    return {
      icon: categoryInfo.icon,
      backgroundColor: pin.color || colorInfo.backgroundColor,
      ringColor: colorInfo.ringColor,
    }
  }, [pin.category, pin.color])

  const isSelected = selectedPinId === pin.id
  const scaleClassName = isSelected ? 'scale-110' : 'scale-100 group-hover:scale-105'
  const shadowClassName = isSelected ? 'shadow-xl ring-2 ring-offset-2' : 'shadow-md'
  const dragOpacityClassName = isDragging ? 'opacity-60' : 'opacity-100'

  const handlePinClick = (event) => {
    event?.domEvent?.stopPropagation?.()
    onClick(event)
  }

  return (
    <>
      <Marker
        position={pin.position}
        clickable={false}
        draggable={draggable}
        opacity={0.01}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
      />

      <OverlayView position={pin.position} mapPaneName={overlayPane}>
        <button
          type="button"
          onClick={handlePinClick}
          className="group relative -translate-x-1/2 -translate-y-full transition-transform duration-150 ease-out"
        >
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-full text-xl text-white transition-transform duration-150 ease-out ${scaleClassName} ${shadowClassName} ${dragOpacityClassName}`}
            style={{
              backgroundColor: markerPreset.backgroundColor,
              '--tw-ring-color': markerPreset.ringColor,
            }}
          >
            {markerPreset.icon}
          </span>

          {indexLabel ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-semibold text-gray-700 shadow">
              {indexLabel}
            </span>
          ) : null}
        </button>
      </OverlayView>
    </>
  )
}

export default PinMarker
