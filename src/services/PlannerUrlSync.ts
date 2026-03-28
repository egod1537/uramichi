import { planStore } from './PlanStore';
import { buildPlannerShareUrl } from './PlannerShareState';

let hasBoundPlannerUrlSync = false;

export function bindPlannerUrlSync(): void {
  if (hasBoundPlannerUrlSync || typeof window === 'undefined') {
    return;
  }

  hasBoundPlannerUrlSync = true;

  const syncUrlToSnapshot = () => {
    const nextUrl = buildPlannerShareUrl(planStore.getSnapshot(), window.location.href, {
      preserveDebug: true,
    });

    if (nextUrl !== window.location.href) {
      window.history.replaceState(window.history.state, document.title, nextUrl);
    }
  };

  planStore.subscribe(syncUrlToSnapshot);
  syncUrlToSnapshot();
}
