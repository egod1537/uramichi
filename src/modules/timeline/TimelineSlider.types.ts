import type { PlannerSnapshot } from '../../models/Plan';

export interface TimelineSliderProps extends Record<string, never> {}

export interface TimelineSliderState {
  snapshot: PlannerSnapshot;
  isActive: boolean;
}
