import PinMarker from '../PinMarker'
import PinPopup from '../PinPopup'
import TOOL_MODES from '../../../utils/toolModes'

function PinLayer({
  pins,
  selectedPin,
  selectedPinId,
  currentMode,
  isPinInteractionBlocked,
  draggingPinId,
  onPinMouseDown,
  onPinClick,
  onPinDragStart,
  onPinDrag,
  onPinDragEnd,
}) {
  return (
    <>
      {pins.map((pinItem, pinIndex) => (
        <PinMarker
          key={pinItem.id}
          pin={pinItem}
          isInteractionBlocked={isPinInteractionBlocked}
          onMouseDown={onPinMouseDown}
          onClick={(event) => onPinClick(pinItem.id, event)}
          indexLabel={currentMode === TOOL_MODES.ADD_ROUTE ? String(pinIndex + 1) : ''}
          draggable={currentMode === TOOL_MODES.SELECT && selectedPinId === pinItem.id}
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
