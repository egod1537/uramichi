import { eventBus } from './EventBus';
import { planStore } from './PlanStore';

let hasBoundPlannerEvents = false;

export function bindPlannerEvents(): void {
  if (hasBoundPlannerEvents) {
    return;
  }

  hasBoundPlannerEvents = true;

  eventBus.on('map:tool-toggle', ({ toolId }) => {
    planStore.toggleMapTool(toolId);
  });

  eventBus.on('map:pin-create', ({ lat, lng }) => {
    planStore.addPoiAtCurrentDay(lat, lng);
  });

  eventBus.on('pin:select', ({ pinId }) => {
    planStore.selectPlace(pinId);
  });

  eventBus.on('poi:icon-change', ({ placeId, iconId }) => {
    planStore.updatePoiIcon(placeId, iconId);
  });

  eventBus.on('poi:color-change', ({ placeId, color }) => {
    planStore.updatePoiColor(placeId, color);
  });

  eventBus.on('poi:update', ({ placeId, changes }) => {
    planStore.updatePoi(placeId, changes);
  });

  eventBus.on('poi:delete', ({ placeId }) => {
    planStore.removePoi(placeId);
  });

  eventBus.on('poi:move', ({ placeId, targetDayId, targetPlaceId, position }) => {
    planStore.movePoi(placeId, targetDayId, targetPlaceId, position);
  });

  eventBus.on('poi:close', () => {
    planStore.closePoiPopup();
  });

  eventBus.on('drawing:icon-change', ({ drawingId, iconId }) => {
    planStore.updateDrawingIcon(drawingId, iconId);
  });

  eventBus.on('drawing:color-change', ({ drawingId, color }) => {
    planStore.updateDrawingColor(drawingId, color);
  });

  eventBus.on('drawing:update', ({ drawingId, changes }) => {
    planStore.updateDrawing(drawingId, changes);
  });

  eventBus.on('drawing:delete', ({ drawingId }) => {
    planStore.removeDrawing(drawingId);
  });

  eventBus.on('day:switch', ({ dayId }) => {
    planStore.focusDay(dayId);
  });

  eventBus.on('timeline:seek', ({ minutes }) => {
    planStore.seekTimeline(minutes);
  });

  eventBus.on('layer:visibility-toggle', ({ dayId }) => {
    planStore.toggleDayVisibility(dayId);
  });

  eventBus.on('layer:collapse-toggle', ({ dayId }) => {
    planStore.toggleDayCollapsed(dayId);
  });

  eventBus.on('layer:reorder', ({ sourceDayId, targetDayId, position }) => {
    planStore.reorderDayLayers(sourceDayId, targetDayId, position);
  });

  eventBus.on('layer:update', ({ dayId, changes }) => {
    planStore.updateDayLayer(dayId, changes);
  });

  eventBus.on('legend:toggle', ({ categoryId }) => {
    planStore.toggleCategory(categoryId);
  });
}
