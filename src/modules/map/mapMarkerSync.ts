import type { Poi } from '../../models/Poi';
import { createMarkerIcon } from './mapUtils';

interface SyncMapMarkersParams {
  activePlaceId: string;
  mapInstance: google.maps.Map;
  mapsApi: typeof google.maps;
  markers: Map<string, google.maps.Marker>;
  onMarkerClick: (placeId: string) => void;
  visiblePlaces: Poi[];
}

export function syncMapMarkers({
  activePlaceId,
  mapInstance,
  mapsApi,
  markers,
  onMarkerClick,
  visiblePlaces,
}: SyncMapMarkersParams) {
  const nextPlaceIds = new Set(visiblePlaces.map((place) => place.id));

  markers.forEach((marker, markerId) => {
    if (nextPlaceIds.has(markerId)) {
      return;
    }

    mapsApi.event.clearInstanceListeners(marker);
    marker.setMap(null);
    markers.delete(markerId);
  });

  visiblePlaces.forEach((place) => {
    const isActive = place.id === activePlaceId;
    const existingMarker = markers.get(place.id);

    if (existingMarker) {
      existingMarker.setPosition(place.position);
      existingMarker.setTitle(place.name);
      existingMarker.setIcon(createMarkerIcon(mapsApi, place, isActive));
      return;
    }

    const marker = new mapsApi.Marker({
      position: place.position,
      map: mapInstance,
      title: place.name,
      icon: createMarkerIcon(mapsApi, place, isActive),
    });

    marker.addListener('click', () => {
      onMarkerClick(place.id);
    });

    markers.set(place.id, marker);
  });
}
