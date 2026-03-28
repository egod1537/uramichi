import type { DayLayer } from '../../models/Plan';

export interface DayLayerGroupMeta {
  groupId: string;
  groupLabel: string;
  variantLabel: string | null;
}

export interface DayLayerGroup {
  id: string;
  label: string;
  layers: DayLayer[];
  selectedLayer: DayLayer;
  selectedVariantLabel: string | null;
}

function parseVariantLabelFromLayerLabel(label: string): DayLayerGroupMeta | null {
  const matchedLabel = label.match(/^(.*\d)\s*([A-Z])$/u);

  if (!matchedLabel) {
    return null;
  }

  const groupLabel = matchedLabel[1]?.trim();
  const variantLabel = matchedLabel[2]?.trim();

  if (!groupLabel || !variantLabel) {
    return null;
  }

  return {
    groupId: `variant:${groupLabel.toLowerCase()}`,
    groupLabel,
    variantLabel,
  };
}

export function getDayLayerGroupMeta(layer: DayLayer): DayLayerGroupMeta {
  if (layer.variantGroupId) {
    return {
      groupId: layer.variantGroupId,
      groupLabel: layer.variantGroupLabel ?? layer.label,
      variantLabel: layer.variantLabel ?? null,
    };
  }

  return parseVariantLabelFromLayerLabel(layer.label) ?? {
    groupId: layer.id,
    groupLabel: layer.label,
    variantLabel: null,
  };
}

export function buildVariantLayerLabel(groupLabel: string, variantLabel: string | null): string {
  if (!variantLabel) {
    return groupLabel;
  }

  return /\d$/u.test(groupLabel) ? `${groupLabel}${variantLabel}` : `${groupLabel} ${variantLabel}`;
}

export function createSelectedVariantIds(
  dayLayers: DayLayer[],
  preferredDayId?: string,
): Record<string, string> {
  const selectedVariantIds: Record<string, string> = {};

  dayLayers.forEach((layer) => {
    const { groupId } = getDayLayerGroupMeta(layer);

    if (!selectedVariantIds[groupId]) {
      selectedVariantIds[groupId] = layer.id;
    }
  });

  if (preferredDayId) {
    const preferredLayer = dayLayers.find((layer) => layer.id === preferredDayId);

    if (preferredLayer) {
      selectedVariantIds[getDayLayerGroupMeta(preferredLayer).groupId] = preferredLayer.id;
    }
  }

  return selectedVariantIds;
}

export function normalizeSelectedVariantIds(
  dayLayers: DayLayer[],
  selectedVariantIds?: Record<string, string>,
  preferredDayId?: string,
): Record<string, string> {
  const normalizedSelection = createSelectedVariantIds(dayLayers, preferredDayId);

  if (selectedVariantIds) {
    Object.entries(selectedVariantIds).forEach(([groupId, dayId]) => {
      const matchingLayer = dayLayers.find((layer) => {
        return layer.id === dayId && getDayLayerGroupMeta(layer).groupId === groupId;
      });

      if (matchingLayer) {
        normalizedSelection[groupId] = matchingLayer.id;
      }
    });
  }

  if (preferredDayId) {
    const preferredLayer = dayLayers.find((layer) => layer.id === preferredDayId);

    if (preferredLayer) {
      normalizedSelection[getDayLayerGroupMeta(preferredLayer).groupId] = preferredLayer.id;
    }
  }

  return normalizedSelection;
}

export function buildDayLayerGroups(
  dayLayers: DayLayer[],
  selectedVariantIds: Record<string, string>,
): DayLayerGroup[] {
  const normalizedSelection = normalizeSelectedVariantIds(dayLayers, selectedVariantIds);
  const groupMap = new Map<string, DayLayerGroup>();

  dayLayers.forEach((layer) => {
    const groupMeta = getDayLayerGroupMeta(layer);
    const existingGroup = groupMap.get(groupMeta.groupId);

    if (existingGroup) {
      existingGroup.layers.push(layer);
      return;
    }

    groupMap.set(groupMeta.groupId, {
      id: groupMeta.groupId,
      label: groupMeta.groupLabel,
      layers: [layer],
      selectedLayer: layer,
      selectedVariantLabel: groupMeta.variantLabel,
    });
  });

  return Array.from(groupMap.values()).map((group) => {
    const selectedLayer =
      group.layers.find((layer) => layer.id === normalizedSelection[group.id]) ?? group.layers[0];

    return {
      ...group,
      selectedLayer,
      selectedVariantLabel: getDayLayerGroupMeta(selectedLayer).variantLabel,
    };
  });
}

