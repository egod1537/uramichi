import { OverlayView } from '@react-google-maps/api'
import createGoogleMapsPlaceUrl from '../../utils/createGoogleMapsPlaceUrl'

const MAX_STAR_COUNT = 5

function PoiDetailOverlay({ poiDetail, onClose, onAddToMap }) {
  if (!poiDetail) return null

  const filledStarCount = poiDetail.rating === null ? 0 : Math.max(0, Math.min(MAX_STAR_COUNT, Math.round(poiDetail.rating)))

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
        {poiDetail.rating !== null ? (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-700">{poiDetail.rating.toFixed(1)}</span>
            <div className="flex items-center gap-0.5" aria-label={`평점 ${poiDetail.rating.toFixed(1)}`}>
              {Array.from({ length: MAX_STAR_COUNT }).map((_, starIndex) => {
                const isFilledStar = starIndex < filledStarCount
                return (
                  <svg
                    key={`poi-rating-star-${starIndex + 1}`}
                    viewBox="0 0 20 20"
                    className={`h-4 w-4 ${isFilledStar ? 'text-red-500' : 'text-slate-300'}`}
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M10 1.5 12.58 6.73l5.77.84-4.18 4.07.99 5.75L10 14.68l-5.16 2.71.99-5.75L1.65 7.57l5.77-.84L10 1.5Z" />
                  </svg>
                )
              })}
            </div>
          </div>
        ) : null}
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
            onClick={() => onAddToMap(poiDetail)}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            지도에 추가
          </button>
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
