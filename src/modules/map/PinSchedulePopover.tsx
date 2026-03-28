import { ClockIcon, CloseIcon } from '../../components/icons/WorkspaceIcons';
import TimeRangeSlider from './TimeRangeSlider';
import { formatTimeRangeSummary, type TimeRangeDraft } from './pinScheduleTime';

interface RangeCardProps {
  emptyLabel: string;
  isEnabled: boolean;
  label: string;
  onAdd: () => void;
  onClear: () => void;
  onEndChange: (minutes: number) => void;
  onStartChange: (minutes: number) => void;
  summary: string;
  value: TimeRangeDraft;
}

interface PinSchedulePopoverProps {
  businessHoursEnabled: boolean;
  businessHoursRange: TimeRangeDraft;
  hasChanges: boolean;
  onBusinessHoursAdd: () => void;
  onBusinessHoursClear: () => void;
  onBusinessHoursEndChange: (minutes: number) => void;
  onBusinessHoursStartChange: (minutes: number) => void;
  onClose: () => void;
  onReset: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onVisitTimeAdd: () => void;
  onVisitTimeClear: () => void;
  onVisitTimeEndChange: (minutes: number) => void;
  onVisitTimeStartChange: (minutes: number) => void;
  visitTimeEnabled: boolean;
  visitTimeRange: TimeRangeDraft;
}

function renderRangeCard({
  emptyLabel,
  isEnabled,
  label,
  onAdd,
  onClear,
  onEndChange,
  onStartChange,
  summary,
  value,
}: RangeCardProps) {
  if (!isEnabled) {
    return (
      <div className="workspace-poi-popup-schedule-empty-card">
        <div>
          <p className="workspace-poi-popup-field-label">{label}</p>
          <p className="workspace-poi-popup-schedule-empty-copy">{emptyLabel}</p>
        </div>
        <button
          type="button"
          className="workspace-poi-popup-secondary-button"
          onClick={onAdd}
        >
          추가
        </button>
      </div>
    );
  }

  return (
    <div className="workspace-poi-popup-schedule-range-card">
      <TimeRangeSlider
        label={label}
        onEndChange={onEndChange}
        onStartChange={onStartChange}
        summary={summary}
        value={value}
      />
      <div className="workspace-poi-popup-schedule-inline-actions">
        <button
          type="button"
          className="workspace-poi-popup-secondary-button"
          onClick={onClear}
        >
          삭제
        </button>
      </div>
    </div>
  );
}

function PinSchedulePopover({
  businessHoursEnabled,
  businessHoursRange,
  hasChanges,
  onBusinessHoursAdd,
  onBusinessHoursClear,
  onBusinessHoursEndChange,
  onBusinessHoursStartChange,
  onClose,
  onReset,
  onSubmit,
  onVisitTimeAdd,
  onVisitTimeClear,
  onVisitTimeEndChange,
  onVisitTimeStartChange,
  visitTimeEnabled,
  visitTimeRange,
}: PinSchedulePopoverProps) {
  return (
    <div className="workspace-poi-popup-schedule-popover">
      <div className="workspace-poi-popup-schedule-popover-header">
        <div className="workspace-poi-popup-schedule-title-row">
          <span className="workspace-poi-popup-schedule-icon" aria-hidden="true">
            <ClockIcon />
          </span>
          <span className="workspace-poi-popup-schedule-title">시간 설정</span>
        </div>
        <button
          type="button"
          className="workspace-poi-popup-schedule-close"
          onClick={onClose}
          aria-label="시간 설정 닫기"
        >
          <CloseIcon />
        </button>
      </div>

      <form className="workspace-poi-popup-schedule-popover-body" onSubmit={onSubmit}>
        <div className="workspace-poi-popup-schedule-grid">
          {renderRangeCard({
            emptyLabel: '영업 시간을 아직 설정하지 않았습니다.',
            isEnabled: businessHoursEnabled,
            label: '영업 시간',
            onAdd: onBusinessHoursAdd,
            onClear: onBusinessHoursClear,
            onEndChange: onBusinessHoursEndChange,
            onStartChange: onBusinessHoursStartChange,
            summary: formatTimeRangeSummary(businessHoursRange, '항시 운영'),
            value: businessHoursRange,
          })}

          {renderRangeCard({
            emptyLabel: '방문 시간을 아직 설정하지 않았습니다.',
            isEnabled: visitTimeEnabled,
            label: '방문 시간',
            onAdd: onVisitTimeAdd,
            onClear: onVisitTimeClear,
            onEndChange: onVisitTimeEndChange,
            onStartChange: onVisitTimeStartChange,
            summary: formatTimeRangeSummary(visitTimeRange),
            value: visitTimeRange,
          })}
        </div>

        <div className="workspace-poi-popup-schedule-actions">
          <button
            type="button"
            onClick={onReset}
            className="workspace-poi-popup-secondary-button"
            disabled={!hasChanges}
          >
            되돌리기
          </button>
          <button
            type="submit"
            className="workspace-poi-popup-primary-button"
            disabled={!hasChanges}
          >
            저장
          </button>
        </div>
      </form>
    </div>
  );
}

export default PinSchedulePopover;
