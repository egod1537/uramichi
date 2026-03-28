import type { DaySegment } from '../../models/Route';
import { formatClock, formatDuration } from '../../shared/utils/time';

interface TransitSegmentProps {
  segment: DaySegment;
  isActive: boolean;
}

export default function TransitSegment({ segment, isActive }: TransitSegmentProps) {
  const isFree = segment.type === 'free';

  return (
    <div
      className={`workspace-layer-connector ${
        isFree ? 'workspace-layer-connector--free' : ''
      } ${isActive ? 'workspace-layer-connector--active' : ''}`}
    >
      <span className="workspace-layer-item-time">{formatClock(segment.start)}</span>
      <span className="workspace-layer-item-rail workspace-layer-item-rail--connector" />
      <span className="workspace-layer-connector-label">
        {segment.label} · {formatDuration(segment.start, segment.end)}
      </span>
    </div>
  );
}
