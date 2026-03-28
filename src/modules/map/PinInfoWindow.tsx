import {
  CameraIcon,
  GlobeIcon,
  MagicWandIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
} from '../../components/icons/WorkspaceIcons';
import type { Poi } from '../../models/Poi';
import { eventBus } from '../../services/EventBus';
import { getCategoryVisual } from '../../shared/constants/categories';
import PinAiInsightSection from './PinAiInsightSection';
import PinAppearancePicker from './PinAppearancePicker';
import PinScheduleEditor from './PinScheduleEditor';

interface PinInfoWindowProps {
  place: Poi | null;
}

function formatCoordinate(value: number): string {
  return value.toFixed(4);
}

export default function PinInfoWindow({ place }: PinInfoWindowProps) {
  if (!place) {
    return null;
  }

  const MetaIcon = getCategoryVisual(place.iconId).Icon;
  const subtitle = [place.detail, place.visitTime].filter(Boolean).join(', ');
  const hasUserDescription = Boolean(place.detail || place.memo);
  const handleAiEditClick = () => {
    eventBus.emit('chat:compose', {
      enablePlanEdit: true,
      message: `${place.name} 일정과 세부 정보를 수정해줘`,
    });
  };
  const handleEditClick = () => {
    const nextName = window.prompt('장소 이름을 수정하세요.', place.name);

    if (nextName === null) {
      return;
    }

    const nextDetail = window.prompt('장소 설명을 수정하세요.', place.detail);

    if (nextDetail === null) {
      return;
    }

    const nextMemo = window.prompt('메모를 수정하세요.', place.memo);

    if (nextMemo === null) {
      return;
    }

    eventBus.emit('poi:update', {
      placeId: place.id,
      changes: {
        detail: nextDetail,
        memo: nextMemo,
        name: nextName,
      },
    });
  };
  const handlePhotoClick = () => {
    const query = encodeURIComponent(`${place.name} ${place.detail} 일본`);

    window.open(
      `https://www.google.com/search?tbm=isch&q=${query}`,
      '_blank',
      'noopener,noreferrer',
    );
  };
  const handleOpenGoogleMapsClick = () => {
    const query = encodeURIComponent(`${place.name} ${place.position.lat},${place.position.lng}`);

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      '_blank',
      'noopener,noreferrer',
    );
  };
  const handleDeleteClick = () => {
    const shouldDelete = window.confirm(`"${place.name}" 핀을 삭제할까요?`);

    if (!shouldDelete) {
      return;
    }

    eventBus.emit('poi:delete', {
      placeId: place.id,
    });
  };

  return (
    <section className="workspace-poi-popup">
      <div className="workspace-poi-popup-body">
        <PinAppearancePicker place={place} />

        <div className="workspace-poi-popup-main">
          <h2 className="workspace-poi-popup-title">{place.name}</h2>

          <div className="workspace-poi-popup-subtitle">
            <span className="workspace-poi-popup-subtitle-icon" aria-hidden="true">
              <MetaIcon />
            </span>
            <span className="workspace-poi-popup-subtitle-text">{subtitle}</span>
          </div>

          <div className="workspace-poi-popup-coordinates">
            <MapPinIcon />
            <span>
              {formatCoordinate(place.position.lat)}, {formatCoordinate(place.position.lng)}
            </span>
          </div>
        </div>

        <div className="workspace-poi-popup-actions">
          <button
            type="button"
            className="workspace-poi-popup-icon-button"
            aria-label="AI 수정"
            onClick={handleAiEditClick}
          >
            <MagicWandIcon />
          </button>
          <button
            type="button"
            className="workspace-poi-popup-icon-button"
            aria-label="편집"
            onClick={handleEditClick}
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            className="workspace-poi-popup-icon-button"
            aria-label="사진"
            onClick={handlePhotoClick}
          >
            <CameraIcon />
          </button>
          <button
            type="button"
            className="workspace-poi-popup-icon-button"
            aria-label="Google 지도에서 열기"
            onClick={handleOpenGoogleMapsClick}
          >
            <GlobeIcon />
          </button>
          <button
            type="button"
            className="workspace-poi-popup-icon-button"
            aria-label="삭제"
            onClick={handleDeleteClick}
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <PinScheduleEditor place={place} />

      <section className="workspace-poi-popup-description">
        <div className="workspace-poi-popup-section-header">
          <span className="workspace-poi-popup-section-title">설명</span>
        </div>

        {hasUserDescription ? (
          <div className="workspace-poi-popup-description-copy">
            {place.detail ? <p>{place.detail}</p> : null}
            {place.memo ? <p>{place.memo}</p> : null}
          </div>
        ) : (
          <p className="workspace-poi-popup-description-empty">
            사용자가 작성한 설명이 아직 없습니다.
          </p>
        )}

        <PinAiInsightSection place={place} />
      </section>
    </section>
  );
}
