import TOOL_MODES from '../../../utils/toolModes';
import { getHaversineDistance } from '../../../utils/geo';

const SNAP_DISTANCE_METERS = 25;

const resolveSnappedPoint = (clickedPoint, lineSnapPointList = []) => {
  if (!clickedPoint || !lineSnapPointList.length) return clickedPoint;

  let nearestPoint = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  lineSnapPointList.forEach((candidatePoint) => {
    const distance = getHaversineDistance(clickedPoint, candidatePoint);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPoint = candidatePoint;
    }
  });

  if (!nearestPoint || nearestDistance > SNAP_DISTANCE_METERS) return clickedPoint;
  return nearestPoint;
};

export const handleLineMapClick = ({ currentMode, clickedPoint, actions }) => {
  if (currentMode !== TOOL_MODES.DRAW_LINE || !clickedPoint) return false;
  actions.setHoverMeasurePoint(null);
  actions.appendLinePoint(resolveSnappedPoint(clickedPoint, actions.lineSnapPointList));
  return true;
};

export const handleLineMapMouseMove = ({ currentMode, clickedPoint, state, actions }) => {
  if (currentMode !== TOOL_MODES.DRAW_LINE) return false;
  if (!state.linePath.length || state.draggingMeasurePointIndex !== null || !clickedPoint)
    return false;
  actions.setHoverMeasurePoint(clickedPoint);
  return true;
};

export const handleLineDraftComplete = ({ currentMode, state, actions }) => {
  if (currentMode !== TOOL_MODES.DRAW_LINE) return false;
  actions.setHoverMeasurePoint(null);
  if (state.linePath.length < 2) {
    actions.cancelDraftLine();
    return true;
  }
  const targetLayerId = state.activeLayerId || state.layers[0]?.id || null;
  if (!targetLayerId) {
    actions.cancelDraftLine();
    return true;
  }
  actions.addLine(state.createLineEntity(state.linePath, targetLayerId, state.lines.length));
  actions.cancelDraftLine();
  actions.setMode(TOOL_MODES.SELECT);
  return true;
};

export const handleLineMeasurePointDrag = ({
  currentMode,
  pointIndex,
  clickedPoint,
  state,
  actions,
}) => {
  if (currentMode !== TOOL_MODES.DRAW_LINE || !clickedPoint) return false;
  const nextPoint = resolveSnappedPoint(
    clickedPoint,
    (actions.lineSnapPointList || []).filter((pointItem) => {
      const targetPoint = state.linePath[pointIndex];
      return !targetPoint || pointItem.lat !== targetPoint.lat || pointItem.lng !== targetPoint.lng;
    }),
  );
  const nextLinePointList = state.linePath.map((linePointItem, linePointIndex) =>
    linePointIndex === pointIndex ? nextPoint : linePointItem,
  );
  actions.setLinePath(nextLinePointList);
  return true;
};
