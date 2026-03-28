import type { DaySegment, TimelineRange } from '../../models/Route';

interface TimeBlockProps {
  range: TimelineRange;
  segment: DaySegment;
}

export default function TimeBlock({ range, segment }: TimeBlockProps) {
  const total = range.end - range.start;
  const left = ((segment.start - range.start) / total) * 100;
  const width = ((segment.end - segment.start) / total) * 100;

  return (
    <div
      className={`workspace-timeline-segment workspace-timeline-segment--${segment.type}`}
      style={{ left: `${left}%`, width: `${width}%`, backgroundColor: segment.color }}
      title={segment.label}
    />
  );
}
