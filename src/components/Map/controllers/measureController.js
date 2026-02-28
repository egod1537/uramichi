import TOOL_MODES from '../../../utils/toolModes';

export const handleMeasureMapClick = ({ currentMode, clickedPoint, actions }) => {
  if (currentMode !== TOOL_MODES.MEASURE_DISTANCE || !clickedPoint) return false;
  actions.setHoverMeasurePoint(null);
  actions.appendMeasurePoint(clickedPoint);
  return true;
};
