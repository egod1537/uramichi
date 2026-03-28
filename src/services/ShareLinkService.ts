import { createShortUrl } from '../api/shlink';
import type { PlannerSnapshot } from '../models/Plan';
import { buildPlannerShareUrl } from './PlannerShareState';

interface CreatePlannerShareLinkOptions {
  crawlable?: boolean;
}

export interface PlannerShareLink {
  longUrl: string;
  shortCode: string;
  shortUrl: string;
}
export { buildPlannerShareUrl } from './PlannerShareState';

export async function createPlannerShareLink(
  snapshot: PlannerSnapshot,
  options: CreatePlannerShareLinkOptions = {},
): Promise<PlannerShareLink> {
  const longUrl = buildPlannerShareUrl(snapshot);
  const response = await createShortUrl(longUrl, {
    crawlable: options.crawlable,
    findIfExists: false,
    forwardQuery: true,
    tags: ['uramichi', 'planner-share'],
    title: `${snapshot.planMeta.title} · ${snapshot.currentDay.label}`,
  });

  return {
    longUrl,
    shortCode: response.shortCode,
    shortUrl: response.shortUrl,
  };
}
