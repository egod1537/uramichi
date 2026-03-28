import type { PlannerSnapshot } from '../../models/Plan';
import type { Poi } from '../../models/Poi';
import { renderPoiMarkerGlyph } from '../../shared/constants/categories';

const markerIconCache = new Map<string, google.maps.Icon>();

function createMarkerSvg(place: Poi, isActive: boolean): string {
  const glyphColor = isActive ? '#193454' : '#24415f';
  const pinStroke = isActive ? '#163b80' : '#ffffff';
  const pinStrokeWidth = isActive ? 3.2 : 2.6;
  const pinPath =
    'M24 4C14.059 4 6 12.059 6 22c0 12.48 12.136 23.926 16.848 28.026a1.75 1.75 0 0 0 2.304 0C29.864 45.926 42 34.48 42 22 42 12.059 33.941 4 24 4Z';

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">
        <path d="${pinPath}" fill="${place.color}" stroke="${pinStroke}" stroke-width="${pinStrokeWidth}" />
        <circle cx="24" cy="22" r="${isActive ? '12.6' : '12.2'}" fill="white" />
        ${renderPoiMarkerGlyph(place.iconId, glyphColor)}
      </svg>
    `)}`,
  };
}

export function createMarkerIcon(
  mapsApi: typeof google.maps,
  place: Poi,
  isActive: boolean,
): google.maps.Icon {
  const cacheKey = `${place.iconId}:${place.color}:${isActive ? 'active' : 'default'}`;
  const cachedIcon = markerIconCache.get(cacheKey);

  if (cachedIcon) {
    return cachedIcon;
  };

  const icon: google.maps.Icon = {
    ...createMarkerSvg(place, isActive),
    anchor: new mapsApi.Point(24, 52),
    scaledSize: new mapsApi.Size(isActive ? 44 : 40, isActive ? 51 : 46),
  };

  markerIconCache.set(cacheKey, icon);

  return icon;
}

export function selectFocusedPlace(snapshot: PlannerSnapshot): Poi | null {
  return (
    snapshot.visiblePlaces.find((place) => place.id === snapshot.activePlaceId) ??
    snapshot.visiblePlaces[0] ??
    snapshot.allPlaces.find((place) => place.id === snapshot.activePlaceId) ??
    snapshot.allPlaces[0] ??
    null
  );
}
