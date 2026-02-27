import PinMarker from '../PinMarker'
import PinPopup from '../PinPopup'

function PinLayer({
  visiblePins,
  currentMode,
  selectedPinId,
  draggingPinId,
  selectedPin,
  onPinMouseDown,
  onPinClick,
  onPinDragStart,
  onPinDrag,
  onPinDragEnd,
  addRouteMode,
  isMarkerDraggable,
}) {
  return (
    <>
      {visiblePins.map((pinItem, pinIndex) => (
        <PinMarker
          key={pinItem.id}
          pin={pinItem}
          selectedPinId={selectedPinId}
          onMouseDown={onPinMouseDown}
          onClick={(event) => onPinClick(pinItem.id, event)}
          indexLabel={currentMode === addRouteMode ? String(pinIndex + 1) : ''}
          draggable={isMarkerDraggable(pinItem.id)}
          isDragging={draggingPinId === pinItem.id}
          onDragStart={() => onPinDragStart(pinItem.id)}
          onDrag={(event) => onPinDrag(pinItem.id, event)}
          onDragEnd={(event) => onPinDragEnd(pinItem.id, event)}
        />
      ))}
      {selectedPin ? <PinPopup key={selectedPin.id} pin={selectedPin} /> : null}
    </>
  )
}

export default PinLayer
