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

/** Een duur-event mag nooit vóór (of op) zijn eigen start eindigen: de 5-minuten-snap van
 * "nu" kan net vóór een ongesnapte start (bv. van de widget) vallen. Dan wordt het einde
 * start + 1 minuut. */
export const MIN_DURATION_MS = 60_000;

export function safeEndTime(startAt: Date | string, proposedEnd: Date): Date {
  const start = new Date(startAt).getTime();
  return proposedEnd.getTime() > start ? proposedEnd : new Date(start + MIN_DURATION_MS);
}

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Wat er in een uur-invoerveld staat voor een uur (0-23): in 12-uursnotatie 12, 1…11. */
export function hourFieldValue(hours24: number, format: '12h' | '24h'): string {
  if (format === '24h') return String(hours24);
  return String(hours24 % 12 === 0 ? 12 : hours24 % 12);
}

/** Omgekeerde van hourFieldValue: getypt uur (+ AM/PM in 12-uursnotatie) → 0-23. */
export function parseHourField(text: string, format: '12h' | '24h', pm: boolean): number {
  const typed = Number(text) || 0;
  if (format === '24h') return Math.min(Math.max(typed, 0), 23);
  const hour12 = Math.min(Math.max(typed, 1), 12);
  return (hour12 % 12) + (pm ? 12 : 0);
}
