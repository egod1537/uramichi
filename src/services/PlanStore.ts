import type { DayLayer, MapToolId, PlannerData, PlannerSnapshot, PlannerViewState } from '../models/Plan';
import type { Poi, PoiEditableFields, PoiIconId } from '../models/Poi';
import type {
  MapDrawing,
  MapDrawingEditableFields,
  MapDrawingIconId,
  MapDrawingType,
  RoutePoint,
} from '../models/Route';
import {
  buildVariantLayerLabel,
  getDayLayerGroupMeta,
  getDayLayerIdsInGroup,
  removeDayLayerGroupIds,
  reorderDayLayerGroups,
  replaceDayLayerIdWithinGroup,
} from '../shared/utils/dayLayerGroups';
import { buildDefaultMapDrawing, normalizeMapDrawing } from '../shared/utils/mapDrawings';
import { movePoiBetweenDayLayers } from './DayLayerPoiOrder';
import { findActivePoiSegment, findSegmentByPlaceId } from './SimulationEngine';
import { createInitialPlannerStoreState } from './PlannerShareState';

type StoreSubscriber = () => void;

function findLayerById(dayLayers: DayLayer[], dayId: string): DayLayer {
  return dayLayers.find((day) => day.id === dayId) ?? dayLayers[0];
}

function findPlaceById(dayLayers: DayLayer[], placeId: string): Poi | null {
  for (const layer of dayLayers) {
    const place = layer.places.find((item) => item.id === placeId);

    if (place) {
      return place;
    }
  }

  return null;
}

