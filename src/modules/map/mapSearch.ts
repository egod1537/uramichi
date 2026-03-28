import {
  fetchGooglePlacePopup,
  fetchPlacePredictions,
  searchPlacesInView,
} from './mapPlaceDetails';
import type { GooglePlacePopup, MapSearchSuggestion } from './MapView.types';

interface LoadSearchSuggestionsParams {
  autocompleteService: google.maps.places.AutocompleteService;
  bounds?: google.maps.LatLngBounds | null;
  query: string;
}

interface LoadNearbySearchSuggestionsParams {
  mapInstance: google.maps.Map;
  placesService: google.maps.places.PlacesService;
  query: string;
}

interface LoadGooglePlacePopupParams {
  fallbackPopup?: Partial<GooglePlacePopup> & Pick<GooglePlacePopup, 'name' | 'position'>;
  fallbackPosition?: { lat: number; lng: number };
  mapInstance: google.maps.Map;
  placeId: string;
  placesService: google.maps.places.PlacesService;
}

export function buildNearbyActionSuggestion(
  query: string,
  secondaryText = '현재 보기 주변 장소 검색',
): MapSearchSuggestion {
  return {
    id: `nearby-action-${query}`,
    kind: 'nearby-action',
    mainText: query,
    secondaryText,
  };
}

export function findPreferredSearchSuggestion(
  suggestions: MapSearchSuggestion[],
): MapSearchSuggestion | undefined {
  return suggestions.find((suggestion) => suggestion.kind !== 'nearby-action');
}

export async function loadSearchSuggestions({
  autocompleteService,
  bounds,
  query,
}: LoadSearchSuggestionsParams): Promise<MapSearchSuggestion[]> {
  const predictions = await fetchPlacePredictions({
    autocompleteService,
    bounds,
    input: query,
  });

  return [...predictions, buildNearbyActionSuggestion(query)];
}

export async function loadNearbySearchSuggestions({
  mapInstance,
  placesService,
  query,
}: LoadNearbySearchSuggestionsParams): Promise<MapSearchSuggestion[]> {
  const center = mapInstance.getCenter();

  return searchPlacesInView({
    bounds: mapInstance.getBounds() ?? null,
    location: center?.toJSON() ?? center ?? { lat: 0, lng: 0 },
    placesService,
    query,
  });
}

export async function loadGooglePlacePopup({
  fallbackPopup,
  fallbackPosition,
  mapInstance,
  placeId,
  placesService,
}: LoadGooglePlacePopupParams): Promise<GooglePlacePopup | null> {
  const nextPopup = await fetchGooglePlacePopup({
    fallbackData: fallbackPopup,
    fallbackPosition,
    placeId,
    placesService,
  });

  if (!nextPopup) {
    return null;
  }

  if (nextPopup.viewport) {
    mapInstance.fitBounds(nextPopup.viewport);
  } else {
    mapInstance.panTo(nextPopup.position);
    mapInstance.setZoom(Math.max(mapInstance.getZoom() ?? 13, 15));
  }

  return nextPopup;
}
