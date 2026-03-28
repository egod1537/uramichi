import type {
  DayLayer,
  PlannerData,
  PlannerSharePayload,
  PlannerSnapshot,
  PlannerViewState,
  ShareablePlannerViewState,
} from '../models/Plan';
import type { Poi } from '../models/Poi';
import type { MapDrawing } from '../models/Route';
import { isDebugEnabledFromLocation } from '../shared/utils/debug';
import {
  getSelectedDayLayerIds,
  normalizeSelectedDayIdList,
  normalizeSelectedVariantIds,
} from '../shared/utils/dayLayerGroups';
import { normalizeMapDrawing } from '../shared/utils/mapDrawings';
import { createSeedPlan } from './SeedPlan';

const PLANNER_SHARE_STATE_PARAM = 'state';
const PLANNER_SHARE_VERSION = 1 as const;

export interface BuildPlannerShareUrlOptions {
  preserveDebug?: boolean;
}

export interface InitialPlannerStoreState {
  data: PlannerData;
  viewState: PlannerViewState;
}

function findLayerById(dayLayers: DayLayer[], dayId: string): DayLayer {
  return dayLayers.find((day) => day.id === dayId) ?? dayLayers[0];
}

function normalizeDayLayerDrawings(dayLayer: DayLayer): DayLayer {
  const sourceDrawings = Array.isArray((dayLayer as DayLayer & { drawings?: MapDrawing[] }).drawings)
    ? dayLayer.drawings
    : [];

  return {
    ...dayLayer,
    drawings: sourceDrawings.map((drawing, drawingIndex) =>
      normalizeMapDrawing(drawing, dayLayer.label, drawingIndex),
    ),
  };
}

function normalizePlannerData(data: PlannerData): PlannerData {
  const normalizedDayLayers = data.dayLayers.map(normalizeDayLayerDrawings);

  return {
    ...data,
    dayLayers: normalizedDayLayers,
    days:
      Array.isArray(data.days) && data.days.length === normalizedDayLayers.length
        ? data.days
        : normalizedDayLayers.map(({ id, label, meta }) => ({ id, label, meta })),
  };
}

function findFirstPlace(dayLayers: DayLayer[]): Poi | null {
  for (const day of dayLayers) {
    const firstPlace = day.places[0];

    if (firstPlace) {
      return firstPlace;
    }
  }

  return null;
}

function findPlaceById(dayLayers: DayLayer[], placeId: string): Poi | null {
  for (const day of dayLayers) {
    const matchingPlace = day.places.find((place) => place.id === placeId);

    if (matchingPlace) {
      return matchingPlace;
    }
  }

  return null;
}

function readSearchParams(locationHref?: string): URLSearchParams {
  if (locationHref) {
    return new URL(locationHref).searchParams;
  }

  if (typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search);
  }

  return new URLSearchParams();
}

function readSearchString(locationHref?: string): string {
  if (locationHref) {
    return new URL(locationHref).search;
  }

  if (typeof window !== 'undefined') {
    return window.location.search;
  }

  return '';
}

function readRequestedDayId(dayLayers: DayLayer[], locationHref?: string): string {
  const requestedDayId = readSearchParams(locationHref).get('day');

  if (!requestedDayId) {
    return dayLayers[0].id;
  }

  return dayLayers.some((day) => day.id === requestedDayId) ? requestedDayId : dayLayers[0].id;
}

function normalizeIdList(
  value: unknown,
  validIds: Set<string>,
  fallback: string[],
): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const filteredIds = Array.from(
    new Set(
      value.filter((candidate): candidate is string => {
        return typeof candidate === 'string' && validIds.has(candidate);
      }),
    ),
  );

  if (filteredIds.length > 0 || value.length === 0) {
    return filteredIds;
  }

  return fallback;
}

function clampMinutes(minutes: number, day: DayLayer): number {
  return Math.min(day.timelineRange.end, Math.max(day.timelineRange.start, minutes));
}

function createDefaultViewState(data: PlannerData, locationHref?: string): PlannerViewState {
  const currentDayId = readRequestedDayId(data.dayLayers, locationHref);
  const selectedVariantIds = normalizeSelectedVariantIds(data.dayLayers, undefined, currentDayId);
  const currentDay = findLayerById(data.dayLayers, currentDayId);
  const defaultPlace = currentDay.places[0] ?? findFirstPlace(data.dayLayers);

  return {
    debugEnabled: isDebugEnabledFromLocation(readSearchString(locationHref)),
    activeMapTool: 'hand',
    currentDayId,
    activePlaceId: defaultPlace?.id ?? '',
    currentMinutes: currentDay.segments[0]?.start ?? currentDay.timelineRange.start,
    visibleDayIds: getSelectedDayLayerIds(data.dayLayers, selectedVariantIds),
    collapsedDayIds: [],
    selectedVariantIds,
    activeCategoryIds: data.legendItems.map((item) => item.id),
    poiPopupPlaceId: null,
  };
}

