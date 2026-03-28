import type { GooglePlacePopup, MapSearchSuggestion } from './MapView.types';

interface FetchGooglePlacePopupParams {
  fallbackData?: Partial<GooglePlacePopup> & Pick<GooglePlacePopup, 'name' | 'position'>;
  fallbackPosition?: {
    lat: number;
    lng: number;
  };
  placeId: string;
  placesService: google.maps.places.PlacesService;
}

interface FetchPlacePredictionsParams {
  autocompleteService: google.maps.places.AutocompleteService;
  bounds?: google.maps.LatLngBounds | null;
  input: string;
}

interface SearchPlacesInViewParams {
  bounds?: google.maps.LatLngBounds | null;
  location: google.maps.LatLng | google.maps.LatLngLiteral;
  placesService: google.maps.places.PlacesService;
  query: string;
}

const googlePlaceFields: string[] = [
  'name',
  'formatted_address',
  'formatted_phone_number',
  'geometry',
  'rating',
  'user_ratings_total',
  'url',
  'website',
  'editorial_summary',
];

export function fetchGooglePlacePopup({
  fallbackData,
  fallbackPosition,
  placeId,
  placesService,
}: FetchGooglePlacePopupParams): Promise<GooglePlacePopup | null> {
  return new Promise((resolve) => {
    placesService.getDetails(
      {
        placeId,
        fields: googlePlaceFields,
      },
      (placeResult, status) => {
        if (
          !placeResult ||
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !placeResult.name
        ) {
          resolve(
            fallbackData
              ? {
                  placeId,
                  name: fallbackData.name,
                  address: fallbackData.address ?? '주소 정보 없음',
                  editorialSummary: fallbackData.editorialSummary,
                  phoneNumber: fallbackData.phoneNumber,
                  rating: fallbackData.rating,
                  url: fallbackData.url,
                  userRatingsTotal: fallbackData.userRatingsTotal,
                  website: fallbackData.website,
                  viewport: fallbackData.viewport,
                  position: fallbackData.position,
                }
              : null,
          );
          return;
        }

        resolve({
          placeId,
          name: placeResult.name,
          address: placeResult.formatted_address ?? '주소 정보 없음',
          editorialSummary: placeResult.editorial_summary?.overview,
          phoneNumber: placeResult.formatted_phone_number,
          rating: placeResult.rating,
          userRatingsTotal: placeResult.user_ratings_total,
          url: placeResult.url,
          website: placeResult.website,
          viewport: placeResult.geometry?.viewport?.toJSON(),
          position: {
            lat: placeResult.geometry?.location?.lat() ?? fallbackPosition?.lat ?? 0,
            lng: placeResult.geometry?.location?.lng() ?? fallbackPosition?.lng ?? 0,
          },
        });
      },
    );
  });
}

export function fetchPlacePredictions({
  autocompleteService,
  bounds,
  input,
}: FetchPlacePredictionsParams): Promise<MapSearchSuggestion[]> {
  return new Promise((resolve) => {
    autocompleteService.getPlacePredictions(
      {
        input,
        bounds: bounds ?? undefined,
      },
      (predictions) => {
        if (!predictions?.length) {
          resolve([]);
          return;
        }

        resolve(
          predictions.slice(0, 5).map((prediction) => ({
            id: prediction.place_id,
            kind: 'prediction',
            mainText: prediction.structured_formatting.main_text,
            secondaryText: prediction.structured_formatting.secondary_text ?? '',
            placeId: prediction.place_id,
          })),
        );
      },
    );
  });
}

export function searchPlacesInView({
  bounds,
  location,
  placesService,
  query,
}: SearchPlacesInViewParams): Promise<MapSearchSuggestion[]> {
  return new Promise((resolve) => {
    placesService.textSearch(
      {
        bounds: bounds ?? undefined,
        location,
        query,
      },
      (results, status) => {
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !results?.length
        ) {
          resolve([]);
          return;
        }

        resolve(
          results.slice(0, 5).map((result, index) => ({
            id: result.place_id ?? `nearby-result-${index}`,
            kind: 'nearby-result',
            mainText: result.name ?? query,
            position: result.geometry?.location
              ? {
                  lat: result.geometry.location.lat(),
                  lng: result.geometry.location.lng(),
                }
              : undefined,
            secondaryText: result.formatted_address ?? result.vicinity ?? '현재 보기 주변 결과',
            placeId: result.place_id,
            viewport: result.geometry?.viewport?.toJSON(),
          })),
        );
      },
    );
  });
}
