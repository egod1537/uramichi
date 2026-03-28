import {
  ClockIcon,
  MagicWandIcon,
  PencilIcon,
  PreviewIcon,
  TrashIcon,
} from '../../components/icons/WorkspaceIcons';
import { BudgetIcon, TransitRouteIcon } from '../../components/icons/WorkspaceIcons';
import type { MapDrawing, RoutePoint } from '../../models/Route';
import { eventBus } from '../../services/EventBus';
import { getDrawingIconVisual } from '../../shared/constants/drawingIcons';
import DrawingAppearancePicker from './DrawingAppearancePicker';

interface DrawingInfoWindowProps {
  drawing: MapDrawing | null;
}

function formatCoordinate(value: number): string {
  return value.toFixed(4);
}

function formatPathLabel(path: RoutePoint[]): string {
  const startPoint = path[0];
  const endPoint = path[path.length - 1];

  if (!startPoint || !endPoint) {
    return '좌표 정보 없음';
  }

  return `${formatCoordinate(startPoint.lat)}, ${formatCoordinate(startPoint.lng)} → ${formatCoordinate(endPoint.lat)}, ${formatCoordinate(endPoint.lng)}`;
}

export default function DrawingInfoWindow({ drawing }: DrawingInfoWindowProps) {
  if (!drawing) {
    return null;
  }

  const MetaIcon = getDrawingIconVisual(drawing.iconId).Icon;
  const subtitle = [drawing.detail, drawing.type === 'polygon' ? '다각형' : '경로'].join(' · ');
  const handleAiEditClick = () => {
    eventBus.emit('chat:compose', {
      enablePlanEdit: true,
      message: `${drawing.label} 이동 경로와 세부 정보를 수정해줘`,
    });
  };
  const handleEditClick = () => {
    const nextLabel = window.prompt('경로 이름을 수정하세요.', drawing.label);

    if (nextLabel === null) {
      return;
    }

    const nextDetail = window.prompt('경로 설명을 수정하세요.', drawing.detail);

    if (nextDetail === null) {
      return;
    }

    const nextTimeText = window.prompt('이동 시간 또는 시간대를 수정하세요.', drawing.timeText);

    if (nextTimeText === null) {
      return;
    }

    const nextEstimatedCost = window.prompt('예상 비용 또는 요금을 수정하세요.', drawing.estimatedCost);

    if (nextEstimatedCost === null) {
      return;
    }

    const nextMemo = window.prompt('메모를 수정하세요.', drawing.memo);

    if (nextMemo === null) {
      return;
    }

    eventBus.emit('drawing:update', {
      drawingId: drawing.id,
      changes: {
        detail: nextDetail,
        estimatedCost: nextEstimatedCost,
        label: nextLabel,
        memo: nextMemo,
        timeText: nextTimeText,
      },
    });
  };
  const handlePreviewClick = () => {
    const startPoint = drawing.path[0];
    const endPoint = drawing.path[drawing.path.length - 1];

    if (!startPoint || !endPoint) {
      return;
    }

    const origin = `${startPoint.lat},${startPoint.lng}`;
    const destination = `${endPoint.lat},${endPoint.lng}`;

    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=transit`,
      '_blank',
      'noopener,noreferrer',
    );
  };
  const handleDeleteClick = () => {
    const shouldDelete = window.confirm(`"${drawing.label}" 선 또는 영역을 삭제할까요?`);

    if (!shouldDelete) {
      return;
    }

    eventBus.emit('drawing:delete', {
      drawingId: drawing.id,
    });
  };

  return (
    <section className="workspace-poi-popup">
      <div className="workspace-poi-popup-body">
        <DrawingAppearancePicker drawing={drawing} />

        <div className="workspace-poi-popup-main">
          <h2 className="workspace-poi-popup-title">{drawing.label}</h2>

          <div className="workspace-poi-popup-subtitle">
            <span className="workspace-poi-popup-subtitle-icon" aria-hidden="true">
              <MetaIcon />
            </span>
            <span className="workspace-poi-popup-subtitle-text">{subtitle}</span>
          </div>

          <div className="workspace-poi-popup-coordinates">
            <TransitRouteIcon />
            <span>{formatPathLabel(drawing.path)}</span>
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
            aria-label="경로 미리보기"
            onClick={handlePreviewClick}
          >
            <PreviewIcon />
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

      <div className="workspace-poi-popup-route-stats">
        <div className="workspace-poi-popup-route-stat">
          <span className="workspace-poi-popup-route-stat-icon" aria-hidden="true">
            <ClockIcon />
          </span>
          <span>{drawing.timeText}</span>
        </div>

        <div className="workspace-poi-popup-route-stat">
          <span className="workspace-poi-popup-route-stat-icon" aria-hidden="true">
            <BudgetIcon />
          </span>
          <span>{drawing.estimatedCost}</span>
        </div>
      </div>

      {drawing.memo ? (
        <p className="workspace-poi-popup-note">
          {drawing.memo}
        </p>
      ) : null}
    </section>
  );
}
