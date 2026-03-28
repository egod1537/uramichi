import type { CSSProperties } from 'react';
import { DAY_END_MINUTES, TIME_RANGE_STEP, formatTimeRangeSpan } from './pinScheduleTime';
import { formatClock } from '../../shared/utils/time';
import type { TimeRangeDraft } from './pinScheduleTime';

interface TimeRangeSliderProps {
  label: string;
  onEndChange: (minutes: number) => void;
  onStartChange: (minutes: number) => void;
  summary: string;
  value: TimeRangeDraft;
}

function buildSliderStyle(value: TimeRangeDraft): CSSProperties {
  const startPercent = (value.startMinutes / DAY_END_MINUTES) * 100;
  const endPercent = (value.endMinutes / DAY_END_MINUTES) * 100;

  return {
    ['--workspace-time-range-end' as string]: `${endPercent}%`,
    ['--workspace-time-range-start' as string]: `${startPercent}%`,
  };
}

function TimeRangeSlider({
  label,
  onEndChange,
  onStartChange,
  summary,
  value,
}: TimeRangeSliderProps) {
  return (
    <div className="workspace-poi-popup-time-range">
      <div className="workspace-poi-popup-time-range-header">
        <span className="workspace-poi-popup-field-label">{label}</span>
        <span className="workspace-poi-popup-time-range-summary">{summary}</span>
      </div>

      <div className="workspace-poi-popup-time-range-pills" aria-hidden="true">
        <span className="workspace-poi-popup-time-range-pill">
          L {formatClock(value.startMinutes)}
        </span>
        <span className="workspace-poi-popup-time-range-pill workspace-poi-popup-time-range-pill--span">
          {formatTimeRangeSpan(value)}
        </span>
        <span className="workspace-poi-popup-time-range-pill">
          R {formatClock(value.endMinutes)}
        </span>
      </div>

      <div className="workspace-poi-popup-time-range-slider" style={buildSliderStyle(value)}>
        <div className="workspace-poi-popup-time-range-track" aria-hidden="true" />
        <input
          type="range"
          min={0}
          max={DAY_END_MINUTES}
          step={TIME_RANGE_STEP}
          value={value.startMinutes}
          onChange={(event) => onStartChange(Number(event.target.value))}
          className="workspace-poi-popup-time-range-input workspace-poi-popup-time-range-input--start"
          aria-label={`${label} 시작 시간`}
        />
        <input
          type="range"
          min={0}
          max={DAY_END_MINUTES}
          step={TIME_RANGE_STEP}
          value={value.endMinutes}
          onChange={(event) => onEndChange(Number(event.target.value))}
          className="workspace-poi-popup-time-range-input workspace-poi-popup-time-range-input--end"
          aria-label={`${label} 종료 시간`}
        />
      </div>

      <div className="workspace-poi-popup-time-range-scale" aria-hidden="true">
        <span>00:00</span>
        <span>12:00</span>
        <span>24:00</span>
      </div>
    </div>
  );
}

export default TimeRangeSlider;
