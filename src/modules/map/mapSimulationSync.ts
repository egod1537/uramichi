import type { DayLayer } from '../../models/Plan';
import { resolveSimulationPosition } from '../../services/SimulationPosition';

interface SyncSimulationMarkerParams {
  currentDay: DayLayer;
  currentMinutes: number;
  currentMarker: google.maps.Marker | null;
  mapInstance: google.maps.Map;
  mapsApi: typeof google.maps;
}

function buildSimulationMarkerSvg(isRoutePosition: boolean): string {
  const accentColor = isRoutePosition ? '#2563eb' : '#0f172a';
  const ringColor = isRoutePosition ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 0.16)';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="17" fill="${ringColor}" />
      <circle cx="20" cy="20" r="13" fill="white" stroke="${accentColor}" stroke-width="2" />
      <circle cx="20" cy="14.3" r="3.5" fill="${accentColor}" />
      <path d="M18.7 19.1c2.3 0 3.9.9 4.8 2.6l1.6 2.9c.4.7-.1 1.5-.9 1.5h-2l1.2 5.2a1.5 1.5 0 1 1-2.9.7l-1.1-4.3-1 4.3a1.5 1.5 0 1 1-2.9-.7l1.2-5.2h-2c-.8 0-1.3-.8-.9-1.5l1.6-2.9c1-1.7 2.6-2.6 4.9-2.6Z" fill="${accentColor}" />
    </svg>
  `;
}

function createSimulationMarkerIcon(
  mapsApi: typeof google.maps,
  isRoutePosition: boolean,
): google.maps.Icon {
  return {
    anchor: new mapsApi.Point(20, 20),
    scaledSize: new mapsApi.Size(40, 40),
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      buildSimulationMarkerSvg(isRoutePosition),
    )}`,
  };
}

export function syncSimulationMarker({
  currentDay,
  currentMinutes,
  currentMarker,
  mapInstance,
  mapsApi,
}: SyncSimulationMarkerParams): google.maps.Marker | null {
  const simulationPosition = resolveSimulationPosition(currentDay, currentMinutes);

  if (!simulationPosition) {
    currentMarker?.setMap(null);
    return null;
  }

  const marker =
    currentMarker ??
    new mapsApi.Marker({
      clickable: false,
      map: mapInstance,
      optimized: true,
      zIndex: 120,
    });

  marker.setIcon(createSimulationMarkerIcon(mapsApi, simulationPosition.kind === 'route'));
  marker.setPosition(simulationPosition.position);
  marker.setMap(mapInstance);

  return marker;
}
