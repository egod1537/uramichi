import { formatClock } from '../../shared/utils/time';

export const DAY_END_MINUTES = 24 * 60;
export const TIME_RANGE_STEP = 10;
const DEFAULT_BUSINESS_START = 10 * 60;
const DEFAULT_BUSINESS_END = 20 * 60;
const DEFAULT_VISIT_START = 13 * 60;
const DEFAULT_VISIT_END = 15 * 60;

export type TimeRangeSourceKind = 'all-day' | 'range' | 'unspecified';

export interface TimeRangeDraft {
  endMinutes: number;
  originalValue: string;
  sourceKind: TimeRangeSourceKind;
  startMinutes: number;
}

function normalizeRawValue(rawValue?: string | null): string {
  return typeof rawValue === 'string' ? rawValue : '';
}

function roundToStep(minutes: number): number {
  return Math.round(minutes / TIME_RANGE_STEP) * TIME_RANGE_STEP;
}

function clampMinutes(minutes: number): number {
  return Math.max(0, Math.min(DAY_END_MINUTES, roundToStep(minutes)));
}

function normalizePair(startMinutes: number, endMinutes: number): Pick<TimeRangeDraft, 'startMinutes' | 'endMinutes'> {
  const normalizedStart = clampMinutes(startMinutes);
  const normalizedEnd = clampMinutes(endMinutes);

  if (normalizedStart === normalizedEnd) {
    return {
      startMinutes: Math.max(0, normalizedStart - TIME_RANGE_STEP),
      endMinutes: Math.min(DAY_END_MINUTES, normalizedEnd + TIME_RANGE_STEP),
    };
  }

  return normalizedStart < normalizedEnd
    ? {
        startMinutes: normalizedStart,
        endMinutes: normalizedEnd,
      }
    : {
        startMinutes: normalizedEnd,
        endMinutes: normalizedStart,
      };
}

function parseRawTimeRange(
  rawValue?: string | null,
): Pick<TimeRangeDraft, 'sourceKind' | 'startMinutes' | 'endMinutes'> | null {
  const normalizedValue = normalizeRawValue(rawValue);
  const trimmedValue = normalizedValue.trim();

  if (!trimmedValue || trimmedValue === '미정') {
    return null;
  }

  if (trimmedValue.includes('항시')) {
    return {
      startMinutes: 0,
      endMinutes: DAY_END_MINUTES,
      sourceKind: 'all-day',
    };
  }

  const timeRangeMatch = trimmedValue.match(
    /(\d{1,2}):(\d{2})\s*(?:~|-|–|—)\s*(\d{1,2}):(\d{2})/,
  );

  if (!timeRangeMatch) {
    return null;
  }

  const nextStartMinutes = Number(timeRangeMatch[1]) * 60 + Number(timeRangeMatch[2]);
  const nextEndMinutes = Number(timeRangeMatch[3]) * 60 + Number(timeRangeMatch[4]);

  return {
    ...normalizePair(nextStartMinutes, nextEndMinutes),
    sourceKind: 'range',
  };
}

export function createBusinessHoursDraft(rawValue?: string | null): TimeRangeDraft {
  const normalizedValue = normalizeRawValue(rawValue);
  const parsedRange = parseRawTimeRange(normalizedValue);

  if (parsedRange) {
    return {
      ...parsedRange,
      originalValue: normalizedValue,
    };
  }

  return {
    startMinutes: DEFAULT_BUSINESS_START,
    endMinutes: DEFAULT_BUSINESS_END,
    originalValue: normalizedValue,
    sourceKind: 'unspecified',
  };
}

export function createVisitTimeDraft(rawValue?: string | null): TimeRangeDraft {
  const normalizedValue = normalizeRawValue(rawValue);
  const parsedRange = parseRawTimeRange(normalizedValue);

  if (parsedRange) {
    return {
      ...parsedRange,
      originalValue: normalizedValue,
    };
  }

  return {
    startMinutes: DEFAULT_VISIT_START,
    endMinutes: DEFAULT_VISIT_END,
    originalValue: normalizedValue,
    sourceKind: 'unspecified',
  };
}

export function areTimeRangeDraftsEqual(left: TimeRangeDraft, right: TimeRangeDraft): boolean {
  return (
    left.startMinutes === right.startMinutes &&
    left.endMinutes === right.endMinutes &&
    left.sourceKind === right.sourceKind
  );
}

export function hasConfiguredTimeRangeValue(rawValue?: string | null): boolean {
  const trimmedValue = normalizeRawValue(rawValue).trim();

  return Boolean(trimmedValue) && trimmedValue !== '미정';
}

export function updateTimeRangeStart(
  draft: TimeRangeDraft,
  nextStartMinutes: number,
): TimeRangeDraft {
  const normalizedStart = clampMinutes(nextStartMinutes);
  const maxStartMinutes = Math.max(0, draft.endMinutes - TIME_RANGE_STEP);

  return {
    ...draft,
    sourceKind: 'range',
    startMinutes: Math.min(normalizedStart, maxStartMinutes),
  };
}

export function updateTimeRangeEnd(
  draft: TimeRangeDraft,
  nextEndMinutes: number,
): TimeRangeDraft {
  const normalizedEnd = clampMinutes(nextEndMinutes);
  const minEndMinutes = Math.min(DAY_END_MINUTES, draft.startMinutes + TIME_RANGE_STEP);

  return {
    ...draft,
    sourceKind: 'range',
    endMinutes: Math.max(normalizedEnd, minEndMinutes),
  };
}

export function serializeBusinessHours(draft: TimeRangeDraft): string {
  if (draft.startMinutes === 0 && draft.endMinutes === DAY_END_MINUTES) {
    return '항시 운영';
  }

  return `${formatClock(draft.startMinutes)} ~ ${formatClock(draft.endMinutes)}`;
}

export function serializeVisitTime(draft: TimeRangeDraft): string {
  return `${formatClock(draft.startMinutes)} ~ ${formatClock(draft.endMinutes)}`;
}

export function formatTimeRangeSummary(
  draft: TimeRangeDraft,
  allDayLabel?: string,
): string {
  if (draft.startMinutes === 0 && draft.endMinutes === DAY_END_MINUTES && allDayLabel) {
    return allDayLabel;
  }

  return `${formatClock(draft.startMinutes)} ~ ${formatClock(draft.endMinutes)}`;
}

export function formatTimeRangeSpan(draft: TimeRangeDraft): string {
  const durationMinutes = Math.max(0, draft.endMinutes - draft.startMinutes);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours && minutes) {
    return `${hours}시간 ${minutes}분`;
  }

  if (hours) {
    return `${hours}시간`;
  }

  return `${minutes}분`;
}