function createShareableViewState(snapshot: PlannerSnapshot): ShareablePlannerViewState {
  return {
    currentDayId: snapshot.currentDayId,
    activePlaceId: snapshot.activePlaceId,
    currentMinutes: snapshot.currentMinutes,
    visibleDayIds: [...snapshot.visibleDayIds],
    collapsedDayIds: [...snapshot.collapsedDayIds],
    selectedVariantIds: {
      ...snapshot.selectedVariantIds,
    },
    activeCategoryIds: [...snapshot.activeCategoryIds],
    poiPopupPlaceId: snapshot.poiPopupPlaceId,
  };
}

function reconcileViewStateSelection(
  data: PlannerData,
  viewState: PlannerViewState,
): PlannerViewState {
  const activePlace = findPlaceById(data.dayLayers, viewState.activePlaceId);

  if (!activePlace) {
    return viewState;
  }

  const isActivePlaceVisible =
    viewState.visibleDayIds.includes(activePlace.dayId) &&
    viewState.activeCategoryIds.includes(activePlace.tag);

  if (isActivePlaceVisible) {
    return viewState;
  }

  const currentDay = findLayerById(data.dayLayers, viewState.currentDayId);
  const nextActivePlace =
    currentDay.places.find((place) => {
      return (
        viewState.visibleDayIds.includes(place.dayId) &&
        viewState.activeCategoryIds.includes(place.tag)
      );
    }) ??
    data.dayLayers
      .flatMap((day) => day.places)
      .find((place) => {
        return (
          viewState.visibleDayIds.includes(place.dayId) &&
          viewState.activeCategoryIds.includes(place.tag)
        );
      });

  if (!nextActivePlace) {
    return {
      ...viewState,
      poiPopupPlaceId: null,
    };
  }

  return {
    ...viewState,
    activePlaceId: nextActivePlace.id,
    poiPopupPlaceId: viewState.poiPopupPlaceId === nextActivePlace.id ? nextActivePlace.id : null,
  };
}

function normalizeViewState(
  data: PlannerData,
  sharedViewState: ShareablePlannerViewState | null,
  locationHref?: string,
): PlannerViewState {
  const defaultViewState = createDefaultViewState(data, locationHref);

  if (!sharedViewState) {
    return defaultViewState;
  }

  const validDayIds = new Set(data.dayLayers.map((day) => day.id));
  const validCategoryIds = new Set(data.legendItems.map((item) => item.id));
  const validPlaceIds = new Set(data.dayLayers.flatMap((day) => day.places.map((place) => place.id)));
  const currentDayId = validDayIds.has(sharedViewState.currentDayId)
    ? sharedViewState.currentDayId
    : defaultViewState.currentDayId;
  const currentDay = findLayerById(data.dayLayers, currentDayId);
  const selectedVariantIds = normalizeSelectedVariantIds(
    data.dayLayers,
    sharedViewState.selectedVariantIds,
    currentDayId,
  );
  const activePlaceId = validPlaceIds.has(sharedViewState.activePlaceId)
    ? sharedViewState.activePlaceId
    : defaultViewState.activePlaceId;
  const poiPopupPlaceId =
    sharedViewState.poiPopupPlaceId && validPlaceIds.has(sharedViewState.poiPopupPlaceId)
      ? sharedViewState.poiPopupPlaceId
      : null;
  const nextViewState: PlannerViewState = {
    ...defaultViewState,
    currentDayId,
    activePlaceId,
    currentMinutes:
      typeof sharedViewState.currentMinutes === 'number' &&
      Number.isFinite(sharedViewState.currentMinutes)
        ? clampMinutes(sharedViewState.currentMinutes, currentDay)
        : defaultViewState.currentMinutes,
    visibleDayIds: normalizeSelectedDayIdList(
      data.dayLayers,
      selectedVariantIds,
      Array.isArray(sharedViewState.visibleDayIds) ? sharedViewState.visibleDayIds : [],
      getSelectedDayLayerIds(data.dayLayers, selectedVariantIds),
    ),
    collapsedDayIds: normalizeSelectedDayIdList(
      data.dayLayers,
      selectedVariantIds,
      Array.isArray(sharedViewState.collapsedDayIds) ? sharedViewState.collapsedDayIds : [],
      [],
    ),
    selectedVariantIds,
    activeCategoryIds: normalizeIdList(
      sharedViewState.activeCategoryIds,
      validCategoryIds,
      defaultViewState.activeCategoryIds,
    ),
    poiPopupPlaceId,
  };

  return reconcileViewStateSelection(data, nextViewState);
}

