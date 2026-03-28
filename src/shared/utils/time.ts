export function formatClock(minutes: number): string {
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const minute = (minutes % 60).toString().padStart(2, '0');

  return `${hour}:${minute}`;
}

export function formatDuration(start: number, end: number): string {
  return `${end - start}분`;
}
