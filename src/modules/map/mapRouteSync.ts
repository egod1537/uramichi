import type { DayLayer } from '../../models/Plan';

interface SyncMapRoutesParams {
  activeCategoryIds: string[];
  currentDayId: string;
  dayLayers: DayLayer[];
  mapInstance: google.maps.Map;
  mapsApi: typeof google.maps;
  routePolylines: Map<string, google.maps.Polyline>;
  visibleDayIds: string[];
}

function removeRoutePolyline(
  mapsApi: typeof google.maps,
  routePolylines: Map<string, google.maps.Polyline>,
  dayId: string,
) {
  const polyline = routePolylines.get(dayId);

  if (!polyline) {
    return;
  }

  mapsApi.event.clearInstanceListeners(polyline);
  polyline.setMap(null);
  routePolylines.delete(dayId);
}

function createRouteDashIcon(mapsApi: typeof google.maps): google.maps.IconSequence['icon'] {
  return {
    path: 'M 0,-1 0,1',
    strokeOpacity: 1,
    scale: 4,
  } as google.maps.Symbol;
}

export function syncMapRoutes({
  activeCategoryIds,
  currentDayId,
  dayLayers,
  mapInstance,
  mapsApi,
  routePolylines,
  visibleDayIds,
}: SyncMapRoutesParams) {
  const nextVisibleDayIds = new Set(visibleDayIds);

  routePolylines.forEach((_, dayId) => {
    if (!nextVisibleDayIds.has(dayId)) {
      removeRoutePolyline(mapsApi, routePolylines, dayId);
    }
  });

  dayLayers.forEach((day) => {
    if (!nextVisibleDayIds.has(day.id)) {
      return;
    }

    const hasExplicitItineraryRoute = day.drawings.some((drawing) => {
      return drawing.type === 'polyline' && drawing.role === 'itinerary';
    });

    if (hasExplicitItineraryRoute) {
      removeRoutePolyline(mapsApi, routePolylines, day.id);
      return;
    }

    const path = day.places
      .filter((place) => activeCategoryIds.includes(place.tag))
      .map((place) => place.position);

    if (path.length < 2) {
      removeRoutePolyline(mapsApi, routePolylines, day.id);
      return;
    }

    const isCurrentDay = day.id === currentDayId;
    const routeColor = day.places[0]?.color ?? '#4f7cff';
    const existingRoute = routePolylines.get(day.id);
    const nextRoute =
      existingRoute ??
      new mapsApi.Polyline({
        clickable: false,
        geodesic: false,
        map: mapInstance,
      });

    nextRoute.setOptions({
      path,
      strokeColor: routeColor,
      strokeOpacity: isCurrentDay ? 0.88 : 0.48,
      strokeWeight: isCurrentDay ? 5 : 4,
      zIndex: isCurrentDay ? 38 : 22,
      icons: isCurrentDay
        ? []
        : [
            {
              icon: createRouteDashIcon(mapsApi),
              offset: '0',
              repeat: '14px',
            },
          ],
    });

    routePolylines.set(day.id, nextRoute);
  });
}
