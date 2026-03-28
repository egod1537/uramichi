import type { DayLayer, PlannerSnapshot } from '../models/Plan';
import type { Poi } from '../models/Poi';
import type { MapDrawing, RoutePoint } from '../models/Route';

function escapeXml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&apos;');
}

function parseHexColor(value: string): { a: number; b: number; g: number; r: number } | null {
  const normalizedValue = value.trim();
  const hexMatch = normalizedValue.match(/^#(?<hex>[0-9a-f]{6}|[0-9a-f]{8})$/iu);

  if (!hexMatch?.groups?.hex) {
    return null;
  }

  const { hex } = hexMatch.groups;

  if (hex.length === 6) {
    return {
      a: 255,
      b: Number.parseInt(hex.slice(4, 6), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      r: Number.parseInt(hex.slice(0, 2), 16),
    };
  }

  return {
    a: Number.parseInt(hex.slice(6, 8), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    r: Number.parseInt(hex.slice(0, 2), 16),
  };
}

function parseRgbColor(value: string): { a: number; b: number; g: number; r: number } | null {
  const normalizedValue = value.trim();
  const rgbMatch = normalizedValue.match(
    /^rgba?\(\s*(?<r>\d{1,3})\s*,\s*(?<g>\d{1,3})\s*,\s*(?<b>\d{1,3})(?:\s*,\s*(?<a>0|1|0?\.\d+))?\s*\)$/iu,
  );

  if (!rgbMatch?.groups?.r || !rgbMatch.groups.g || !rgbMatch.groups.b) {
    return null;
  }

  return {
    a: Math.round(Number.parseFloat(rgbMatch.groups.a ?? '1') * 255),
    b: Number.parseInt(rgbMatch.groups.b, 10),
    g: Number.parseInt(rgbMatch.groups.g, 10),
    r: Number.parseInt(rgbMatch.groups.r, 10),
  };
}

function toKmlColor(value: string, fallback = 'ffed6f2f'): string {
  const parsedColor = parseHexColor(value) ?? parseRgbColor(value);

  if (!parsedColor) {
    return fallback;
  }

  const { a, b, g, r } = parsedColor;

  return [a, b, g, r]
    .map((channel) => {
      const clampedChannel = Math.max(0, Math.min(255, channel));

      return clampedChannel.toString(16).padStart(2, '0');
    })
    .join('');
}

function serializeExtendedData(fields: Array<[string, string | number | null | undefined]>): string {
  const rows = fields
    .filter(([, value]) => value !== null && typeof value !== 'undefined' && value !== '')
    .map(([name, value]) => {
      return `<Data name="${escapeXml(name)}"><value>${escapeXml(String(value))}</value></Data>`;
    })
    .join('');

  return rows ? `<ExtendedData>${rows}</ExtendedData>` : '';
}

function serializeCoordinates(path: RoutePoint[]): string {
  return path.map((point) => `${point.lng},${point.lat},0`).join(' ');
}

function ensureClosedCoordinates(path: RoutePoint[]): RoutePoint[] {
  if (!path.length) {
    return [];
  }

  const firstPoint = path[0];
  const lastPoint = path[path.length - 1];

  if (firstPoint.lat === lastPoint.lat && firstPoint.lng === lastPoint.lng) {
    return path;
  }

  return [...path, firstPoint];
}

function serializeDescription(lines: string[]): string {
  const content = lines.filter(Boolean).join('\n');

  return content ? `<description>${escapeXml(content)}</description>` : '';
}

function serializePoiPlacemark(place: Poi, day: DayLayer): string {
  const iconColor = toKmlColor(place.color, 'ffed6f2f');
  const pointDescription = serializeDescription([
    place.summary,
    place.detail,
    place.visitTime ? `방문 시간: ${place.visitTime}` : '',
    place.businessHours ? `영업 시간: ${place.businessHours}` : '',
    place.estimatedCost ? `예상 비용: ${place.estimatedCost}` : '',
    place.memo ? `메모: ${place.memo}` : '',
  ]);

  return `
    <Placemark>
      <name>${escapeXml(place.name)}</name>
      ${pointDescription}
      <Style>
        <IconStyle>
          <color>${iconColor}</color>
          <scale>1.15</scale>
        </IconStyle>
        <LabelStyle>
          <scale>1</scale>
        </LabelStyle>
      </Style>
      ${serializeExtendedData([
        ['itemType', 'poi'],
        ['dayId', day.id],
        ['dayLabel', day.label],
        ['dayMeta', day.meta],
        ['category', place.tag],
        ['iconId', place.iconId],
        ['color', place.color],
        ['summary', place.summary],
        ['detail', place.detail],
        ['businessHours', place.businessHours],
        ['visitTime', place.visitTime],
        ['estimatedCost', place.estimatedCost],
        ['memo', place.memo],
        ['zoom', place.zoom ?? ''],
      ])}
      <Point>
        <coordinates>${place.position.lng},${place.position.lat},0</coordinates>
      </Point>
    </Placemark>
  `.trim();
}

function serializePolylinePlacemark(drawing: MapDrawing, day: DayLayer): string {
  return `
    <Placemark>
      <name>${escapeXml(drawing.label)}</name>
      ${serializeDescription([
        drawing.detail,
        `시간: ${drawing.timeText}`,
        `비용: ${drawing.estimatedCost}`,
        drawing.memo ? `메모: ${drawing.memo}` : '',
      ])}
      <Style>
        <LineStyle>
          <color>${toKmlColor(drawing.strokeColor, 'ffed6f2f')}</color>
          <width>${drawing.role === 'itinerary' ? 5 : 4}</width>
        </LineStyle>
      </Style>
      ${serializeExtendedData([
        ['itemType', 'drawing'],
        ['dayId', day.id],
        ['dayLabel', day.label],
        ['dayMeta', day.meta],
        ['drawingType', drawing.type],
        ['drawingRole', drawing.role ?? 'annotation'],
        ['iconId', drawing.iconId],
        ['strokeColor', drawing.strokeColor],
        ['detail', drawing.detail],
        ['timeText', drawing.timeText],
        ['estimatedCost', drawing.estimatedCost],
        ['memo', drawing.memo],
      ])}
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>${serializeCoordinates(drawing.path)}</coordinates>
      </LineString>
    </Placemark>
  `.trim();
}

function serializePolygonPlacemark(drawing: MapDrawing, day: DayLayer): string {
  const closedPath = ensureClosedCoordinates(drawing.path);

  return `
    <Placemark>
      <name>${escapeXml(drawing.label)}</name>
      ${serializeDescription([
        drawing.detail,
        `시간: ${drawing.timeText}`,
        `비용: ${drawing.estimatedCost}`,
        drawing.memo ? `메모: ${drawing.memo}` : '',
      ])}
      <Style>
        <LineStyle>
          <color>${toKmlColor(drawing.strokeColor, 'ffed6f2f')}</color>
          <width>4</width>
        </LineStyle>
        <PolyStyle>
          <color>${toKmlColor(drawing.fillColor ?? drawing.strokeColor, '662f6fed')}</color>
        </PolyStyle>
      </Style>
      ${serializeExtendedData([
        ['itemType', 'drawing'],
        ['dayId', day.id],
        ['dayLabel', day.label],
        ['dayMeta', day.meta],
        ['drawingType', drawing.type],
        ['drawingRole', drawing.role ?? 'annotation'],
        ['iconId', drawing.iconId],
        ['strokeColor', drawing.strokeColor],
        ['fillColor', drawing.fillColor ?? drawing.strokeColor],
        ['detail', drawing.detail],
        ['timeText', drawing.timeText],
        ['estimatedCost', drawing.estimatedCost],
        ['memo', drawing.memo],
      ])}
      <Polygon>
        <tessellate>1</tessellate>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${serializeCoordinates(closedPath)}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  `.trim();
}

function serializeDrawingPlacemark(drawing: MapDrawing, day: DayLayer): string {
  if (drawing.type === 'polygon') {
    return serializePolygonPlacemark(drawing, day);
  }

  return serializePolylinePlacemark(drawing, day);
}

function serializeDayFolder(day: DayLayer): string {
  const poiPlacemarks = day.places.map((place) => serializePoiPlacemark(place, day));
  const drawingPlacemarks = day.drawings.map((drawing) => serializeDrawingPlacemark(drawing, day));
  const folderDescription = serializeDescription([
    day.meta,
    `장소 ${day.places.length}개`,
    `선/영역 ${day.drawings.length}개`,
  ]);

  return `
    <Folder>
      <name>${escapeXml(day.label)}</name>
      ${folderDescription}
      ${[...poiPlacemarks, ...drawingPlacemarks].join('\n')}
    </Folder>
  `.trim();
}

export function serializePlannerToKml(snapshot: PlannerSnapshot): string {
  const documentDescription = serializeDescription([
    snapshot.planMeta.travelRange,
    `레이어 ${snapshot.dayLayers.length}개`,
    `전체 장소 ${snapshot.allPlaces.length}개`,
  ]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(snapshot.planMeta.title)}</name>
    ${documentDescription}
    ${snapshot.dayLayers.map((day) => serializeDayFolder(day)).join('\n')}
  </Document>
</kml>`;
}
