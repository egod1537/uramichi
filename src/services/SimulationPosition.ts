import type { DayLayer } from '../models/Plan';
import type { Poi } from '../models/Poi';
import type { DaySegment, PoiSegment, RoutePoint } from '../models/Route';
import type { SimulationPosition } from '../models/Simulation';
import { findActiveSegment } from './SimulationEngine';

function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function measurePointDistance(from: RoutePoint, to: RoutePoint): number {
  const deltaLat = to.lat - from.lat;
  const deltaLng = to.lng - from.lng;

  return Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);
}

function interpolatePoint(from: RoutePoint, to: RoutePoint, progress: number): RoutePoint {
  return {
    lat: from.lat + (to.lat - from.lat) * progress,
    lng: from.lng + (to.lng - from.lng) * progress,
  };
}

function interpolateAlongPath(path: RoutePoint[], progress: number): RoutePoint {
  if (path.length <= 1) {
    return path[0];
  }

  const clampedProgress = clampProgress(progress);
  const segmentLengths = path.slice(1).map((point, index) => {
    return measurePointDistance(path[index], point);
  });
  const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0);

  if (totalLength <= 0) {
    return path[path.length - 1];
  }

  const targetLength = totalLength * clampedProgress;
  let traversedLength = 0;

  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index];
    const nextTraversedLength = traversedLength + segmentLength;

    if (targetLength <= nextTraversedLength) {
      const localProgress =
        segmentLength <= 0 ? 0 : (targetLength - traversedLength) / segmentLength;

      return interpolatePoint(path[index], path[index + 1], localProgress);
    }

    traversedLength = nextTraversedLength;
  }

  return path[path.length - 1];
}

function findPoiById(day: DayLayer, placeId: string): Poi | null {
  return day.places.find((place) => place.id === placeId) ?? null;
}

function findClosestPathPointIndex(path: RoutePoint[], point: RoutePoint): number {
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  path.forEach((candidatePoint, index) => {
    const distance = measurePointDistance(candidatePoint, point);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function slicePathBetweenPoints(
  path: RoutePoint[],
  startPoint: RoutePoint,
  endPoint: RoutePoint,
): RoutePoint[] {
  if (path.length < 2) {
    return [startPoint, endPoint];
  }

  const startIndex = findClosestPathPointIndex(path, startPoint);
  const endIndex = findClosestPathPointIndex(path, endPoint);

  if (startIndex === endIndex) {
    return [startPoint, endPoint];
  }

  const slicedPath =
    startIndex < endIndex
      ? path.slice(startIndex, endIndex + 1)
      : path.slice(endIndex, startIndex + 1).reverse();

  if (slicedPath.length < 2) {
    return [startPoint, endPoint];
  }

  return [startPoint, ...slicedPath.slice(1, -1), endPoint];
}

function findAdjacentPoiSegments(
  segments: DaySegment[],
  activeSegmentId: string,
): { nextPoiSegment: PoiSegment | null; previousPoiSegment: PoiSegment | null } {
  const activeIndex = segments.findIndex((segment) => segment.id === activeSegmentId);
  let previousPoiSegment: PoiSegment | null = null;
  let nextPoiSegment: PoiSegment | null = null;

  for (let index = activeIndex - 1; index >= 0; index -= 1) {
    const segment = segments[index];

    if (segment?.type === 'poi') {
      previousPoiSegment = segment;
      break;
    }
  }

  for (let index = activeIndex + 1; index < segments.length; index += 1) {
    const segment = segments[index];

    if (segment?.type === 'poi') {
      nextPoiSegment = segment;
      break;
    }
  }

  return {
    nextPoiSegment,
    previousPoiSegment,
  };
}

function resolveRoutePath(
  day: DayLayer,
  startPoint: RoutePoint,
  endPoint: RoutePoint,
): RoutePoint[] {
  const routeDrawing =
    day.drawings.find((drawing) => drawing.type === 'polyline' && drawing.role === 'itinerary') ??
    day.drawings.find((drawing) => drawing.type === 'polyline');

  if (!routeDrawing || routeDrawing.path.length < 2) {
    return [startPoint, endPoint];
  }

  return slicePathBetweenPoints(routeDrawing.path, startPoint, endPoint);
}

export function resolveSimulationPosition(
  day: DayLayer,
  currentMinutes: number,
): SimulationPosition | null {
  const activeSegment = findActiveSegment(day, currentMinutes);

  if (!activeSegment) {
    return null;
  }

  if (activeSegment.type === 'poi') {
    const place = findPoiById(day, activeSegment.placeId);

    if (!place) {
      return null;
    }

    return {
      activePlaceId: place.id,
      activeSegmentId: activeSegment.id,
      kind: 'poi',
      position: place.position,
      progress: 0,
    };
  }

  const { nextPoiSegment, previousPoiSegment } = findAdjacentPoiSegments(
    day.segments,
    activeSegment.id,
  );
  const previousPlace = previousPoiSegment ? findPoiById(day, previousPoiSegment.placeId) : null;
  const nextPlace = nextPoiSegment ? findPoiById(day, nextPoiSegment.placeId) : null;

  if (!previousPlace && !nextPlace) {
    return null;
  }

  if (!previousPlace || !nextPlace) {
    const fallbackPlace = previousPlace ?? nextPlace;

    if (!fallbackPlace) {
      return null;
    }

    return {
      activePlaceId: fallbackPlace.id,
      activeSegmentId: activeSegment.id,
      kind: 'route',
      position: fallbackPlace.position,
      progress: 1,
    };
  }

  const segmentDuration = activeSegment.end - activeSegment.start;
  const progress =
    segmentDuration <= 0
      ? 0
      : clampProgress((currentMinutes - activeSegment.start) / segmentDuration);
  const routePath = resolveRoutePath(day, previousPlace.position, nextPlace.position);

  return {
    activePlaceId: null,
    activeSegmentId: activeSegment.id,
    kind: 'route',
    position: interpolateAlongPath(routePath, progress),
    progress,
  };
}
