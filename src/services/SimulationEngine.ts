import type { DayLayer } from '../models/Plan';
import type { DaySegment, PoiSegment } from '../models/Route';

export function findSegmentByPlaceId(day: DayLayer, placeId: string): PoiSegment | undefined {
  return day.segments.find(
    (segment): segment is PoiSegment => segment.type === 'poi' && segment.placeId === placeId,
  );
}

export function findActiveSegment(day: DayLayer, currentMinutes: number): DaySegment | undefined {
  return day.segments.find(
    (segment) => currentMinutes >= segment.start && currentMinutes <= segment.end,
  );
}

export function findActivePoiSegment(day: DayLayer, currentMinutes: number): PoiSegment | undefined {
  const segment = findActiveSegment(day, currentMinutes);

  if (segment?.type !== 'poi') {
    return undefined;
  }

  return segment;
}
