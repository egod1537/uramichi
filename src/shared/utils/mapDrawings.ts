import type { MapDrawing, MapDrawingIconId, MapDrawingRole, MapDrawingType, RoutePoint } from '../../models/Route';

const DEFAULT_ROUTE_COLOR = '#2f6fed';
const DEFAULT_ANNOTATION_LINE_COLOR = '#ff8a3d';

function getDefaultDrawingIconId(
  role: MapDrawingRole | undefined,
  _type: MapDrawingType,
): MapDrawingIconId {
  if (role === 'itinerary') {
    return 'train';
  }

  return 'walk';
}

function getDefaultDrawingColor(
  role: MapDrawingRole | undefined,
  type: MapDrawingType,
): string {
  if (type === 'polygon') {
    return DEFAULT_ROUTE_COLOR;
  }

  return role === 'itinerary' ? DEFAULT_ROUTE_COLOR : DEFAULT_ANNOTATION_LINE_COLOR;
}

function getDefaultDrawingLabel(
  dayLabel: string,
  role: MapDrawingRole | undefined,
  type: MapDrawingType,
  index: number,
): string {
  if (role === 'itinerary') {
    return `${dayLabel} 이동 경로`;
  }

  return type === 'polygon' ? `직접 그린 영역 ${index + 1}` : `직접 그린 경로 ${index + 1}`;
}

function getDefaultDrawingDetail(
  role: MapDrawingRole | undefined,
  type: MapDrawingType,
): string {
  if (role === 'itinerary') {
    return '일정에 연결된 이동 경로';
  }

  return type === 'polygon' ? '지도 위에 직접 표시한 영역' : '지도 위에 직접 표시한 경로';
}

export function normalizeMapDrawing(
  drawing: MapDrawing,
  dayLabel: string,
  index: number,
): MapDrawing {
  const strokeColor =
    drawing.strokeColor?.trim() || getDefaultDrawingColor(drawing.role, drawing.type);
  const normalizedLabel = drawing.label?.trim();
  const normalizedDetail = drawing.detail?.trim();
  const normalizedTimeText = drawing.timeText?.trim();
  const normalizedEstimatedCost = drawing.estimatedCost?.trim();
  const normalizedMemo = typeof drawing.memo === 'string' ? drawing.memo : '';

  return {
    ...drawing,
    detail: normalizedDetail || getDefaultDrawingDetail(drawing.role, drawing.type),
    estimatedCost: normalizedEstimatedCost || '요금 미정',
    fillColor: drawing.type === 'polygon' ? drawing.fillColor?.trim() || strokeColor : undefined,
    iconId: drawing.iconId ?? getDefaultDrawingIconId(drawing.role, drawing.type),
    label: normalizedLabel || getDefaultDrawingLabel(dayLabel, drawing.role, drawing.type, index),
    memo: normalizedMemo,
    strokeColor,
    timeText: normalizedTimeText || '시간 미정',
  };
}

export function buildDefaultMapDrawing(
  dayLabel: string,
  drawingId: string,
  index: number,
  path: RoutePoint[],
  type: MapDrawingType,
  role: MapDrawingRole = 'annotation',
): MapDrawing {
  const strokeColor = getDefaultDrawingColor(role, type);

  return normalizeMapDrawing(
    {
      detail: '',
      estimatedCost: '',
      fillColor: type === 'polygon' ? strokeColor : undefined,
      iconId: getDefaultDrawingIconId(role, type),
      id: drawingId,
      label: '',
      memo: '',
      path,
      role,
      strokeColor,
      timeText: '',
      type,
    },
    dayLabel,
    index,
  );
}

export function getDrawingAnchorPosition(path: RoutePoint[]): RoutePoint {
  if (!path.length) {
    return { lat: 0, lng: 0 };
  }

  const totals = path.reduce(
    (accumulator, point) => ({
      lat: accumulator.lat + point.lat,
      lng: accumulator.lng + point.lng,
    }),
    { lat: 0, lng: 0 },
  );

  return {
    lat: totals.lat / path.length,
    lng: totals.lng / path.length,
  };
}
