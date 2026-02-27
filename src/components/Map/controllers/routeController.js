import TOOL_MODES from '../../../utils/toolModes'

export const handleRouteMapClick = ({ currentMode, clickedPoint, state, actions }) => {
  if (currentMode !== TOOL_MODES.ADD_ROUTE || !clickedPoint) return false
  if (!state.routeDraft.start) {
    actions.setRouteStart(clickedPoint)
    return true
  }
  actions.requestRoute(state.routeDraft.start, clickedPoint, state.routeDraft.travelMode || 'WALKING')
  actions.setRouteStart(null)
  actions.setMode(TOOL_MODES.SELECT)
  return true
}