function findDrawingById(
  dayLayers: DayLayer[],
  drawingId: string,
): { day: DayLayer; drawing: MapDrawing } | null {
  for (const day of dayLayers) {
    const drawing = day.drawings.find((item) => item.id === drawingId);

    if (drawing) {
      return { day, drawing };
    }
  }

  return null;
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

class PlanStore {
  private data: PlannerData;

  private viewState: PlannerViewState;

  private subscribers = new Set<StoreSubscriber>();

  constructor() {
    const initialState = createInitialPlannerStoreState();

    this.data = initialState.data;
    this.viewState = initialState.viewState;
  }

  subscribe(callback: StoreSubscriber): () => void {
    this.subscribers.add(callback);

    return () => {
      this.subscribers.delete(callback);
    };
  }

  getSnapshot(): PlannerSnapshot {
    const currentDay = findLayerById(this.data.dayLayers, this.viewState.currentDayId);
    const allPlaces = this.data.dayLayers.flatMap((day) => day.places);
    const visiblePlaces = this.data.dayLayers.flatMap((day) => {
      if (!this.viewState.visibleDayIds.includes(day.id)) {
        return [];
      }

      return day.places.filter((place) => this.viewState.activeCategoryIds.includes(place.tag));
    });

    return {
      ...this.data,
      ...this.viewState,
      currentDay,
      allPlaces,
      visiblePlaces,
    };
  }

  focusDay(dayId: string): void {
    const nextDay = findLayerById(this.data.dayLayers, dayId);
    const nextPlace = nextDay.places[0];
    const nextSelectedVariantIds = {
      ...this.viewState.selectedVariantIds,
      [getDayLayerGroupMeta(nextDay).groupId]: nextDay.id,
    };

    this.viewState = {
      ...this.viewState,
      currentDayId: dayId,
      currentMinutes: nextDay.segments[0]?.start ?? nextDay.timelineRange.start,
      poiPopupPlaceId: null,
      activePlaceId: nextPlace?.id ?? this.viewState.activePlaceId,
      collapsedDayIds: removeDayLayerGroupIds(
        this.data.dayLayers,
        this.viewState.collapsedDayIds,
        dayId,
      ),
      selectedVariantIds: nextSelectedVariantIds,
      visibleDayIds: replaceDayLayerIdWithinGroup(
        this.data.dayLayers,
        this.viewState.visibleDayIds,
        dayId,
        true,
      ),
    };

    this.notify();
  }

  toggleMapTool(toolId: MapToolId): void {
    const nextToolId =
      toolId === 'hand'
        ? 'hand'
        : this.viewState.activeMapTool === toolId
          ? 'hand'
          : toolId;

    this.viewState = {
      ...this.viewState,
      activeMapTool: nextToolId,
      poiPopupPlaceId: null,
    };

    this.notify();
  }

  reorderDayLayers(
    sourceDayId: string,
    targetDayId: string,
    position: 'after' | 'before',
  ): void {
    if (sourceDayId === targetDayId) {
      return;
    }

    const nextDayLayers = reorderDayLayerGroups(
      this.data.dayLayers,
      this.viewState.selectedVariantIds,
      sourceDayId,
      targetDayId,
      position,
    );

    this.data = {
      ...this.data,
      dayLayers: nextDayLayers,
      days: nextDayLayers.map(({ id, label, meta }) => ({ id, label, meta })),
    };

    this.notify();
  }

  updateDayLayer(dayId: string, changes: { label: string; meta: string }): void {
    const normalizedLabel = changes.label.trim();
    const normalizedMeta = changes.meta.trim();
    const currentDay = findLayerById(this.data.dayLayers, dayId);
    const currentGroupMeta = getDayLayerGroupMeta(currentDay);
    const currentGroupDayIds = getDayLayerIdsInGroup(this.data.dayLayers, dayId);
    const hasVariants = currentGroupDayIds.length > 1;

    if (
      currentDay.id !== dayId ||
      !currentDay ||
      (!normalizedLabel && !normalizedMeta) ||
      (hasVariants
        ? currentGroupMeta.groupLabel === normalizedLabel && currentDay.meta === normalizedMeta
        : currentDay.label === normalizedLabel && currentDay.meta === normalizedMeta)
    ) {
      return;
    }

    const nextDayLayers = hasVariants
      ? this.data.dayLayers.map((day) => {
          if (getDayLayerGroupMeta(day).groupId !== currentGroupMeta.groupId) {
            return day;
          }

          const nextGroupLabel = normalizedLabel || currentGroupMeta.groupLabel;
          const { variantLabel } = getDayLayerGroupMeta(day);

          return {
            ...day,
            label: buildVariantLayerLabel(nextGroupLabel, variantLabel),
            meta: day.id === dayId ? normalizedMeta || day.meta : day.meta,
            variantGroupLabel: nextGroupLabel,
          };
        })
      : this.data.dayLayers.map((day) =>
          day.id === dayId
            ? {
                ...day,
                label: normalizedLabel || day.label,
                meta: normalizedMeta || day.meta,
              }
            : day,
        );

    this.data = {
      ...this.data,
      dayLayers: nextDayLayers,
      days: nextDayLayers.map(({ id, label, meta }) => ({ id, label, meta })),
    };

    this.notify();
  }

  addPoiAtCurrentDay(lat: number, lng: number): void {
    if (this.viewState.activeMapTool !== 'pin') {
      return;
    }

    const currentDay = findLayerById(this.data.dayLayers, this.viewState.currentDayId);
    const attractionColor =
      this.data.legendItems.find((item) => item.id === '관광')?.color ?? '#ff8a3d';
    const customPlaceCount =
      currentDay.places.filter((place) => place.name.startsWith('새 핀')).length + 1;
    const placeId = `${currentDay.id}-custom-${Date.now()}`;
    const lastSegment = currentDay.segments[currentDay.segments.length - 1];
    const segmentStart = Math.max(
      currentDay.timelineRange.start,
      (lastSegment?.end ?? currentDay.timelineRange.start) + 10,
    );
    const segmentEnd = segmentStart + 45;
    const nextPlace: Poi = {
      id: placeId,
      dayId: currentDay.id,
      name: `새 핀 ${customPlaceCount}`,
      tag: '관광',
      iconId: '관광',
      color: attractionColor,
      position: { lat, lng },
      zoom: this.getSnapshot().currentDay.places[0]?.zoom ?? 14,
      summary: '지도에서 직접 추가한 커스텀 POI입니다.',
      detail: '커스텀 핀',
      visitTime: `${this.formatClock(segmentStart)} ~ ${this.formatClock(segmentEnd)}`,
      businessHours: '미정',
      estimatedCost: '미정',
      memo: '지도 클릭으로 추가됨',
    };
    const nextSegment = {
      id: `${placeId}-segment`,
      type: 'poi' as const,
      placeId,
      label: nextPlace.name,
      start: segmentStart,
      end: segmentEnd,
      color: nextPlace.color,
    };
    const nextDayLayers = this.data.dayLayers.map((day) => {
      if (day.id !== currentDay.id) {
        return day;
      }

      return {
        ...day,
        places: [...day.places, nextPlace],
        segments: [...day.segments, nextSegment],
        timelineRange: {
          ...day.timelineRange,
          end: Math.max(day.timelineRange.end, segmentEnd),
        },
      };
    });
    const activeCategoryIds = this.viewState.activeCategoryIds.includes(nextPlace.tag)
      ? this.viewState.activeCategoryIds
      : [...this.viewState.activeCategoryIds, nextPlace.tag];
    const visibleDayIds = this.viewState.visibleDayIds.includes(currentDay.id)
      ? this.viewState.visibleDayIds
      : [...this.viewState.visibleDayIds, currentDay.id];

    this.data = {
      ...this.data,
      dayLayers: nextDayLayers,
      days: nextDayLayers.map(({ id, label, meta }) => ({ id, label, meta })),
    };
    this.viewState = {
      ...this.viewState,
      activePlaceId: placeId,
      poiPopupPlaceId: placeId,
      currentMinutes: segmentStart,
      activeCategoryIds,
      visibleDayIds,
    };

    this.notify();
  }

  addDrawingAtCurrentDay(path: RoutePoint[], type: MapDrawingType): void {
    if (path.length < 2) {
      return;
    }

    const currentDay = findLayerById(this.data.dayLayers, this.viewState.currentDayId);
    const drawingId = `${currentDay.id}-drawing-${Date.now()}`;
    const drawing = buildDefaultMapDrawing(
      currentDay.label,
      drawingId,
      currentDay.drawings.length,
      path,
      type,
    );
    const nextDayLayers = this.data.dayLayers.map((day) => {
      if (day.id !== currentDay.id) {
        return day;
      }

      return {
        ...day,
        drawings: [...day.drawings, drawing],
      };
    });

    this.data = {
      ...this.data,
      dayLayers: nextDayLayers,
      days: nextDayLayers.map(({ id, label, meta }) => ({ id, label, meta })),
    };

    this.notify();
  }

  updateDrawingIcon(drawingId: string, iconId: MapDrawingIconId): void {
    const match = findDrawingById(this.data.dayLayers, drawingId);

    if (!match || match.drawing.iconId === iconId) {
      return;
    }

    const nextDayLayers = this.data.dayLayers.map((day) => {
      if (day.id !== match.day.id) {
        return day;
      }

      return {
        ...day,
        drawings: day.drawings.map((drawing, drawingIndex) =>
          drawing.id === drawingId
            ? normalizeMapDrawing(
                {
                  ...drawing,
                  iconId,
                },
                day.label,
                drawingIndex,
              )
            : drawing,
        ),
      };
    });

    this.data = {
      ...this.data,
      dayLayers: nextDayLayers,
      days: nextDayLayers.map(({ id, label, meta }) => ({ id, label, meta })),
    };

    this.notify();
  }

  updateDrawingColor(drawingId: string, color: string): void {
    const match = findDrawingById(this.data.dayLayers, drawingId);
    const normalizedColor = color.trim();

    if (!match || !normalizedColor || match.drawing.strokeColor === normalizedColor) {
      return;
    }

    const nextDayLayers = this.data.dayLayers.map((day) => {
      if (day.id !== match.day.id) {
        return day;
      }

      return {
        ...day,
        drawings: day.drawings.map((drawing, drawingIndex) =>
          drawing.id === drawingId
            ? normalizeMapDrawing(
                {
                  ...drawing,
                  fillColor: drawing.type === 'polygon' ? normalizedColor : undefined,
                  strokeColor: normalizedColor,
                },
                day.label,
                drawingIndex,
              )
            : drawing,
        ),
      };
    });

    this.data = {
      ...this.data,
      dayLayers: nextDayLayers,
      days: nextDayLayers.map(({ id, label, meta }) => ({ id, label, meta })),
    };

    this.notify();
  }

  updateDrawing(drawingId: string, changes: MapDrawingEditableFields): void {
    const match = findDrawingById(this.data.dayLayers, drawingId);

    if (!match) {
      return;
    }

    const normalizedChanges: MapDrawingEditableFields = {};

    Object.entries(changes).forEach(([key, value]) => {
      if (typeof value !== 'string') {
        return;
      }

      normalizedChanges[key as keyof MapDrawingEditableFields] = value.trim();
    });

    const nextDayLayers = this.data.dayLayers.map((day) => {
      if (day.id !== match.day.id) {
        return day;
      }

      return {
        ...day,
        drawings: day.drawings.map((drawing, drawingIndex) =>
          drawing.id === drawingId
            ? normalizeMapDrawing(
                {
                  ...drawing,
                  ...normalizedChanges,
                },
                day.label,
                drawingIndex,
              )
            : drawing,
        ),
      };
    });

    this.data = {
      ...this.data,
      dayLayers: nextDayLayers,
      days: nextDayLayers.map(({ id, label, meta }) => ({ id, label, meta })),
    };

    this.notify();
  }

  removeDrawing(drawingId: string): void {
    const match = findDrawingById(this.data.dayLayers, drawingId);

    if (!match) {
      return;
    }

    const nextDayLayers = this.data.dayLayers.map((day) => {
      if (day.id !== match.day.id) {
        return day;
      }

      return {
        ...day,
        drawings: day.drawings.filter((drawing) => drawing.id !== drawingId),
      };
    });

    this.data = {
      ...this.data,
      dayLayers: nextDayLayers,
      days: nextDayLayers.map(({ id, label, meta }) => ({ id, label, meta })),
    };

    this.notify();
  }

  updatePoiIcon(placeId: string, iconId: PoiIconId): void {
    const place = findPlaceById(this.data.dayLayers, placeId);

    if (!place || place.iconId === iconId) {
      return;
    }

    const nextDayLayers = this.data.dayLayers.map((day) => {
      if (day.id !== place.dayId) {
        return day;
      }

      return {
        ...day,
        places: day.places.map((item) =>
          item.id === placeId
            ? {
                ...item,
                iconId,
              }
            : item,
        ),
      };
    });

    this.data = {
      ...this.data,
      dayLayers: nextDayLayers,
      days: nextDayLayers.map(({ id, label, meta }) => ({ id, label, meta })),
    };

    this.notify();
  }

  updatePoiColor(placeId: string, color: string): void {
    const place = findPlaceById(this.data.dayLayers, placeId);
    const normalizedColor = color.trim();

    if (!place || !normalizedColor || place.color === normalizedColor) {
      return;
    }

    const nextDayLayers = this.data.dayLayers.map((day) => {
      if (day.id !== place.dayId) {
        return day;
      }

      return {
        ...day,
        places: day.places.map((item) =>
          item.id === placeId
            ? {
                ...item,
                color: normalizedColor,
              }
            : item,
        ),
        segments: day.segments.map((segment) =>
          segment.type === 'poi' && segment.placeId === placeId
            ? {
                ...segment,
                color: normalizedColor,
              }
            : segment,
        ),
      };
    });

    this.data = {
      ...this.data,
      dayLayers: nextDayLayers,
      days: nextDayLayers.map(({ id, label, meta }) => ({ id, label, meta })),
    };

    this.notify();
  }

  updatePoi(placeId: string, changes: PoiEditableFields): void {
    const place = findPlaceById(this.data.dayLayers, placeId);

    if (!place) {
      return;
    }

    const normalizedChanges: PoiEditableFields = {};

    Object.entries(changes).forEach(([key, value]) => {
      if (typeof value !== 'string') {
        return;
      }

      normalizedChanges[key as keyof PoiEditableFields] = value.trim();
    });

    const nextDayLayers = this.data.dayLayers.map((day) => {
      if (day.id !== place.dayId) {
        return day;
      }

      return {
        ...day,
        places: day.places.map((item) =>
          item.id === placeId
            ? {
                ...item,
                ...normalizedChanges,
              }
            : item,
        ),
        segments: day.segments.map((segment) =>
          segment.type === 'poi' && segment.placeId === placeId
            ? {
                ...segment,
                label:
                  typeof normalizedChanges.name === 'string' && normalizedChanges.name
                    ? normalizedChanges.name
                    : segment.label,
              }
            : segment,
        ),
      };
    });

    this.data = {
      ...this.data,
      dayLayers: nextDayLayers,
      days: nextDayLayers.map(({ id, label, meta }) => ({ id, label, meta })),
    };

    this.notify();
  }

  removePoi(placeId: string): void {
    const place = findPlaceById(this.data.dayLayers, placeId);

    if (!place) {
      return;
    }

    const nextDayLayers = this.data.dayLayers.map((day) => {
      if (day.id !== place.dayId) {
        return day;
      }

      const poiSegmentIndex = day.segments.findIndex(
        (segment) => segment.type === 'poi' && segment.placeId === placeId,
      );
      const nextSegments = day.segments.filter((segment, index) => {
        if (segment.type === 'poi' && segment.placeId === placeId) {
          return false;
        }

        if (
          segment.type === 'travel' &&
          poiSegmentIndex >= 0 &&
          (index === poiSegmentIndex - 1 || index === poiSegmentIndex + 1)
        ) {
          return false;
        }

        return true;
      });
      const nextTimelineRange =
        nextSegments.length > 0
          ? {
              start: nextSegments[0].start,
              end: nextSegments[nextSegments.length - 1].end,
            }
          : day.timelineRange;

      return {
        ...day,
        places: day.places.filter((item) => item.id !== placeId),
        segments: nextSegments,
        timelineRange: nextTimelineRange,
      };
    });

    const nextData: PlannerData = {
      ...this.data,
      dayLayers: nextDayLayers,
      days: nextDayLayers.map(({ id, label, meta }) => ({ id, label, meta })),
    };
    const fallbackDay = findLayerById(nextDayLayers, this.viewState.currentDayId);
    const fallbackPlace =
      fallbackDay.places.find((item) => item.id !== placeId) ?? findFirstPlace(nextDayLayers);
    const fallbackSelectionDay = fallbackPlace
      ? findLayerById(nextDayLayers, fallbackPlace.dayId)
      : fallbackDay;

    this.data = nextData;

    if (this.viewState.activePlaceId === placeId || this.viewState.poiPopupPlaceId === placeId) {
      const nextSelectedVariantIds = {
        ...this.viewState.selectedVariantIds,
        [getDayLayerGroupMeta(fallbackSelectionDay).groupId]: fallbackSelectionDay.id,
      };

      this.viewState = {
        ...this.viewState,
        activePlaceId: fallbackPlace?.id ?? this.viewState.activePlaceId,
        collapsedDayIds: removeDayLayerGroupIds(
          nextDayLayers,
          this.viewState.collapsedDayIds,
          fallbackSelectionDay.id,
        ),
        currentDayId: fallbackSelectionDay.id,
        currentMinutes:
          fallbackSelectionDay.segments[0]?.start ?? fallbackSelectionDay.timelineRange.start,
        poiPopupPlaceId: null,
        selectedVariantIds: nextSelectedVariantIds,
        visibleDayIds: replaceDayLayerIdWithinGroup(
          nextDayLayers,
          this.viewState.visibleDayIds,
          fallbackSelectionDay.id,
          true,
        ),
      };
    }

    this.reconcileSelection();
    this.notify();
  }

  movePoi(
    placeId: string,
    targetDayId: string,
    targetPlaceId: string | null,
    position: 'after' | 'before',
  ): void {
    const moveResult = movePoiBetweenDayLayers({
      dayLayers: this.data.dayLayers,
      placeId,
      targetDayId,
      targetPlaceId,
      position,
    });

    if (!moveResult.movedPlace || !moveResult.targetDay) {
      return;
    }

    this.data = {
      ...this.data,
      dayLayers: moveResult.dayLayers,
      days: moveResult.dayLayers.map(({ id, label, meta }) => ({ id, label, meta })),
    };

    const nextSelectedVariantIds = {
      ...this.viewState.selectedVariantIds,
      [getDayLayerGroupMeta(moveResult.targetDay).groupId]: moveResult.targetDay.id,
    };
    const nextVisibleDayIds = replaceDayLayerIdWithinGroup(
      moveResult.dayLayers,
      this.viewState.visibleDayIds,
      moveResult.targetDay.id,
      true,
    );

    this.viewState = {
      ...this.viewState,
      activePlaceId: moveResult.movedPlace.id,
      collapsedDayIds: removeDayLayerGroupIds(
        moveResult.dayLayers,
        this.viewState.collapsedDayIds,
        moveResult.targetDay.id,
      ),
      currentDayId: moveResult.targetDay.id,
      currentMinutes:
        moveResult.targetDay.segments[0]?.start ?? moveResult.targetDay.timelineRange.start,
      poiPopupPlaceId: moveResult.movedPlace.id,
      selectedVariantIds: nextSelectedVariantIds,
      visibleDayIds: nextVisibleDayIds,
    };

    this.notify();
  }

  selectPlace(placeId: string): void {
    const place = findPlaceById(this.data.dayLayers, placeId);

    if (!place) {
      return;
    }

    const day = findLayerById(this.data.dayLayers, place.dayId);
    const matchingSegment = findSegmentByPlaceId(day, placeId);
    const nextSelectedVariantIds = {
      ...this.viewState.selectedVariantIds,
      [getDayLayerGroupMeta(day).groupId]: day.id,
    };

    this.viewState = {
      ...this.viewState,
      currentDayId: day.id,
      activePlaceId: placeId,
      poiPopupPlaceId: placeId,
      collapsedDayIds: removeDayLayerGroupIds(
        this.data.dayLayers,
        this.viewState.collapsedDayIds,
        day.id,
      ),
      selectedVariantIds: nextSelectedVariantIds,
      visibleDayIds: replaceDayLayerIdWithinGroup(
        this.data.dayLayers,
        this.viewState.visibleDayIds,
        day.id,
        true,
      ),
      currentMinutes: matchingSegment?.start ?? this.viewState.currentMinutes,
    };

    this.notify();
  }

  closePoiPopup(): void {
    if (!this.viewState.poiPopupPlaceId) {
      return;
    }

    this.viewState = {
      ...this.viewState,
      poiPopupPlaceId: null,
    };

    this.notify();
  }

  seekTimeline(minutes: number): void {
    const currentDay = findLayerById(this.data.dayLayers, this.viewState.currentDayId);
    const matchingSegment = findActivePoiSegment(currentDay, minutes);

    this.viewState = {
      ...this.viewState,
      currentMinutes: minutes,
      poiPopupPlaceId: null,
      activePlaceId: matchingSegment?.placeId ?? this.viewState.activePlaceId,
    };

    this.notify();
  }

  toggleDayVisibility(dayId: string): void {
    const groupDayIds = getDayLayerIdsInGroup(this.data.dayLayers, dayId);
    const isGroupVisible = groupDayIds.some((candidateDayId) =>
      this.viewState.visibleDayIds.includes(candidateDayId),
    );
    const visibleDayIds = isGroupVisible
      ? removeDayLayerGroupIds(this.data.dayLayers, this.viewState.visibleDayIds, dayId)
      : replaceDayLayerIdWithinGroup(this.data.dayLayers, this.viewState.visibleDayIds, dayId, true);

    this.viewState = {
      ...this.viewState,
      visibleDayIds,
      poiPopupPlaceId: null,
    };

    this.reconcileSelection();
    this.notify();
  }

  toggleDayCollapsed(dayId: string): void {
    const groupDayIds = getDayLayerIdsInGroup(this.data.dayLayers, dayId);
    const isGroupCollapsed = groupDayIds.some((candidateDayId) =>
      this.viewState.collapsedDayIds.includes(candidateDayId),
    );
    const collapsedDayIds = isGroupCollapsed
      ? removeDayLayerGroupIds(this.data.dayLayers, this.viewState.collapsedDayIds, dayId)
      : replaceDayLayerIdWithinGroup(
          this.data.dayLayers,
          this.viewState.collapsedDayIds,
          dayId,
          true,
        );

    this.viewState = {
      ...this.viewState,
      collapsedDayIds,
    };

    this.notify();
  }

  toggleCategory(categoryId: string): void {
    const activeCategoryIds = this.viewState.activeCategoryIds.includes(categoryId)
      ? this.viewState.activeCategoryIds.filter((id) => id !== categoryId)
      : [...this.viewState.activeCategoryIds, categoryId];

    this.viewState = {
      ...this.viewState,
      activeCategoryIds,
      poiPopupPlaceId: null,
    };

    this.reconcileSelection();
    this.notify();
  }

  private reconcileSelection(): void {
    const activePlace = findPlaceById(this.data.dayLayers, this.viewState.activePlaceId);

    if (!activePlace) {
      return;
    }

    const isVisible =
      this.viewState.visibleDayIds.includes(activePlace.dayId) &&
      this.viewState.activeCategoryIds.includes(activePlace.tag);

    if (isVisible) {
      return;
    }

    const currentDay = findLayerById(this.data.dayLayers, this.viewState.currentDayId);
    const fallbackPlace =
      currentDay.places.find(
        (place) =>
          this.viewState.visibleDayIds.includes(place.dayId) &&
          this.viewState.activeCategoryIds.includes(place.tag),
      ) ??
      this.getSnapshot().visiblePlaces[0];

    if (!fallbackPlace) {
      return;
    }

    this.viewState = {
      ...this.viewState,
      activePlaceId: fallbackPlace.id,
      poiPopupPlaceId: null,
    };
  }

  private notify(): void {
    this.subscribers.forEach((subscriber) => {
      subscriber();
    });
  }

  private formatClock(minutes: number): string {
    const hour = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const minute = (minutes % 60).toString().padStart(2, '0');

    return `${hour}:${minute}`;
  }
}

export const planStore = new PlanStore();