export function getSelectedDayLayerIds(
  dayLayers: DayLayer[],
  selectedVariantIds: Record<string, string>,
): string[] {
  return buildDayLayerGroups(dayLayers, selectedVariantIds).map((group) => group.selectedLayer.id);
}

export function getDayLayerIdsInGroup(dayLayers: DayLayer[], dayId: string): string[] {
  const targetLayer = dayLayers.find((layer) => layer.id === dayId);

  if (!targetLayer) {
    return [];
  }

  const { groupId } = getDayLayerGroupMeta(targetLayer);

  return dayLayers
    .filter((layer) => getDayLayerGroupMeta(layer).groupId === groupId)
    .map((layer) => layer.id);
}

export function replaceDayLayerIdWithinGroup(
  dayLayers: DayLayer[],
  dayIdList: string[],
  nextDayId: string,
  ensurePresent: boolean,
): string[] {
  const groupDayIds = new Set(getDayLayerIdsInGroup(dayLayers, nextDayId));
  const nextDayIdList = dayIdList.filter((dayId) => !groupDayIds.has(dayId));
  const hasGroupEntry = dayIdList.some((dayId) => groupDayIds.has(dayId));

  if (ensurePresent || hasGroupEntry) {
    nextDayIdList.push(nextDayId);
  }

  return nextDayIdList;
}

export function removeDayLayerGroupIds(
  dayLayers: DayLayer[],
  dayIdList: string[],
  dayId: string,
): string[] {
  const groupDayIds = new Set(getDayLayerIdsInGroup(dayLayers, dayId));

  return dayIdList.filter((candidateDayId) => !groupDayIds.has(candidateDayId));
}

export function normalizeSelectedDayIdList(
  dayLayers: DayLayer[],
  selectedVariantIds: Record<string, string>,
  dayIdList: string[],
  fallbackDayIds: string[],
): string[] {
  const validDayIds = new Set(dayLayers.map((layer) => layer.id));
  const filteredIds = Array.from(
    new Set(dayIdList.filter((dayId) => typeof dayId === 'string' && validDayIds.has(dayId))),
  );

  if (filteredIds.length === 0 && dayIdList.length > 0) {
    return fallbackDayIds;
  }

  const groups = buildDayLayerGroups(dayLayers, selectedVariantIds);
  const filteredIdSet = new Set(filteredIds);
  const normalizedDayIds = groups.flatMap((group) => {
    return group.layers.some((layer) => filteredIdSet.has(layer.id)) ? [group.selectedLayer.id] : [];
  });

  if (normalizedDayIds.length > 0 || dayIdList.length === 0) {
    return normalizedDayIds;
  }

  return fallbackDayIds;
}

export function reorderDayLayerGroups(
  dayLayers: DayLayer[],
  selectedVariantIds: Record<string, string>,
  sourceDayId: string,
  targetDayId: string,
  position: 'after' | 'before',
): DayLayer[] {
  const sourceGroupId = getDayLayerGroupMeta(
    dayLayers.find((layer) => layer.id === sourceDayId) ?? dayLayers[0],
  ).groupId;
  const targetGroupId = getDayLayerGroupMeta(
    dayLayers.find((layer) => layer.id === targetDayId) ?? dayLayers[0],
  ).groupId;

  if (sourceGroupId === targetGroupId) {
    return dayLayers;
  }

  const groups = buildDayLayerGroups(dayLayers, selectedVariantIds);
  const sourceIndex = groups.findIndex((group) => group.id === sourceGroupId);
  const targetIndex = groups.findIndex((group) => group.id === targetGroupId);

  if (sourceIndex < 0 || targetIndex < 0) {
    return dayLayers;
  }

  const nextGroups = [...groups];
  const [movingGroup] = nextGroups.splice(sourceIndex, 1);

  if (!movingGroup) {
    return dayLayers;
  }

  const nextTargetIndex = nextGroups.findIndex((group) => group.id === targetGroupId);
  const insertIndex = position === 'after' ? nextTargetIndex + 1 : nextTargetIndex;

  nextGroups.splice(insertIndex, 0, movingGroup);

  return nextGroups.flatMap((group) => group.layers);
}

export function countDayLayerAlternatives(dayLayers: DayLayer[]): number {
  return buildDayLayerGroups(dayLayers, createSelectedVariantIds(dayLayers)).reduce(
    (count, group) => count + Math.max(0, group.layers.length - 1),
    0,
  );
}
