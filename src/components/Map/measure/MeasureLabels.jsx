import { OverlayView } from '@react-google-maps/api'

const measureOverlayPane = OverlayView.OVERLAY_MOUSE_TARGET

function MeasureLabels({ measureSegmentLabelDataList, measureTotalLabelData }) {
  return (
    <>
      {measureSegmentLabelDataList.map((segmentLabelData) => (
        <OverlayView key={segmentLabelData.id} position={segmentLabelData.position} mapPaneName={measureOverlayPane}>
          <div className="-translate-x-1/2 -translate-y-[calc(100%+8px)] whitespace-nowrap rounded bg-white/95 px-2 py-1 text-xs font-medium leading-none text-gray-700 shadow">
            {segmentLabelData.label}
          </div>
        </OverlayView>
      ))}

      {measureTotalLabelData ? (
        <OverlayView key={measureTotalLabelData.id} position={measureTotalLabelData.position} mapPaneName={measureOverlayPane}>
          <div className="-translate-x-1/2 -translate-y-[calc(100%+16px)] whitespace-nowrap rounded bg-[#f97316] px-2 py-1 text-xs font-semibold leading-none text-white shadow">
            {measureTotalLabelData.label}
          </div>
        </OverlayView>
      ) : null}
    </>
  )
}

export default MeasureLabels
