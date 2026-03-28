import { ClockIcon, PlusIcon } from '../../components/icons/WorkspaceIcons';

interface PinScheduleSummaryProps {
  isOpen: boolean;
  onToggle: () => void;
  summaryItems: string[];
}

function PinScheduleSummary({ isOpen, onToggle, summaryItems }: PinScheduleSummaryProps) {
  return (
    <div className="workspace-poi-popup-schedule-summary">
      <div className="workspace-poi-popup-schedule-header">
        <div className="workspace-poi-popup-schedule-title-row">
          <span className="workspace-poi-popup-schedule-icon" aria-hidden="true">
            <ClockIcon />
          </span>
          <span className="workspace-poi-popup-schedule-title">시간 설정</span>
        </div>
        <button
          type="button"
          className={`workspace-poi-popup-schedule-trigger ${
            isOpen ? 'workspace-poi-popup-schedule-trigger--active' : ''
          }`}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label="시간 설정 열기"
        >
          <PlusIcon />
        </button>
      </div>

      {summaryItems.length ? (
        <div className="workspace-poi-popup-schedule-summary-list">
          {summaryItems.map((summaryItem) => (
            <span key={summaryItem} className="workspace-poi-popup-schedule-summary-pill">
              {summaryItem}
            </span>
          ))}
        </div>
      ) : (
        <p className="workspace-poi-popup-schedule-empty">
          설정된 영업 시간이나 방문 시간이 없습니다.
        </p>
      )}
    </div>
  );
}

export default PinScheduleSummary;
