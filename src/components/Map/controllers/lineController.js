import TOOL_MODES from '../../../utils/toolModes'

export const handleLineMapClick = ({ currentMode, clickedPoint, actions }) => {
  if (currentMode !== TOOL_MODES.DRAW_LINE || !clickedPoint) return false
  actions.setHoverMeasurePoint(null)
  actions.appendMeasurePoint(clickedPoint)
  return true
}

export const handleLineMapMouseMove = ({ currentMode, clickedPoint, state, actions }) => {
  if (currentMode !== TOOL_MODES.DRAW_LINE) return false
  if (!state.measurePath.length || state.draggingMeasurePointIndex !== null || !clickedPoint) return false
  actions.setHoverMeasurePoint(clickedPoint)
  return true
}

export const handleLineDraftComplete = ({ currentMode, state, actions }) => {
  if (currentMode !== TOOL_MODES.DRAW_LINE) return false
  actions.setHoverMeasurePoint(null)
  if (state.measurePath.length < 2) {
    actions.cancelDraftMeasure()
    return true
  }
  const targetLayerId = state.activeLayerId || state.layers[0]?.id || null
  if (!targetLayerId) {
    actions.cancelDraftMeasure()
    return true
  }
  actions.addMeasurement(state.createMeasurementEntity(state.measurePath, targetLayerId, state.measurements.length))
  actions.cancelDraftMeasure()
  actions.setMode(TOOL_MODES.SELECT)
  return true
}

export const handleLineMeasurePointDrag = ({ currentMode, pointIndex, clickedPoint, state, actions }) => {
  if (currentMode !== TOOL_MODES.DRAW_LINE || !clickedPoint) return false
  const nextMeasurePointList = state.measurePath.map((measurePointItem, measurePointIndex) =>
    measurePointIndex === pointIndex ? clickedPoint : measurePointItem,
  )
  actions.setMeasurePath(nextMeasurePointList)
  return true
}
