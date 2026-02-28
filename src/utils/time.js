export const MINUTES_IN_DAY = 24 * 60;

export function convertTimeStringToMinutes(timeText) {
  if (typeof timeText !== 'string') return null;
  const matchedTimeParts = timeText.match(/^(\d{2}):(\d{2})$/);
  if (!matchedTimeParts) return null;

  const hourValue = Number(matchedTimeParts[1]);
  const minuteValue = Number(matchedTimeParts[2]);

  if (!Number.isInteger(hourValue) || !Number.isInteger(minuteValue)) return null;
  if (hourValue < 0 || hourValue > 24) return null;
  if (minuteValue < 0 || minuteValue > 59) return null;
  if (hourValue === 24 && minuteValue !== 0) return null;

  return hourValue * 60 + minuteValue;
}

export function convertMinutesToTimelinePercent(totalMinutes) {
  if (typeof totalMinutes !== 'number' || Number.isNaN(totalMinutes)) return 0;
  const normalizedMinutes = Math.max(0, Math.min(MINUTES_IN_DAY, totalMinutes));
  return (normalizedMinutes / MINUTES_IN_DAY) * 100;
}

export function normalizeOpeningHours(openingHours = []) {
  if (!Array.isArray(openingHours)) return [];

  return openingHours.flatMap((timeRangeItem, rangeIndex) => {
    if (!timeRangeItem) return [];
    const startMinutes = convertTimeStringToMinutes(timeRangeItem.start);
    const endMinutes = convertTimeStringToMinutes(timeRangeItem.end);
    if (startMinutes === null || endMinutes === null) return [];
    if (startMinutes === endMinutes) return [];

    if (startMinutes < endMinutes) {
      return [
        {
          id: `${rangeIndex}-main`,
          start: timeRangeItem.start,
          end: timeRangeItem.end,
          startMinutes,
          endMinutes,
        },
      ];
    }

    return [
      {
        id: `${rangeIndex}-late`,
        start: timeRangeItem.start,
        end: '24:00',
        startMinutes,
        endMinutes: MINUTES_IN_DAY,
      },
      {
        id: `${rangeIndex}-early`,
        start: '00:00',
        end: timeRangeItem.end,
        startMinutes: 0,
        endMinutes,
      },
    ];
  });
}
