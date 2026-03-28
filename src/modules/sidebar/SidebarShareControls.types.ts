import type { PlannerSnapshot } from '../../models/Plan';

export type ShareStatus = 'disabled' | 'loading' | 'ready' | 'fallback' | 'error';

export interface SidebarShareControlsProps {
  snapshot: PlannerSnapshot;
}

export interface SidebarShareControlsState {
  isExportDialogOpen: boolean;
  isShareDialogOpen: boolean;
  isShareLinkCopied: boolean;
  isSharePublicEnabled: boolean;
  isShareSearchEnabled: boolean;
  shareErrorMessage: string;
  shareLink: string;
  shareStatus: ShareStatus;
}
