import { EVENT_TYPES, type EventKind } from '@/constants/event-types';
import type { EventRow } from '@/db/events';

/** Rekenwerk voor de trendgrafiek in het verslag (components/day/trend-chart.tsx): per week
 * het aantal keer dat een type gelogd is, over de laatste 4, 8 of 12 weken. Geen UI, geen
 * database. */

export const TREND_RANGES = [4, 8, 12] as const;
export type TrendRange = (typeof TREND_RANGES)[number];
/** Zoveel weken haalt het verslag in één keer op; 4 en 8 zijn daar een deel van. */
export const MAX_TREND_WEEKS = 12;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Via de kalender in plaats van ms, zodat een zomer-/wintertijdwissel geen uur scheelt. */
export function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Maandag 00:00 van de week waarin `date` valt. */
export function startOfWeek(date: Date) {
  const day = startOfDay(date);
  return addDays(day, -((day.getDay() + 6) % 7));
}

/** `range` weekbegins, oudste eerst, de laatste is deze week. */
export function trendWeekStarts(range: number, now = new Date()): Date[] {
  const thisWeek = startOfWeek(now);
  return Array.from({ length: range }, (_, i) => addDays(thisWeek, -7 * (range - 1 - i)));
}

/** Het begin van de periode die we voor de trend ophalen: de oudste van de 12 weken, met een
 * dag marge (zelfde als Nuvo, waar een slaap van de avond ervoor meetelt). */
export function trendFetchStart(now = new Date()) {
  return addDays(trendWeekStarts(MAX_TREND_WEEKS, now)[0], -1);
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
  /** Waarden van de weken die meetellen (vanaf de eerste log), oudste eerst. */
  activeValues: number[];
}

/** Vindra: aantal keer `kind` per week. Weken die helemaal vóór je eerste log vallen tellen
 * niet mee voor gemiddelde en vergelijking, anders lijkt het vanzelf te "stijgen". */
export function vindraTrendSeries(
  events: EventRow[],
  kind: EventKind,
  weeks: Date[],
  firstEventTime: number | null,
  now = new Date()
): TrendSeries {
  const values: number[] = [];
  const activeValues: number[] = [];
  for (const weekStart of weeks) {
    const from = weekStart.getTime();
    const to = addDays(weekStart, 7).getTime();
    const count = events.filter((event) => {
      const start = new Date(event.start_at).getTime();
      return event.kind === kind && start >= from && start < to;
    }).length;
    values.push(count);
    const active = firstEventTime !== null && to > firstEventTime && from <= now.getTime();
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
