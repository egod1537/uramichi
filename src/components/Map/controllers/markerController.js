import TOOL_MODES from '../../../utils/toolModes'

export const handleMarkerMouseDown = ({ currentMode, event, refs }) => {
  if (currentMode !== TOOL_MODES.ADD_MARKER) return false
  const clientX = event?.domEvent?.clientX
  const clientY = event?.domEvent?.clientY
  if (clientX === undefined || clientY === undefined) {
    refs.addMarkerMouseDownPositionRef.current = null
    return true
  }
  refs.addMarkerMouseDownPositionRef.current = { clientX, clientY }
  return true
}

export const handleMarkerMouseUp = ({ currentMode, event, state, actions, refs }) => {
  if (currentMode !== TOOL_MODES.ADD_MARKER) return false
  const mouseDownPosition = refs.addMarkerMouseDownPositionRef.current
  refs.addMarkerMouseDownPositionRef.current = null
  const mouseUpClientX = event?.domEvent?.clientX
  const mouseUpClientY = event?.domEvent?.clientY
  if (mouseDownPosition && mouseUpClientX !== undefined && mouseUpClientY !== undefined) {
    const deltaX = mouseUpClientX - mouseDownPosition.clientX
    const deltaY = mouseUpClientY - mouseDownPosition.clientY
    const dragDistance = Math.hypot(deltaX, deltaY)
    if (dragDistance >= state.addMarkerDragThresholdPx) return true
  }

  if (state.isPinClickInProgress) {
    actions.setIsPinClickInProgress(false)
    return true
  }

  if (event.placeId || !state.clickedPoint) return true
  actions.addMarker(state.clickedPoint)
  return true
}
