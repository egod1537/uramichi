import { OverlayView } from '@react-google-maps/api'
import createGoogleMapsPlaceUrl from '../../utils/createGoogleMapsPlaceUrl'

function PoiDetailOverlay({ poiDetail, onClose }) {
  if (!poiDetail) return null

  return (
    <OverlayView position={poiDetail.position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
      <div className="w-[320px] rounded-2xl bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900">{poiDetail.name}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {poiDetail.address ? <p className="text-sm text-slate-600">{poiDetail.address}</p> : null}
        {poiDetail.phoneNumber ? <p className="mt-1 text-sm text-slate-600">{poiDetail.phoneNumber}</p> : null}
        {poiDetail.rating !== null ? <p className="mt-2 text-sm font-semibold text-amber-600">평점 {poiDetail.rating}</p> : null}
        {poiDetail.website ? (
          <a
            href={poiDetail.website}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block truncate text-sm text-blue-600 hover:underline"
          >
            {poiDetail.website}
          </a>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => window.open(createGoogleMapsPlaceUrl(poiDetail.placeId), '_blank', 'noopener,noreferrer')}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Google 지도에서 보기
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            닫기
          </button>
        </div>
      </div>
    </OverlayView>
  )
}

export default PoiDetailOverlay
