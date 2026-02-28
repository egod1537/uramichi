import { OverlayView } from '@react-google-maps/api';
import createGoogleMapsPlaceUrl from '../../utils/createGoogleMapsPlaceUrl';

const clampRatingValue = (ratingValue) => {
  if (typeof ratingValue !== 'number') return 0;
  return Math.max(0, Math.min(5, ratingValue));
};

const createStarRatingLabel = (ratingValue) => {
  const normalizedRating = clampRatingValue(ratingValue);
  const filledStarCount = Math.round(normalizedRating);
  return `★`.repeat(filledStarCount) + `☆`.repeat(5 - filledStarCount);
};

function PoiDetailOverlay({ poiDetail, onClose, onAddPoiToMap }) {
  if (!poiDetail) return null;

  const starRatingLabel = createStarRatingLabel(poiDetail.rating);

  return (
    <OverlayView position={poiDetail.position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
      <div
        className="w-[320px] rounded-2xl bg-white p-4 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
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
        {poiDetail.phoneNumber ? (
          <p className="mt-1 text-sm text-slate-600">{poiDetail.phoneNumber}</p>
        ) : null}
        {poiDetail.rating !== null ? (
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-amber-600">
            <span className="tracking-wide">{starRatingLabel}</span>
            <span>{poiDetail.rating.toFixed(1)}</span>
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

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onAddPoiToMap?.(poiDetail)}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            지도에 추가
          </button>
          <button
            type="button"
            onClick={() =>
              window.open(
                createGoogleMapsPlaceUrl(poiDetail.placeId),
                '_blank',
                'noopener,noreferrer',
              )
            }
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Google 지도에서 보기
          </button>
        </div>
      </div>
    </OverlayView>
  );
}

export default PoiDetailOverlay;
