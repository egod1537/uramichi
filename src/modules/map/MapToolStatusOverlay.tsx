import {
  calculateDraftPathDistanceMeters,
  formatDraftPathDistance,
  type DraftPathPoint,
} from './mapDraftPath';

interface MapToolStatusOverlayProps {
  activeToolId: 'line' | 'measure';
  draftPath: DraftPathPoint[];
}

export default function MapToolStatusOverlay({
  activeToolId,
  draftPath,
}: MapToolStatusOverlayProps) {
  const draftPathDistanceMeters = calculateDraftPathDistanceMeters(draftPath);
  const shouldShowMeasureBadge =
    activeToolId === 'measure' && draftPath.length > 1 && draftPathDistanceMeters > 0;
  const shouldShowLineBadge = activeToolId === 'line' && draftPath.length > 1;

  if (!shouldShowLineBadge && !shouldShowMeasureBadge) {
    return null;
  }

  return (
    <div className="workspace-map-tool-status">
      <span className="workspace-map-tool-status-label">
        {activeToolId === 'measure'
          ? `거리 ${formatDraftPathDistance(draftPathDistanceMeters)}`
          : `선 ${draftPath.length}개 지점`}
      </span>
      <span className="workspace-map-tool-status-meta">
        {activeToolId === 'line'
          ? '좌클릭 점 추가 · 우클릭 드래그 이동 · Esc 완료'
          : '같은 도구를 한 번 더 누르면 종료'}
      </span>
    </div>
  );
}
