import type { MapToolId } from '../models/Plan';
import type { CategoryId, PoiEditableFields, PoiIconId } from '../models/Poi';
import type { MapDrawingEditableFields, MapDrawingIconId } from '../models/Route';

export interface PlannerEventMap {
  'map:tool-toggle': { toolId: MapToolId };
  'map:pin-create': { lat: number; lng: number };
  'pin:select': { pinId: string };
  'poi:icon-change': { placeId: string; iconId: PoiIconId };
  'poi:color-change': { color: string; placeId: string };
  'poi:update': { placeId: string; changes: PoiEditableFields };
  'poi:delete': { placeId: string };
  'poi:move': {
    placeId: string;
    position: 'after' | 'before';
    targetDayId: string;
    targetPlaceId: string | null;
  };
  'poi:close': Record<string, never>;
  'drawing:icon-change': { drawingId: string; iconId: MapDrawingIconId };
  'drawing:color-change': { color: string; drawingId: string };
  'drawing:update': { drawingId: string; changes: MapDrawingEditableFields };
  'drawing:delete': { drawingId: string };
  'chat:compose': { enablePlanEdit?: boolean; message: string };
  'day:switch': { dayId: string };
  'timeline:seek': { minutes: number };
  'layer:visibility-toggle': { dayId: string };
  'layer:collapse-toggle': { dayId: string };
  'layer:reorder': {
    position: 'after' | 'before';
    sourceDayId: string;
    targetDayId: string;
  };
  'layer:update': {
    changes: {
      label: string;
      meta: string;
    };
    dayId: string;
  };
  'legend:toggle': { categoryId: CategoryId };
}

type EventKey = keyof PlannerEventMap;
type EventHandler<K extends EventKey> = (payload: PlannerEventMap[K]) => void;

class EventBus {
  private listeners = new Map<EventKey, Set<Function>>();

  on<K extends EventKey>(eventName: K, handler: EventHandler<K>): () => void {
    const listeners = this.listeners.get(eventName) ?? new Set();
    listeners.add(handler);
    this.listeners.set(eventName, listeners);

    return () => {
      this.off(eventName, handler);
    };
  }

  off<K extends EventKey>(eventName: K, handler: EventHandler<K>): void {
    const listeners = this.listeners.get(eventName);

    if (!listeners) {
      return;
    }

    listeners.delete(handler);

    if (listeners.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  emit<K extends EventKey>(eventName: K, payload: PlannerEventMap[K]): void {
    const listeners = this.listeners.get(eventName);

    if (!listeners) {
      return;
    }

    listeners.forEach((listener) => {
      listener(payload);
    });
  }
}

export const eventBus = new EventBus();
