import type { DayLayer } from '../models/Plan';
import type { Poi } from '../models/Poi';
import type { DaySegment, PoiSegment } from '../models/Route';
import { getCategoryVisual } from '../shared/constants/categories';

interface RebuildDayLayerParams {
  day: DayLayer;
  places: Poi[];
  poiSegmentsByPlaceId: Map<string, PoiSegment>;
}

interface MovePoiBetweenLayersParams {
  dayLayers: DayLayer[];
  placeId: string;
  targetDayId: string;
  targetPlaceId: string | null;
  position: 'after' | 'before';
}

export interface MovePoiBetweenLayersResult {
  dayLayers: DayLayer[];
  movedPlace: Poi | null;
  targetDay: DayLayer | null;
}

function clampDuration(duration: number, fallback: number): number {
  return Number.isFinite(duration) && duration > 0 ? duration : fallback;
}

function parseVisitTimeDuration(visitTime: string): number {
  const matchedRange = visitTime.match(/(\d{2}):(\d{2})\s*[~-]\s*(\d{2}):(\d{2})/u);

  if (!matchedRange) {
    return 60;
  }

  const startMinutes = Number(matchedRange[1]) * 60 + Number(matchedRange[2]);
  const endMinutes = Number(matchedRange[3]) * 60 + Number(matchedRange[4]);

  return clampDuration(endMinutes - startMinutes, 60);
}

function createPoiSegment(
  dayId: string,
  place: Poi,
  templateSegment: PoiSegment | undefined,
  start: number,
  end: number,
): PoiSegment {
  return {
    id: templateSegment?.id ?? `${dayId}-${place.id}-segment`,
    type: 'poi',
    placeId: place.id,
    label: place.name,
    start,
    end,
    color: place.color,
  };
}

function createConnectorSegment(
  dayId: string,
  templateSegment: DaySegment | undefined,
  index: number,
  start: number,
): DaySegment {
  const fallbackDuration = 20;
  const duration = clampDuration(
    templateSegment ? templateSegment.end - templateSegment.start : fallbackDuration,
    fallbackDuration,
  );
  const end = start + duration;

  if (!templateSegment) {
    return {
      id: `${dayId}-travel-${index + 1}`,
      type: 'travel',
      label: `이동 · ${duration}분`,
      start,
      end,
      color: getCategoryVisual('교통').color,
    };
  }

  return {
    ...templateSegment,
    id: `${dayId}-${templateSegment.id.replace(/^.*?-/, '')}`,
    start,
    end,
  };
}

function rebuildDayLayer({ day, places, poiSegmentsByPlaceId }: RebuildDayLayerParams): DayLayer {
  if (places.length === 0) {
    return {
      ...day,
      places: [],
      segments: [],
    };
  }

  const connectorTemplates = day.segments.filter((segment) => segment.type !== 'poi');
  const firstPoiSegment = day.segments.find(
    (segment): segment is PoiSegment => segment.type === 'poi',
  );
  const rebuiltSegments: DaySegment[] = [];
  let cursor = firstPoiSegment?.start ?? day.timelineRange.start;

  places.forEach((place, index) => {
    const templateSegment = poiSegmentsByPlaceId.get(place.id);
    const poiDuration = clampDuration(
      templateSegment ? templateSegment.end - templateSegment.start : parseVisitTimeDuration(place.visitTime),
      60,
    );
    const poiSegment = createPoiSegment(day.id, place, templateSegment, cursor, cursor + poiDuration);

    rebuiltSegments.push(poiSegment);
    cursor = poiSegment.end;

    if (index < places.length - 1) {
      const connectorSegment = createConnectorSegment(day.id, connectorTemplates[index], index, cursor);

      rebuiltSegments.push(connectorSegment);
      cursor = connectorSegment.end;
    }
  });

  return {
    ...day,
    places,
    segments: rebuiltSegments,
    timelineRange: {
      start: day.timelineRange.start,
      end: Math.max(day.timelineRange.end, rebuiltSegments[rebuiltSegments.length - 1]?.end ?? day.timelineRange.end),
    },
  };
}

function createPoiSegmentLookup(dayLayers: DayLayer[]): Map<string, PoiSegment> {
  const lookup = new Map<string, PoiSegment>();

  dayLayers.forEach((day) => {
    day.segments.forEach((segment) => {
      if (segment.type === 'poi') {
        lookup.set(segment.placeId, segment);
      }
    });
  });

  return lookup;
}

function insertPlaceAtTarget(
  places: Poi[],
  movedPlace: Poi,
  targetPlaceId: string | null,
  position: 'after' | 'before',
): Poi[] {
  const nextPlaces = [...places];

  if (!targetPlaceId) {
    nextPlaces.push(movedPlace);
    return nextPlaces;
  }

  const targetIndex = nextPlaces.findIndex((place) => place.id === targetPlaceId);

  if (targetIndex < 0) {
    nextPlaces.push(movedPlace);
    return nextPlaces;
  }

  const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;

  nextPlaces.splice(insertIndex, 0, movedPlace);
  return nextPlaces;
}

export function movePoiBetweenDayLayers({
  dayLayers,
  placeId,
  targetDayId,
  targetPlaceId,
  position,
}: MovePoiBetweenLayersParams): MovePoiBetweenLayersResult {
  const sourceDay = dayLayers.find((day) => day.places.some((place) => place.id === placeId));
  const targetDay = dayLayers.find((day) => day.id === targetDayId);

  if (!sourceDay || !targetDay) {
    return {
      dayLayers,
      movedPlace: null,
      targetDay: null,
    };
  }

  if (targetPlaceId === placeId) {
    return {
      dayLayers,
      movedPlace: null,
      targetDay: null,
    };
  }

  const sourcePlace = sourceDay.places.find((place) => place.id === placeId);

  if (!sourcePlace) {
    return {
      dayLayers,
      movedPlace: null,
      targetDay: null,
    };
  }

  const poiSegmentsByPlaceId = createPoiSegmentLookup(dayLayers);
  const nextSourcePlaces = sourceDay.places.filter((place) => place.id !== placeId);
  const movedPlace: Poi = {
    ...sourcePlace,
    dayId: targetDay.id,
  };
  const nextTargetPlaces =
    sourceDay.id === targetDay.id
      ? insertPlaceAtTarget(nextSourcePlaces, movedPlace, targetPlaceId, position)
      : insertPlaceAtTarget(targetDay.places, movedPlace, targetPlaceId, position);
  const nextDayLayers = dayLayers.map((day) => {
    if (day.id === sourceDay.id && day.id === targetDay.id) {
      return rebuildDayLayer({
        day,
        places: nextTargetPlaces,
        poiSegmentsByPlaceId,
      });
    }

    if (day.id === sourceDay.id) {
      return rebuildDayLayer({
        day,
        places: nextSourcePlaces,
        poiSegmentsByPlaceId,
      });
    }

    if (day.id === targetDay.id) {
      return rebuildDayLayer({
        day,
        places: nextTargetPlaces,
        poiSegmentsByPlaceId,
      });
    }

    return day;
  });

  return {
    dayLayers: nextDayLayers,
    movedPlace,
    targetDay: nextDayLayers.find((day) => day.id === targetDay.id) ?? null,
  };
}
