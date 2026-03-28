import type { PlannerSnapshot } from '../../models/Plan';

export interface SidebarPanelProps extends Record<string, never> {}

export type LayerDropPosition = 'after' | 'before';

export interface SidebarPanelState {
  draggedLayerId: string | null;
  draggedPlaceId: string | null;
  dropPosition: LayerDropPosition | null;
  dropTargetLayerId: string | null;
  placeDropPosition: LayerDropPosition | null;
  placeDropTargetDayId: string | null;
  placeDropTargetPlaceId: string | null;
  snapshot: PlannerSnapshot;
  expandedPlaceId: string | null;
  openVariantGroupId: string | null;
}
