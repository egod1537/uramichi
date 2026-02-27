import { useCallback, useMemo } from 'react'
import TOOL_MODES from '../../../utils/toolModes'
import { COLOR_PRESETS } from '../../../utils/constants'
import { formatDistanceLabel, getMidpoint, getPathDistanceInMeters } from '../../../utils/geo'
import { handleLineDraftComplete, handleLineMeasurePointDrag } from '../controllers/lineController'

export const MEASURE_LINE_WIDTH = 6

const createMeasurementEntity = (measurePointPath, activeLayerId, measurementCount) => ({
  id: `measure-${Date.now()}-${measurementCount + 1}`,
  layerId: activeLayerId,
  points: measurePointPath,
  color: COLOR_PRESETS.measureOrange,
  width: MEASURE_LINE_WIDTH,
})

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
}) {
  const measureSegmentLabelDataList = useMemo(() => createSegmentLabelDataList(measurePath), [measurePath])

  const measureTotalLabelData = useMemo(() => createTotalLabelData(measurePath), [measurePath])

  const previewMeasurePath = useMemo(() => {
    if (currentMode !== TOOL_MODES.DRAW_LINE) return []
    if (!measurePath.length || !hoverMeasurePoint) return []
    return [...measurePath, hoverMeasurePoint]
  }, [currentMode, hoverMeasurePoint, measurePath])

  const completeMeasureInteraction = useCallback(() => {
    handleLineDraftComplete({
      currentMode,
      state: { measurePath, activeLayerId, layers, measurements, createMeasurementEntity },
      actions: { setHoverMeasurePoint, cancelDraftMeasure, addMeasurement },
    })
  }, [activeLayerId, addMeasurement, cancelDraftMeasure, currentMode, layers, measurePath, measurements, setHoverMeasurePoint])

  const handleMeasurePointDrag = useCallback(
    (pointIndex, event) => {
      const latitude = event?.latLng?.lat()
      const longitude = event?.latLng?.lng()
      const clickedPoint = latitude === undefined || longitude === undefined ? null : { lat: latitude, lng: longitude }
      handleLineMeasurePointDrag({
        currentMode,
        pointIndex,
        clickedPoint,
        state: { measurePath },
        actions: { setMeasurePath },
      })
    },
    [currentMode, measurePath, setMeasurePath],
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