function isPlannerData(value: unknown): value is PlannerData {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as PlannerData;

  return (
    Array.isArray(candidate.dayLayers) &&
    candidate.dayLayers.length > 0 &&
    Array.isArray(candidate.days) &&
    Array.isArray(candidate.legendItems) &&
    Boolean(candidate.planMeta) &&
    typeof candidate.planMeta.title === 'string' &&
    typeof candidate.planMeta.travelRange === 'string'
  );
}

function isShareablePlannerViewState(value: unknown): value is ShareablePlannerViewState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as ShareablePlannerViewState;
  const hasValidSelectedVariantIds =
    typeof candidate.selectedVariantIds === 'undefined' ||
    (Boolean(candidate.selectedVariantIds) &&
      typeof candidate.selectedVariantIds === 'object' &&
      Object.values(candidate.selectedVariantIds).every((dayId) => typeof dayId === 'string'));

  return (
    typeof candidate.currentDayId === 'string' &&
    typeof candidate.activePlaceId === 'string' &&
    typeof candidate.currentMinutes === 'number' &&
    Array.isArray(candidate.visibleDayIds) &&
    Array.isArray(candidate.collapsedDayIds) &&
    hasValidSelectedVariantIds &&
    Array.isArray(candidate.activeCategoryIds) &&
    (typeof candidate.poiPopupPlaceId === 'string' || candidate.poiPopupPlaceId === null)
  );
}

function isPlannerSharePayload(value: unknown): value is PlannerSharePayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as PlannerSharePayload;

  return (
    candidate.version === PLANNER_SHARE_VERSION &&
    isPlannerData(candidate.data) &&
    isShareablePlannerViewState(candidate.viewState)
  );
}

function encodePlannerSharePayload(payload: PlannerSharePayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function decodePlannerSharePayload(encodedValue: string): PlannerSharePayload | null {
  try {
    const normalizedValue = encodedValue.replace(/-/g, '+').replace(/_/g, '/');
    const paddedValue = normalizedValue.padEnd(
      normalizedValue.length + ((4 - (normalizedValue.length % 4)) % 4),
      '=',
    );
    const binary = atob(paddedValue);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsedValue = JSON.parse(new TextDecoder().decode(bytes)) as unknown;

    return isPlannerSharePayload(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

function readSharePayloadFromLocation(locationHref?: string): PlannerSharePayload | null {
  const encodedPayload = readSearchParams(locationHref).get(PLANNER_SHARE_STATE_PARAM);

  if (!encodedPayload) {
    return null;
  }

  return decodePlannerSharePayload(encodedPayload);
}

export function buildPlannerShareUrl(
  snapshot: PlannerSnapshot,
  locationHref?: string,
  options: BuildPlannerShareUrlOptions = {},
): string {
  if (typeof window === 'undefined' && !locationHref) {
    throw new Error('공유 링크는 브라우저에서만 생성할 수 있습니다.');
  }

  const url = new URL(locationHref ?? window.location.href);

  url.hash = '';
  url.searchParams.set('day', snapshot.currentDayId);
  url.searchParams.set(
    PLANNER_SHARE_STATE_PARAM,
    encodePlannerSharePayload({
      version: PLANNER_SHARE_VERSION,
      data: {
        dayLayers: snapshot.dayLayers,
        days: snapshot.days,
        legendItems: snapshot.legendItems,
        planMeta: snapshot.planMeta,
      },
      viewState: createShareableViewState(snapshot),
    }),
  );

  if (!options.preserveDebug) {
    url.searchParams.delete('debug');
  }

  return url.toString();
}

export function createInitialPlannerStoreState(locationHref?: string): InitialPlannerStoreState {
  const fallbackData = createSeedPlan();
  const sharedPayload = readSharePayloadFromLocation(locationHref);
  const data = normalizePlannerData(sharedPayload?.data ?? fallbackData);

  return {
    data,
    viewState: normalizeViewState(data, sharedPayload?.viewState ?? null, locationHref),
  };
}
