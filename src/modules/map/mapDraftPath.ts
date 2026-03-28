import type { MapToolId } from '../../models/Plan';

export interface DraftPathPoint {
  lat: number;
  lng: number;
}

const draftPathCloseThresholdMeters = 80;

interface SyncDraftPolylineParams {
  activeToolId: MapToolId;
  currentPolyline: google.maps.Polyline | null;
  draftPath: DraftPathPoint[];
  mapInstance: google.maps.Map;
  mapsApi: typeof google.maps;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function isPathTool(toolId: MapToolId): boolean {
  return toolId === 'line' || toolId === 'measure';
}

export function appendDraftPathPoint(
  currentPath: DraftPathPoint[],
  latLng: google.maps.LatLng,
): DraftPathPoint[] {
  const nextPoint = {
    lat: latLng.lat(),
    lng: latLng.lng(),
  };

  if (currentPath.length >= 3 && isPointNear(currentPath[0], nextPoint, draftPathCloseThresholdMeters)) {
    return [...currentPath, currentPath[0]];
  }

  return [
    ...currentPath,
    nextPoint,
  ];
}

function calculateDistanceMeters(from: DraftPathPoint, to: DraftPathPoint): number {
  const earthRadiusMeters = 6_371_000;
  const latDelta = toRadians(to.lat - from.lat);
  const lngDelta = toRadians(to.lng - from.lng);
  const fromLatRadians = toRadians(from.lat);
  const toLatRadians = toRadians(to.lat);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLatRadians) * Math.cos(toLatRadians) * Math.sin(lngDelta / 2) ** 2;
  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusMeters * arc;
}

export function isPointNear(
  from: DraftPathPoint,
  to: DraftPathPoint,
  thresholdMeters: number,
): boolean {
  return calculateDistanceMeters(from, to) <= thresholdMeters;
}

export function calculateDraftPathDistanceMeters(points: DraftPathPoint[]): number {
  if (points.length < 2) {
    return 0;
  }

  const earthRadiusMeters = 6_371_000;
  let totalDistanceMeters = 0;

  for (let index = 1; index < points.length; index += 1) {
    const previousPoint = points[index - 1];
    const currentPoint = points[index];
    const latDelta = toRadians(currentPoint.lat - previousPoint.lat);
    const lngDelta = toRadians(currentPoint.lng - previousPoint.lng);
    const previousLatRadians = toRadians(previousPoint.lat);
    const currentLatRadians = toRadians(currentPoint.lat);
    const haversine =
      Math.sin(latDelta / 2) ** 2 +
      Math.cos(previousLatRadians) *
        Math.cos(currentLatRadians) *
        Math.sin(lngDelta / 2) ** 2;
    const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

    totalDistanceMeters += earthRadiusMeters * arc;
  }

  return totalDistanceMeters;
}

export function isDraftPathClosed(points: DraftPathPoint[]): boolean {
  if (points.length < 4) {
    return false;
  }

  return isPointNear(points[0], points[points.length - 1], draftPathCloseThresholdMeters);
}

export function getFinalizedDraftPath(points: DraftPathPoint[]): DraftPathPoint[] {
  if (!points.length) {
    return [];
  }

  if (!isDraftPathClosed(points)) {
    return points;
  }

  return [...points.slice(0, -1), points[0]];
}

export function formatDraftPathDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  }

  return `${
    distanceMeters >= 10_000
      ? (distanceMeters / 1000).toFixed(0)
      : (distanceMeters / 1000).toFixed(1)
  }km`;
}

export function syncDraftPolyline({
  activeToolId,
  currentPolyline,
  draftPath,
  mapInstance,
  mapsApi,
}: SyncDraftPolylineParams): google.maps.Polyline | null {
  const shouldRenderDraftPath = isPathTool(activeToolId) && draftPath.length > 0;

  if (!shouldRenderDraftPath) {
    currentPolyline?.setMap(null);
    return currentPolyline;
  }

  const nextPolyline =
    currentPolyline ??
    new mapsApi.Polyline({
      clickable: false,
      geodesic: true,
      map: mapInstance,
    });

  nextPolyline.setOptions({
    map: mapInstance,
    path: draftPath,
    strokeColor: activeToolId === 'measure' ? '#2f6fed' : '#ff8a3d',
    strokeOpacity: 0.95,
    strokeWeight: activeToolId === 'measure' ? 2.6 : 3.2,
    zIndex: 90,
  });

  return nextPolyline;
}
