import { PlusIcon } from '../../components/icons/WorkspaceIcons';
import type { GooglePlacePopup } from './MapView.types';

interface GooglePlaceInfoWindowProps {
  place: GooglePlacePopup | null;
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function renderStars(rating?: number) {
  const normalized = Math.max(0, Math.min(5, Math.round((rating ?? 0) * 2) / 2));
  const fullStars = Math.floor(normalized);
  const hasHalf = normalized % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return `${'★'.repeat(fullStars)}${hasHalf ? '☆' : ''}${'☆'.repeat(emptyStars)}`;
}

export default function GooglePlaceInfoWindow({ place }: GooglePlaceInfoWindowProps) {
  if (!place) {
    return null;
  }

  return (
    <section className="workspace-google-place-popup">
      <h2 className="workspace-google-place-popup-title">{place.name}</h2>

      <div className="workspace-google-place-popup-panel">
        <p className="workspace-google-place-popup-panel-title">Google지도의 세부정보</p>
        <p className="workspace-google-place-popup-address">{place.address}</p>
        {place.website ? (
          <a
            href={place.website}
            target="_blank"
            rel="noreferrer"
            className="workspace-google-place-popup-address-link"
          >
            {stripProtocol(place.website)}
          </a>
        ) : null}
        {place.phoneNumber ? (
          <p className="workspace-google-place-popup-phone">{place.phoneNumber}</p>
        ) : null}
        {place.editorialSummary ? (
          <p className="workspace-google-place-popup-summary">{place.editorialSummary}</p>
        ) : null}

        {(place.rating || place.url) ? (
          <div className="workspace-google-place-popup-footer">
            {place.rating ? (
              <div className="workspace-google-place-popup-rating">
                <span className="workspace-google-place-popup-rating-value">
                  {place.rating.toFixed(1)}
                </span>
                <span className="workspace-google-place-popup-stars">{renderStars(place.rating)}</span>
                {place.userRatingsTotal ? (
                  <span className="workspace-google-place-popup-rating-count">
                    ({place.userRatingsTotal.toLocaleString()})
                  </span>
                ) : null}
              </div>
            ) : (
              <span />
            )}

            {place.url ? (
              <a
                href={place.url}
                target="_blank"
                rel="noreferrer"
                className="workspace-google-place-popup-link"
              >
                Google 지도에서 보기
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      <button type="button" className="workspace-google-place-popup-action">
        <PlusIcon />
        <span>지도에 추가</span>
      </button>
    </section>
  );
}
