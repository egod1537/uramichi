import { OverlayView } from '@react-google-maps/api'

const measureOverlayPane = OverlayView.OVERLAY_MOUSE_TARGET

function MeasureLabels({ measureSegmentLabelDataList, measureTotalLabelData }) {
  return (
    <>
      {measureSegmentLabelDataList.map((segmentLabelData) => (
        <OverlayView key={segmentLabelData.id} position={segmentLabelData.position} mapPaneName={measureOverlayPane}>
          <div className="-translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold leading-none text-gray-700 shadow">
            {segmentLabelData.label}
          </div>
        </OverlayView>
      ))}

      {measureTotalLabelData ? (
        <OverlayView key={measureTotalLabelData.id} position={measureTotalLabelData.position} mapPaneName={measureOverlayPane}>
          <div className="-translate-x-1/2 -translate-y-[calc(100%+18px)] whitespace-nowrap rounded-lg border border-orange-600 bg-[#f97316] px-3 py-2 text-xs font-semibold leading-none text-white shadow">
            {measureTotalLabelData.label}
          </div>
        </OverlayView>
      ) : null}
    </>
  )
}

export default MeasureLabels
