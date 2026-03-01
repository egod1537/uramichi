import TOOL_MODES from '../../../utils/toolModes';

export const handleSelectMapClick = ({ currentMode, actions }) => {
  if (currentMode !== TOOL_MODES.SELECT) return false;
  actions.selectPin(null);
  actions.selectLine(null);
  actions.clearPinSelection();
  return true;
};
