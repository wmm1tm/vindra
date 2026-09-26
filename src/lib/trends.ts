import { EVENT_TYPES, type EventKind } from '@/constants/event-types';
import type { EventRow } from '@/db/events';
import { addDays, logicalDay, periodWindow, startOfCalendarDay } from '@/lib/day-window';

/** Rekenwerk voor de trendgrafiek in het verslag (components/day/trend-chart.tsx): per week
 * het aantal keer dat een type gelogd is, over de laatste 4, 8 of 12 weken. Geen UI, geen
 * database. Weken lopen van maandag dagstart-uur tot de maandag erna (lib/day-window.ts). */

export const TREND_RANGES = [4, 8, 12] as const;
export type TrendRange = (typeof TREND_RANGES)[number];
/** Zoveel weken haalt het verslag in één keer op; 4 en 8 zijn daar een deel van. */
export const MAX_TREND_WEEKS = 12;

/** Maandag (00:00-datum) van de week waarin logische dag `day` valt. */
export function startOfWeek(day: Date) {
  const date = startOfCalendarDay(day);
  return addDays(date, -((date.getDay() + 6) % 7));
}

/** `range` weekbegins (maandag-datums), oudste eerst, de laatste is deze week. */
export function trendWeekStarts(range: number, now: Date, dayStartHour: number): Date[] {
  const thisWeek = startOfWeek(logicalDay(now, dayStartHour));
  return Array.from({ length: range }, (_, i) => addDays(thisWeek, -7 * (range - 1 - i)));
}

/** Het begin van de periode die we voor de trend ophalen: de oudste van de 12 weken, met een
 * dag marge (zelfde als Nuvo, waar een slaap van de avond ervoor meetelt). */
export function trendFetchStart(now: Date, dayStartHour: number) {
  const oldestWeek = trendWeekStarts(MAX_TREND_WEEKS, now, dayStartHour)[0];
  return periodWindow(addDays(oldestWeek, -1), 1, dayStartHour).start;
}

/** De types die je in de trend kunt kiezen: momenttypen waar iets van gelogd is, het meest
 * gelogde eerst. Duur-types (slaap) niet: daar zegt een aantal weinig. */
export function vindraTrendKinds(events: EventRow[]): EventKind[] {
  const counts = new Map<EventKind, number>();
  for (const event of events) {
    if (EVENT_TYPES[event.kind].isDuration) continue;
    counts.set(event.kind, (counts.get(event.kind) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([kind]) => kind);
}

export interface TrendSeries {
  /** Eén waarde per week (0 voor weken vóór de eerste log). */
  values: number[];
  /** Waarden van de weken die meetellen voor gemiddelde en vergelijking: vanaf de eerste log
   * en alleen AFGELOPEN weken — de lopende (halve) week niet. Oudste eerst. */
  activeValues: number[];
}

/** Vindra: aantal keer `kind` per week. Weken die helemaal vóór je eerste log vallen tellen
 * niet mee voor gemiddelde en vergelijking (anders lijkt het vanzelf te "stijgen"), en de
 * lopende week ook niet: een halve week lijkt anders een daling. */
export function vindraTrendSeries(
  events: EventRow[],
  kind: EventKind,
  weeks: Date[],
  firstEventTime: number | null,
  now: Date,
  dayStartHour: number
): TrendSeries {
  const values: number[] = [];
  const activeValues: number[] = [];
  for (const weekStart of weeks) {
    const week = periodWindow(weekStart, 7, dayStartHour);
    const from = week.start.getTime();
    const to = week.end.getTime();
    const count = events.filter((event) => {
      const start = new Date(event.start_at).getTime();
      return event.kind === kind && start >= from && start < to;
    }).length;
    values.push(count);
    const active = firstEventTime !== null && to > firstEventTime && to <= now.getTime();
    if (active) activeValues.push(count);
  }
  return { values, activeValues };
}

export function averageOf(values: number[]) {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export type TrendComparison =
  | { kind: 'lower' | 'higher'; percent: number; weeks: number }
  | { kind: 'same'; weeks: number }
  | { kind: 'notEnough' };

/** Neutrale vergelijking: de eerste helft van de getelde weken tegen de tweede helft. Pas
 * vanaf 4 weken, anders zegt het niets. */
export function compareHalves(activeValues: number[]): TrendComparison {
  if (activeValues.length < 4) return { kind: 'notEnough' };
  const half = Math.floor(activeValues.length / 2);
  const earlier = averageOf(activeValues.slice(0, half));
  const later = averageOf(activeValues.slice(-half));
  if (earlier <= 0) return { kind: 'notEnough' };
  const percent = Math.round(((later - earlier) / earlier) * 100);
  if (percent === 0) return { kind: 'same', weeks: half };
  return { kind: percent < 0 ? 'lower' : 'higher', percent: Math.abs(percent), weeks: half };
}
