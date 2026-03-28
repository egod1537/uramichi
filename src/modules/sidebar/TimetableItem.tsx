import type React from 'react';
import { WarningIcon } from '../../components/icons/WorkspaceIcons';
import type { Poi } from '../../models/Poi';
import type { PoiSegment } from '../../models/Route';
import { getCategoryVisual } from '../../shared/constants/categories';
import { formatClock } from '../../shared/utils/time';

interface TimetableItemProps {
  hasTimeWarning: boolean;
  place: Poi;
  segment: PoiSegment;
  isActive: boolean;
  isDragTargetAfter: boolean;
  isDragTargetBefore: boolean;
  isDragging: boolean;
  isExpanded: boolean;
  onDragEnd: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragStart: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDrop: (event: React.DragEvent<HTMLButtonElement>) => void;
  onClick: () => void;
}

export default function TimetableItem({
  hasTimeWarning,
  place,
  segment,
  isActive,
  isDragTargetAfter,
  isDragTargetBefore,
  isDragging,
  isExpanded,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onClick,
}: TimetableItemProps) {
  const ItemIcon = getCategoryVisual(place.iconId).Icon;
  const detailParts = [place.businessHours, place.estimatedCost, place.memo].filter(Boolean);

  return (
    <button
      type="button"
      onClick={onClick}
      draggable={true}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
      className={`workspace-layer-poi ${isActive ? 'workspace-layer-poi--active' : ''} ${
        isExpanded ? 'workspace-layer-poi--expanded' : ''
      } ${isDragging ? 'workspace-layer-poi--dragging' : ''} ${
        isDragTargetBefore ? 'workspace-layer-poi--drop-before' : ''
      } ${
        isDragTargetAfter ? 'workspace-layer-poi--drop-after' : ''
      }`}
    >
      <span className="workspace-layer-item-time">{formatClock(segment.start)}</span>
      <span className="workspace-layer-item-rail workspace-layer-item-rail--poi">
        <span className="workspace-layer-item-icon" style={{ color: place.color }}>
          <ItemIcon />
        </span>
      </span>
        <span className="workspace-layer-item-main">
        <span className="workspace-layer-item-row">
          <span className="workspace-layer-item-name">{place.name}</span>
          <span className="workspace-layer-item-tag">{place.tag}</span>
          {hasTimeWarning ? (
            <span
              className="workspace-layer-item-warning"
              aria-label="시간 순서 경고"
              title="이 항목의 시간이 앞뒤 일정과 겹치거나 역순입니다."
            >
              <WarningIcon />
            </span>
          ) : null}
        </span>
        <span className="workspace-layer-item-detail">{detailParts.join(' · ')}</span>
      </span>
    </button>
  );
}
