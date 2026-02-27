import TOOL_MODES from '../../../utils/toolModes'

export const syncDraftByMode = ({ currentMode, actions }) => {
  if (currentMode !== TOOL_MODES.DRAW_LINE) {
    actions.cancelDraftMeasure()
    actions.cancelDraftLine()
  }
}
