import { dateKey } from '@/lib/time';

/** Eén dagvenster voor de hele app (tijdlijn, pills, wielbadges, widget, verslag, trend,
 * weekkaart, PDF, dagbeoordeling, "dag wissen"). Een "logische dag" loopt van het ingestelde
 * dagstart-uur tot hetzelfde uur de volgende kalenderdag. Alles gaat via kalenderrekenen
 * (`new Date(y, m, d + 1, h)`), nooit via `+ 24 uur`: op de dag van de zomer-/wintertijd-
 * wissel is een dag 23 of 25 uur lang.
 *
 * Een logische dag wordt overal aangeduid met 00:00 (lokaal) van de kalenderdatum waar hij
 * naar genoemd is: bij dagstart 06:00 hoort dinsdag 03:00 nog bij "maandag". */

export interface TimeWindow {
  start: Date;
  end: Date;
}

/** Kalenderdag + n dagen, 00:00 lokaal. Via de kalender, zodat een tijdwissel geen uur scheelt. */
export function addDays(day: Date, n: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + n);
}

/** 00:00 lokaal van de kalenderdag van `date`. */
export function startOfCalendarDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** De logische dag waar `now` bij hoort (00:00 van die kalenderdatum): vóór het dagstart-uur
 * is dat gisteren. */
export function logicalDay(now: Date, dayStartHour: number): Date {
  const day = startOfCalendarDay(now);
  return now.getHours() < dayStartHour ? addDays(day, -1) : day;
}

/** Het venster [start, end) van een logische dag. `day` = 00:00 van de kalenderdatum (zie
 * logicalDay); een willekeurig tijdstip op die datum mag ook, alleen de datum telt. */
export function dayWindow(day: Date, dayStartHour: number): TimeWindow {
  return {
    start: new Date(day.getFullYear(), day.getMonth(), day.getDate(), dayStartHour),
    end: new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, dayStartHour),
  };
}

/** Het venster van `days` opeenvolgende logische dagen vanaf `firstDay` (bv. een week). */
export function periodWindow(firstDay: Date, days: number, dayStartHour: number): TimeWindow {
  return {
    start: new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate(), dayStartHour),
    end: new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + days, dayStartHour),
  };
}

/** "JJJJ-MM-DD" van de logische dag waar `date` bij hoort — de sleutel voor dagbeoordelingen
 * en voor groeperen per dag in verslag/PDF. */
export function logicalDateKey(date: Date, dayStartHour: number): string {
  return dateKey(logicalDay(date, dayStartHour));
}

/** Of twee logische dagen (00:00-datums) dezelfde zijn. */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Lengte van een venster in uren (23, 24 of 25 op een gewone dag; meer bij een periode). */
export function windowHours(window: TimeWindow): number {
  return (window.end.getTime() - window.start.getTime()) / 3_600_000;
}

/** Minuten tussen het begin van het venster en `date` (kan negatief zijn of voorbij het eind
 * liggen). Echte verstreken tijd, dus op een DST-dag klopt de positie op de tijdlijn. */
export function minutesFromWindowStart(date: Date, windowStart: Date): number {
  return (date.getTime() - windowStart.getTime()) / 60_000;
}

/** Het tijdstip binnen de logische dag `day` met deze kloktijd: bij dagstart 06:00 is "03:00"
 * op logische maandag dus dinsdag 03:00. Voor handmatige tijdinvoer. */
export function dateAtClockTime(day: Date, hours: number, minutes: number, dayStartHour: number): Date {
  const dayOffset = hours < dayStartHour ? 1 : 0;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + dayOffset, hours, minutes);
}

/** Aantal logische dagen tussen twee 00:00-datums (b − a), via de kalender. */
export function daysBetween(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}
