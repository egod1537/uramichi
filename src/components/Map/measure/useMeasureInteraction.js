import { useCallback, useMemo } from 'react'
import TOOL_MODES from '../../../utils/toolModes'
import { COLOR_PRESETS } from '../../../utils/config'
import { formatDistanceLabel, getHaversineDistance, getMidpoint, getPathDistanceInMeters } from '../../../utils/geo'
import { handleLineDraftComplete, handleLineMeasurePointDrag } from '../controllers/lineController'

export const MEASURE_LINE_WIDTH = 4
const POLYGON_CLOSE_DISTANCE_METERS = 30

const resolveMeasurementShapeType = (measurePointPath) => {
  if (measurePointPath.length < 3) return 'line'
  const firstPoint = measurePointPath[0]
  const lastPoint = measurePointPath[measurePointPath.length - 1]
  const isLoopClosed = getHaversineDistance(firstPoint, lastPoint) <= POLYGON_CLOSE_DISTANCE_METERS
  return isLoopClosed ? 'polygon' : 'line'
}

const createMeasurementEntity = (measurePointPath, activeLayerId, measurementCount) => {
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
    color: COLOR_PRESETS.measureOrange,
    width: MEASURE_LINE_WIDTH,
    shapeType,
  }
}

const createSegmentLabelDataList = (measurePointPath) =>
  measurePointPath.slice(1).map((currentPoint, pointIndex) => {
    const previousPoint = measurePointPath[pointIndex]
    const segmentDistanceInMeters = getPathDistanceInMeters([previousPoint, currentPoint])
    return {
      id: `measure-segment-${pointIndex + 1}`,
      position: getMidpoint(previousPoint, currentPoint),
      label: formatDistanceLabel(segmentDistanceInMeters),
    }
  })

const createTotalLabelData = (measurePointPath) => {
  const totalDistanceInMeters = getPathDistanceInMeters(measurePointPath)
  if (!totalDistanceInMeters) return null
  const terminalPoint = measurePointPath[measurePointPath.length - 1]
  return { id: 'measure-total', position: terminalPoint, label: `총 ${formatDistanceLabel(totalDistanceInMeters)}` }
}

function useMeasureInteraction({
  currentMode,
  measurePath,
  hoverMeasurePoint,
  draggingMeasurePointIndex,
  activeLayerId,
  layers,
  measurements,
  setHoverMeasurePoint,
  cancelDraftMeasure,
  addMeasurement,
  setMeasurePath,
  setDraggingMeasurePointIndex,
  setMode,
}) {
  const measureSegmentLabelDataList = useMemo(() => createSegmentLabelDataList(measurePath), [measurePath])

  const measureTotalLabelData = useMemo(() => createTotalLabelData(measurePath), [measurePath])

  const previewMeasurePath = useMemo(() => {
    if (currentMode !== TOOL_MODES.MEASURE_DISTANCE && currentMode !== TOOL_MODES.DRAW_LINE) return []
    if (!measurePath.length || !hoverMeasurePoint) return []
    return [...measurePath, hoverMeasurePoint]
  }, [currentMode, hoverMeasurePoint, measurePath])

  const completeMeasureInteraction = useCallback(() => {
    if (currentMode === TOOL_MODES.MEASURE_DISTANCE) {
      setHoverMeasurePoint(null)
      cancelDraftMeasure()
      return
    }

    handleLineDraftComplete({
      currentMode,
      state: { measurePath, activeLayerId, layers, measurements, createMeasurementEntity },
      actions: { setHoverMeasurePoint, cancelDraftMeasure, addMeasurement, setMode },
    })
  }, [activeLayerId, addMeasurement, cancelDraftMeasure, currentMode, layers, measurePath, measurements, setHoverMeasurePoint, setMode])

  const handleMeasurePointDrag = useCallback(
    (pointIndex, event) => {
      const latitude = event?.latLng?.lat()
      const longitude = event?.latLng?.lng()
      const clickedPoint = latitude === undefined || longitude === undefined ? null : { lat: latitude, lng: longitude }
      handleLineMeasurePointDrag({
        currentMode: TOOL_MODES.DRAW_LINE,
        pointIndex,
        clickedPoint,
        state: { measurePath },
        actions: { setMeasurePath },
      })
    },
    [measurePath, setMeasurePath],
  )

  const handleMeasurePointDragStart = useCallback((pointIndex) => {
    setDraggingMeasurePointIndex(pointIndex)
  }, [setDraggingMeasurePointIndex])

  const handleMeasurePointDragEnd = useCallback(
    (pointIndex, event) => {
      handleMeasurePointDrag(pointIndex, event)
      setDraggingMeasurePointIndex(null)
    },
    [handleMeasurePointDrag, setDraggingMeasurePointIndex],
  )

  return {
    measureSegmentLabelDataList,
    measureTotalLabelData,
    previewMeasurePath,
    completeMeasureInteraction,
    handleMeasurePointDrag,
    handleMeasurePointDragStart,
    handleMeasurePointDragEnd,
    isDraggingMeasurePoint: draggingMeasurePointIndex !== null,
  }
}

export default useMeasureInteraction
