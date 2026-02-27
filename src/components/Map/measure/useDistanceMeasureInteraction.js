import { useCallback, useMemo } from 'react'
import { formatDistanceLabel, getMidpoint, getPathDistanceInMeters } from '../../../utils/geo'
import TOOL_MODES from '../../../utils/toolModes'

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

function useDistanceMeasureInteraction({
  measurePath,
  hoverMeasurePoint,
  draggingMeasurePointIndex,
  setHoverMeasurePoint,
  cancelDraftMeasure,
  setMeasurePath,
  setDraggingMeasurePointIndex,
  setMode,
}) {
  const measureSegmentLabelDataList = useMemo(() => createSegmentLabelDataList(measurePath), [measurePath])

  const measureTotalLabelData = useMemo(() => createTotalLabelData(measurePath), [measurePath])

  const previewMeasurePath = useMemo(() => {
    if (!measurePath.length || !hoverMeasurePoint) return []
    return [...measurePath, hoverMeasurePoint]
  }, [hoverMeasurePoint, measurePath])

  const completeDistanceMeasureInteraction = useCallback(() => {
    setHoverMeasurePoint(null)
    cancelDraftMeasure()
  }, [cancelDraftMeasure, setHoverMeasurePoint])

  const completeDistanceMeasureInteractionByContextMenu = useCallback(() => {
    setHoverMeasurePoint(null)
    cancelDraftMeasure()
    setMode?.(TOOL_MODES.MEASURE_DISTANCE)
  }, [cancelDraftMeasure, setHoverMeasurePoint, setMode])

  const completeDistanceMeasureInteractionByEscape = useCallback(() => {
    setHoverMeasurePoint(null)
    cancelDraftMeasure()
    setMode?.(TOOL_MODES.SELECT)
  }, [cancelDraftMeasure, setHoverMeasurePoint, setMode])

  const handleMeasurePointDrag = useCallback(
    (pointIndex, event) => {
      const latitude = event?.latLng?.lat()
      const longitude = event?.latLng?.lng()
      if (latitude === undefined || longitude === undefined) return
      const nextMeasurePointList = measurePath.map((measurePointItem, measurePointIndex) =>
        measurePointIndex === pointIndex ? { lat: latitude, lng: longitude } : measurePointItem,
      )
      setMeasurePath(nextMeasurePointList)
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
    completeDistanceMeasureInteraction,
    completeDistanceMeasureInteractionByContextMenu,
    completeDistanceMeasureInteractionByEscape,
    handleMeasurePointDrag,
    handleMeasurePointDragStart,
    handleMeasurePointDragEnd,
    isMeasurePointDragging: draggingMeasurePointIndex !== null,
  }
}

export default useDistanceMeasureInteraction
