import type { DayLayer } from '../../models/Plan';
import { getDrawingAnchorPosition } from '../../shared/utils/mapDrawings';

type DrawingOverlay = google.maps.Polyline | google.maps.Polygon;

interface SyncMapDrawingsParams {
  activeDayId: string;
  dayLayers: DayLayer[];
  drawingOverlays: Map<string, DrawingOverlay>;
  mapInstance: google.maps.Map;
  mapsApi: typeof google.maps;
  onDrawingSelect: (
    drawingId: string,
    position: {
      lat: number;
      lng: number;
    },
  ) => void;
  selectedDrawingId: string | null;
  visibleDayIds: string[];
}

function clearDrawingOverlay(
  drawingOverlays: Map<string, DrawingOverlay>,
  drawingId: string,
  mapsApi: typeof google.maps,
): void {
  const overlay = drawingOverlays.get(drawingId);

  if (!overlay) {
    return;
  }

  mapsApi.event.clearInstanceListeners(overlay);
  overlay.setMap(null);
  drawingOverlays.delete(drawingId);
}

export function syncMapDrawings({
  activeDayId,
  dayLayers,
  drawingOverlays,
  mapInstance,
  mapsApi,
  onDrawingSelect,
  selectedDrawingId,
  visibleDayIds,
}: SyncMapDrawingsParams): void {
  const nextDrawingIds = new Set(
    dayLayers
      .filter((day) => visibleDayIds.includes(day.id))
      .flatMap((day) => day.drawings.map((drawing) => drawing.id)),
  );

  drawingOverlays.forEach((_, drawingId) => {
    if (!nextDrawingIds.has(drawingId)) {
      clearDrawingOverlay(drawingOverlays, drawingId, mapsApi);
    }
  });

  dayLayers.forEach((day) => {
    if (!visibleDayIds.includes(day.id)) {
      return;
    }

    const isActiveDay = day.id === activeDayId;

    day.drawings.forEach((drawing) => {
      const existingOverlay = drawingOverlays.get(drawing.id);
      const isSelected = drawing.id === selectedDrawingId;
      const commonOptions = {
        clickable: true,
        map: mapInstance,
        strokeColor: drawing.strokeColor,
        strokeOpacity: isSelected ? 1 : isActiveDay ? 0.95 : 0.6,
        strokeWeight: isSelected ? (isActiveDay ? 5.4 : 4.8) : isActiveDay ? 3.8 : 3,
        zIndex: isSelected ? 92 : isActiveDay ? 76 : 64,
      };

      if (drawing.type === 'polygon') {
        const overlay =
          existingOverlay && existingOverlay instanceof google.maps.Polygon
            ? existingOverlay
            : new mapsApi.Polygon();

        mapsApi.event.clearInstanceListeners(overlay);
        overlay.setOptions({
          ...commonOptions,
          fillColor: drawing.fillColor ?? drawing.strokeColor,
          fillOpacity: isSelected ? 0.26 : isActiveDay ? 0.18 : 0.12,
          paths: drawing.path,
        });
        overlay.addListener('click', (event: google.maps.MapMouseEvent) => {
          const position = event.latLng
            ? {
                lat: event.latLng.lat(),
                lng: event.latLng.lng(),
              }
            : getDrawingAnchorPosition(drawing.path);

          onDrawingSelect(drawing.id, position);
        });
        drawingOverlays.set(drawing.id, overlay);
        return;
      }

      const overlay =
        existingOverlay && existingOverlay instanceof google.maps.Polyline
          ? existingOverlay
          : new mapsApi.Polyline();

      mapsApi.event.clearInstanceListeners(overlay);
      overlay.setOptions({
        ...commonOptions,
        path: drawing.path,
      });
      overlay.addListener('click', (event: google.maps.MapMouseEvent) => {
        const position = event.latLng
          ? {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            }
          : getDrawingAnchorPosition(drawing.path);

        onDrawingSelect(drawing.id, position);
      });
      drawingOverlays.set(drawing.id, overlay);
    });
  });
}
