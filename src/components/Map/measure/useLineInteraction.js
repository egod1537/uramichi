import { useCallback, useMemo } from 'react'
import TOOL_MODES from '../../../utils/toolModes'
import { getHaversineDistance } from '../../../utils/geo'
import { handleLineDraftComplete, handleLineMeasurePointDrag } from '../controllers/lineController'
import { MEASURE_LINE_WIDTH, POLYGON_CLOSE_DISTANCE_METERS } from './constants'

const resolveMeasurementShapeType = (measurePointPath) => {
  if (measurePointPath.length < 3) return 'line'
  const firstPoint = measurePointPath[0]
  const lastPoint = measurePointPath[measurePointPath.length - 1]
  const isLoopClosed = getHaversineDistance(firstPoint, lastPoint) <= POLYGON_CLOSE_DISTANCE_METERS
  return isLoopClosed ? 'polygon' : 'line'
}

const createLineMeasurementEntity = (measurePointPath, activeLayerId, measurementCount) => {
  const shapeType = resolveMeasurementShapeType(measurePointPath)
  const firstPoint = measurePointPath[0]
  const lastPoint = measurePointPath[measurePointPath.length - 1]
  const pointsForPolygon =
    shapeType === 'polygon' && firstPoint && lastPoint && (firstPoint.lat !== lastPoint.lat || firstPoint.lng !== lastPoint.lng)
      ? [...measurePointPath, firstPoint]
      : measurePointPath

  return {
    id: `measure-${Date.now()}-${measurementCount + 1}`,
    layerId: activeLayerId,
    points: pointsForPolygon,
    color: '#111111',
    width: MEASURE_LINE_WIDTH,
    shapeType,
  }
}

function useLineInteraction({
  linePath,
  hoverMeasurePoint,
  draggingMeasurePointIndex,
  activeLayerId,
  layers,
  measurements,
  setHoverMeasurePoint,
  cancelDraftLine,
  addMeasurement,
  setLinePath,
  setDraggingMeasurePointIndex,
  setMode,
}) {
  const linePreviewPath = useMemo(() => {
    if (!linePath.length || !hoverMeasurePoint) return []
    return [...linePath, hoverMeasurePoint]
  }, [hoverMeasurePoint, linePath])

  const completeLineInteraction = useCallback(() => {
    handleLineDraftComplete({
      currentMode: TOOL_MODES.DRAW_LINE,
      state: { linePath, activeLayerId, layers, measurements, createMeasurementEntity: createLineMeasurementEntity },
      actions: { setHoverMeasurePoint, cancelDraftLine, addMeasurement, setMode },
    })
  }, [activeLayerId, addMeasurement, cancelDraftLine, layers, linePath, measurements, setHoverMeasurePoint, setMode])

  const handleLineDraftPointDrag = useCallback(
    (pointIndex, event) => {
      const latitude = event?.latLng?.lat()
      const longitude = event?.latLng?.lng()
      const clickedPoint = latitude === undefined || longitude === undefined ? null : { lat: latitude, lng: longitude }
      handleLineMeasurePointDrag({
        currentMode: TOOL_MODES.DRAW_LINE,
        pointIndex,
        clickedPoint,
        state: { linePath },
        actions: { setLinePath, lineSnapPointList: [...linePath, ...measurements.flatMap((measurementItem) => measurementItem.points)] },
      })
    },
    [linePath, measurements, setLinePath],
  )

  const handleLineDraftPointDragStart = useCallback((pointIndex) => {
    setDraggingMeasurePointIndex(pointIndex)
  }, [setDraggingMeasurePointIndex])

  const handleLineDraftPointDragEnd = useCallback(
    (pointIndex, event) => {
      handleLineDraftPointDrag(pointIndex, event)
      setDraggingMeasurePointIndex(null)
    },
    [handleLineDraftPointDrag, setDraggingMeasurePointIndex],
  )

  return {
    lineSegmentLabelDataList: [],
    lineTotalLabelData: null,
    linePreviewPath,
    completeLineInteraction,
    handleLineDraftPointDrag,
    handleLineDraftPointDragStart,
    handleLineDraftPointDragEnd,
    isLinePointDragging: draggingMeasurePointIndex !== null,
  }
}

export default useLineInteraction
