import type { ChatSessionSnapshot } from '../models/Chat';
import type { PlannerData, PlannerSnapshot, PlannerViewState } from '../models/Plan';
import { chatStore } from './ChatStore';
import { serializePlannerToKml } from './KmlSerializer';

const PLANNER_JSON_EXPORT_VERSION = 1 as const;

interface PlannerJsonExportPayload {
  chat: ChatSessionSnapshot;
  exportedAt: string;
  format: 'uramichi/planner-json';
  version: typeof PLANNER_JSON_EXPORT_VERSION;
  data: PlannerData;
  viewState: PlannerViewState;
}

function buildPlannerData(snapshot: PlannerSnapshot): PlannerData {
  return {
    dayLayers: snapshot.dayLayers,
    days: snapshot.days,
    legendItems: snapshot.legendItems,
    planMeta: snapshot.planMeta,
  };
}

function buildPlannerViewState(snapshot: PlannerSnapshot): PlannerViewState {
  return {
    debugEnabled: snapshot.debugEnabled,
    activeMapTool: snapshot.activeMapTool,
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

function buildPlannerJsonExportPayload(snapshot: PlannerSnapshot): PlannerJsonExportPayload {
  return {
    chat: chatStore.getSnapshot(),
    exportedAt: new Date().toISOString(),
    format: 'uramichi/planner-json',
    version: PLANNER_JSON_EXPORT_VERSION,
    data: buildPlannerData(snapshot),
    viewState: buildPlannerViewState(snapshot),
  };
}

function buildFileBaseName(title: string): string {
  const normalizedTitle = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
  const fallbackTitle = normalizedTitle || 'planner-export';
  const timestamp = new Date().toISOString().replace(/[:.]/gu, '-');

  return `${fallbackTitle}-${timestamp}`;
}

function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = downloadUrl;
  link.download = filename;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 0);
}

export function serializePlannerToJson(snapshot: PlannerSnapshot): string {
  return JSON.stringify(buildPlannerJsonExportPayload(snapshot), null, 2);
}

export function buildPlannerExportFilenames(snapshot: PlannerSnapshot): {
  jsonFilename: string;
  kmlFilename: string;
} {
  const baseName = buildFileBaseName(snapshot.planMeta.title);

  return {
    jsonFilename: `${baseName}.json`,
    kmlFilename: `${baseName}.kml`,
  };
}

export function downloadPlannerJson(snapshot: PlannerSnapshot): void {
  const { jsonFilename } = buildPlannerExportFilenames(snapshot);

  downloadTextFile(jsonFilename, serializePlannerToJson(snapshot), 'application/json;charset=utf-8');
}

export function downloadPlannerKml(snapshot: PlannerSnapshot): void {
  const { kmlFilename } = buildPlannerExportFilenames(snapshot);

  downloadTextFile(
    kmlFilename,
    serializePlannerToKml(snapshot),
    'application/vnd.google-earth.kml+xml;charset=utf-8',
  );
}
