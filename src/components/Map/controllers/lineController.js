import TOOL_MODES from '../../../utils/toolModes'

export const handleLineMapClick = ({ currentMode, clickedPoint, actions }) => {
  if (currentMode !== TOOL_MODES.DRAW_LINE || !clickedPoint) return false
  actions.setHoverMeasurePoint(null)
  actions.appendLinePoint(clickedPoint)
  return true
}

export const handleLineMapMouseMove = ({ currentMode, clickedPoint, state, actions }) => {
  if (currentMode !== TOOL_MODES.DRAW_LINE) return false
  if (!state.linePath.length || state.draggingMeasurePointIndex !== null || !clickedPoint) return false
  actions.setHoverMeasurePoint(clickedPoint)
  return true
}

export const handleLineDraftComplete = ({ currentMode, state, actions }) => {
  if (currentMode !== TOOL_MODES.DRAW_LINE) return false
  actions.setHoverMeasurePoint(null)
  if (state.linePath.length < 2) {
    actions.cancelDraftLine()
    return true
  }
  const targetLayerId = state.activeLayerId || state.layers[0]?.id || null
  if (!targetLayerId) {
    actions.cancelDraftLine()
    return true
  }
  actions.addMeasurement(state.createMeasurementEntity(state.linePath, targetLayerId, state.measurements.length))
  actions.cancelDraftLine()
  actions.setMode(TOOL_MODES.SELECT)
  return true
}

export const handleLineMeasurePointDrag = ({ currentMode, pointIndex, clickedPoint, state, actions }) => {
  if (currentMode !== TOOL_MODES.DRAW_LINE || !clickedPoint) return false
  const nextLinePointList = state.linePath.map((linePointItem, linePointIndex) =>
    linePointIndex === pointIndex ? clickedPoint : linePointItem,
  )
  actions.setLinePath(nextLinePointList)
  return true
}
