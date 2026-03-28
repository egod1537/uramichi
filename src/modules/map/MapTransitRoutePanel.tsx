import { ClockIcon, CloseIcon, MapPinIcon, TransportIcon } from '../../components/icons/WorkspaceIcons';
import type { TransitRouteCandidate, TransitSelectionPoint, TransitStepKind } from './mapTransit';

interface MapTransitRoutePanelProps {
  activeToolId: 'transit' | 'hand' | 'pin' | 'line' | 'measure';
  errorMessage: string;
  isLoading: boolean;
  onClear: () => void;
  onResetPoints: () => void;
  onSelectRoute: (routeId: string) => void;
  points: TransitSelectionPoint[];
  routes: TransitRouteCandidate[];
  selectedRouteId: string | null;
}

function getStepKindLabel(kind: TransitStepKind): string {
  switch (kind) {
    case 'walk':
      return '도보';
    case 'bus':
      return '버스';
    case 'subway':
      return '지하철';
    case 'train':
      return '철도';
    case 'tram':
      return '트램';
    case 'ferry':
      return '페리';
    default:
      return '이동';
  }
}

export default function MapTransitRoutePanel({
  activeToolId,
  errorMessage,
  isLoading,
  onClear,
  onResetPoints,
  onSelectRoute,
  points,
  routes,
  selectedRouteId,
}: MapTransitRoutePanelProps) {
  const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? null;
  const shouldShowPanel = activeToolId === 'transit' || points.length > 0 || routes.length > 0;

  if (!shouldShowPanel) {
    return null;
  }

  return (
    <section className="workspace-transit-panel">
      <header className="workspace-transit-panel-header">
        <div className="workspace-transit-panel-title-row">
          <span className="workspace-transit-panel-title-icon" aria-hidden="true">
            <TransportIcon />
          </span>
          <div>
            <h2 className="workspace-transit-panel-title">대중교통 경로</h2>
            <p className="workspace-transit-panel-subtitle">
              시작점과 끝점을 찍으면 경로 후보를 가져옵니다.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="workspace-transit-panel-close"
          onClick={onClear}
          aria-label="대중교통 경로 패널 닫기"
        >
          <CloseIcon />
        </button>
      </header>

      <div className="workspace-transit-point-list">
        {points.length ? (
          points.map((point, index) => (
            <div key={`${point.label}-${index}`} className="workspace-transit-point-chip">
              <span
                className={`workspace-transit-point-chip-badge ${
                  index === 0
                    ? 'workspace-transit-point-chip-badge--origin'
                    : 'workspace-transit-point-chip-badge--destination'
                }`}
              >
                {index === 0 ? 'A' : 'B'}
              </span>
              <span className="workspace-transit-point-chip-label">{point.label}</span>
            </div>
          ))
        ) : (
          <div className="workspace-transit-panel-hint">
            <MapPinIcon />
            <span>지도에서 출발지와 도착지를 차례대로 클릭하세요.</span>
          </div>
        )}
      </div>

      {points.length > 0 ? (
        <div className="workspace-transit-panel-actions">
          <button
            type="button"
            onClick={onResetPoints}
            className="workspace-transit-panel-secondary-button"
          >
            선택 초기화
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="workspace-transit-panel-state workspace-transit-panel-state--loading">
          <ClockIcon />
          <span>대중교통 경로 후보를 불러오는 중입니다...</span>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="workspace-transit-panel-error">{errorMessage}</p>
      ) : null}

      {routes.length ? (
        <div className="workspace-transit-route-list">
          {routes.map((route, index) => (
            <button
              key={route.id}
              type="button"
              className={`workspace-transit-route-card ${
                route.id === selectedRouteId ? 'workspace-transit-route-card--active' : ''
              }`}
              onClick={() => onSelectRoute(route.id)}
            >
              <div className="workspace-transit-route-card-header">
                <span className="workspace-transit-route-card-index">후보 {index + 1}</span>
                <span className="workspace-transit-route-card-duration">{route.totalDurationText}</span>
              </div>
              <p className="workspace-transit-route-card-summary">{route.summary}</p>
              <div className="workspace-transit-route-card-meta">
                {route.fareText ? <span>{route.fareText}</span> : null}
                {route.departureTimeText && route.arrivalTimeText ? (
                  <span>
                    {route.departureTimeText} - {route.arrivalTimeText}
                  </span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {selectedRoute ? (
        <div className="workspace-transit-step-list">
          <div className="workspace-transit-step-list-header">
            <span className="workspace-transit-step-list-title">선택한 경로 세그먼트</span>
            <span className="workspace-transit-step-list-meta">
              {selectedRoute.startAddress} → {selectedRoute.endAddress}
            </span>
          </div>

          {selectedRoute.steps.map((step) => (
            <div key={step.id} className="workspace-transit-step-row">
              <span
                className={`workspace-transit-step-badge workspace-transit-step-badge--${step.kind}`}
              >
                {getStepKindLabel(step.kind)}
              </span>
              <div className="workspace-transit-step-copy">
                <p className="workspace-transit-step-title">{step.lineLabel}</p>
                <p className="workspace-transit-step-detail">
                  {[step.detail, step.timeRangeText].filter(Boolean).join(' · ') || step.instruction}
                </p>
              </div>
              <span className="workspace-transit-step-duration">{step.durationText}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
