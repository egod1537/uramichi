import MeasurePolylines from '../measure/MeasureLayer'
import MeasureLabels from '../measure/MeasureLabels'

function MeasureLayer({
  currentMode,
  visibleMeasurements,
  measurePath,
  previewMeasurePath,
  onMeasurePointDragStart,
  onMeasurePointDrag,
  onMeasurePointDragEnd,
  measureSegmentLabelDataList,
  measureTotalLabelData,
}) {
  return (
    <>
      <MeasurePolylines
        currentMode={currentMode}
        visibleMeasurements={visibleMeasurements}
        measurePath={measurePath}
        previewMeasurePath={previewMeasurePath}
        onMeasurePointDragStart={onMeasurePointDragStart}
        onMeasurePointDrag={onMeasurePointDrag}
        onMeasurePointDragEnd={onMeasurePointDragEnd}
      />
      <MeasureLabels
        measureSegmentLabelDataList={measureSegmentLabelDataList}
        measureTotalLabelData={measureTotalLabelData}
      />
    </>
  )
}

export default MeasureLayer
