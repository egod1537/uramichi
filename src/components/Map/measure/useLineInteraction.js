import { useCallback, useMemo } from 'react';
import TOOL_MODES from '../../../utils/toolModes';
import { getHaversineDistance } from '../../../utils/geo';
import { handleLineDraftComplete, handleLineMeasurePointDrag } from '../controllers/lineController';
import { POLYGON_CLOSE_DISTANCE_METERS } from './constants';
import { LINE_DEFAULT_COLOR, LINE_DEFAULT_WIDTH } from '../../../utils/lineStyle';

const resolveLineShapeType = (linePointPath) => {
  if (linePointPath.length < 3) return 'line';
  const [firstPoint] = linePointPath;
  const lastPoint = linePointPath.at(-1);
  const isLoopClosed = getHaversineDistance(firstPoint, lastPoint) <= POLYGON_CLOSE_DISTANCE_METERS;
  return isLoopClosed ? 'polygon' : 'line';
};

const createLineEntity = (linePointPath, activeLayerId, lineCount) => {
  const shapeType = resolveLineShapeType(linePointPath);
  const [firstPoint] = linePointPath;
  const lastPoint = linePointPath.at(-1);
  const pointsForPolygon =
    shapeType === 'polygon' &&
    firstPoint &&
    lastPoint &&
    (firstPoint.lat !== lastPoint.lat || firstPoint.lng !== lastPoint.lng)
      ? [...linePointPath, firstPoint]
      : linePointPath;

  return {
    id: `line-${Date.now()}-${lineCount + 1}`,
    layerId: activeLayerId,
    points: pointsForPolygon,
    color: LINE_DEFAULT_COLOR,
    width: LINE_DEFAULT_WIDTH,
    shapeType,
    sourceType: 'line',
  };
};

function useLineInteraction({
  linePath,
  hoverMeasurePoint,
  draggingMeasurePointIndex,
  activeLayerId,
  layers,
  lines,
  setHoverMeasurePoint,
  cancelDraftLine,
  addLine,
  setLinePath,
  setDraggingMeasurePointIndex,
  setMode,
}) {
  const linePreviewPath = useMemo(() => {
    if (!linePath.length || !hoverMeasurePoint) return [];
    return [...linePath, hoverMeasurePoint];
  }, [hoverMeasurePoint, linePath]);

  const completeLineInteraction = useCallback(() => {
    handleLineDraftComplete({
      currentMode: TOOL_MODES.DRAW_LINE,
      state: { linePath, activeLayerId, layers, lines, createLineEntity },
      actions: { setHoverMeasurePoint, cancelDraftLine, addLine, setMode },
    });
  }, [
    activeLayerId,
    addLine,
    cancelDraftLine,
    layers,
    linePath,
    lines,
    setHoverMeasurePoint,
    setMode,
  ]);

  const handleLineDraftPointDrag = useCallback(
    (pointIndex, event) => {
      const latitude = event?.latLng?.lat();
      const longitude = event?.latLng?.lng();
      const clickedPoint =
        latitude === undefined || longitude === undefined
          ? null
          : { lat: latitude, lng: longitude };
      handleLineMeasurePointDrag({
        currentMode: TOOL_MODES.DRAW_LINE,
        pointIndex,
        clickedPoint,
        state: { linePath },
        actions: {
          setLinePath,
          lineSnapPointList: [...linePath, ...lines.flatMap((lineItem) => lineItem.points)],
        },
      });
    },
    [linePath, lines, setLinePath],
  );

  const handleLineDraftPointDragStart = useCallback(
    (pointIndex) => {
      setDraggingMeasurePointIndex(pointIndex);
    },
    [setDraggingMeasurePointIndex],
  );

  const handleLineDraftPointDragEnd = useCallback(
    (pointIndex, event) => {
      handleLineDraftPointDrag(pointIndex, event);
      setDraggingMeasurePointIndex(null);
    },
    [handleLineDraftPointDrag, setDraggingMeasurePointIndex],
  );

  return {
    linePreviewPath,
    completeLineInteraction,
    handleLineDraftPointDrag,
    handleLineDraftPointDragStart,
    handleLineDraftPointDragEnd,
    isLinePointDragging: draggingMeasurePointIndex !== null,
  };
}

export default useLineInteraction;
