import TOOL_MODES from '../../../utils/toolModes'

export const syncDraftByMode = ({ currentMode, actions }) => {
  if (currentMode !== TOOL_MODES.DRAW_LINE && currentMode !== TOOL_MODES.MEASURE_DISTANCE) {
    actions.cancelDraftMeasure()
    actions.cancelDraftLine()
    return
  }

  if (currentMode === TOOL_MODES.DRAW_LINE) {
    actions.cancelDraftMeasure()
    return
  }

  actions.cancelDraftLine()
}
