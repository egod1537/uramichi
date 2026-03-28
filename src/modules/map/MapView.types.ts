import type { PlannerSnapshot } from '../../models/Plan';
import type { DraftPathPoint } from './mapDraftPath';
import type { TransitRouteCandidate, TransitSelectionPoint } from './mapTransit';

export interface MapViewProps {
  className?: string;
}

export interface GooglePlacePopup {
  placeId: string;
  name: string;
  address: string;
  editorialSummary?: string;
  phoneNumber?: string;
  rating?: number;
  userRatingsTotal?: number;
  url?: string;
  website?: string;
  viewport?: google.maps.LatLngBoundsLiteral;
  position: {
    lat: number;
    lng: number;
  };
}

export interface DrawingPopup {
  drawingId: string;
  position: {
    lat: number;
    lng: number;
  };
}

export interface MapSearchSuggestion {
  id: string;
  kind: 'prediction' | 'nearby-action' | 'nearby-result';
  mainText: string;
  secondaryText: string;
  position?: {
    lat: number;
    lng: number;
  };
  placeId?: string;
  viewport?: google.maps.LatLngBoundsLiteral;
}

export interface MapViewState {
  snapshot: PlannerSnapshot;
  status: 'loading' | 'ready' | 'missing-key' | 'error';
  errorMessage: string;
  draftPath: DraftPathPoint[];
  drawingPopup: DrawingPopup | null;
  googlePlacePopup: GooglePlacePopup | null;
  isSearchOpen: boolean;
  isTransitLoading: boolean;
  searchQuery: string;
  searchSuggestions: MapSearchSuggestion[];
  selectedDrawingId: string | null;
  selectedTransitRouteId: string | null;
  transitErrorMessage: string;
  transitRoutes: TransitRouteCandidate[];
  transitSelectionPoints: TransitSelectionPoint[];
}
