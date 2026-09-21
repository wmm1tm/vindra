export function minutesSinceMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

export const TIME_SNAP_MINUTES = 5;

/** Rounds a time down/up to the nearest 5-minute mark (07:48 → 07:50, 03:02 → 03:00) so
 * timeline events land cleanly on the grid instead of a few minutes off. Overflow (e.g.
 * rounding 23:58 up) rolls into the next day via Date's own normalization. */
export function snapToNearestMinutes(date: Date, intervalMinutes: number = TIME_SNAP_MINUTES) {
  const snapped = new Date(date);
  const roundedMinutes = Math.round(minutesSinceMidnight(snapped) / intervalMinutes) * intervalMinutes;
  snapped.setHours(0, roundedMinutes, 0, 0);
  return snapped;
}

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
