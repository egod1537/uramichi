import type { LegendItem, Poi } from './Poi';
import type { DaySegment, MapDrawing, TimelineRange } from './Route';

export interface DayLayer {
  id: string;
  label: string;
  meta: string;
  variantGroupId?: string;
  variantGroupLabel?: string;
  variantLabel?: string;
  drawings: MapDrawing[];
  places: Poi[];
  timelineRange: TimelineRange;
  segments: DaySegment[];
}

export interface DayTab {
  id: string;
  label: string;
  meta: string;
}

export interface PlanMeta {
  title: string;
  travelRange: string;
}

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
}

export type MapToolId = 'hand' | 'pin' | 'line' | 'measure' | 'transit';

export interface PlannerData {
  dayLayers: DayLayer[];
  days: DayTab[];
  legendItems: LegendItem[];
  planMeta: PlanMeta;
}

export interface PlannerViewState {
  debugEnabled: boolean;
  activeMapTool: MapToolId;
  currentDayId: string;
  activePlaceId: string;
  currentMinutes: number;
  visibleDayIds: string[];
  collapsedDayIds: string[];
  selectedVariantIds: Record<string, string>;
  activeCategoryIds: string[];
  poiPopupPlaceId: string | null;
}

export interface ShareablePlannerViewState {
  currentDayId: string;
  activePlaceId: string;
  currentMinutes: number;
  visibleDayIds: string[];
  collapsedDayIds: string[];
  selectedVariantIds?: Record<string, string>;
  activeCategoryIds: string[];
  poiPopupPlaceId: string | null;
}

export interface PlannerSharePayload {
  version: 1;
  data: PlannerData;
  viewState: ShareablePlannerViewState;
}

export interface PlannerSnapshot extends PlannerData, PlannerViewState {
  currentDay: DayLayer;
  allPlaces: Poi[];
  visiblePlaces: Poi[];
}
