import { EVENT_TYPES, type EventKind } from '@/constants/event-types';
import type { TempUnit, TimeFormat, VolumeUnit } from '@/db/child';
import type { EventRow } from '@/db/events';
import type { Dictionary } from '@/lib/i18n/translations';
import { formatTime } from '@/lib/time-options';

// Geen enkel Vindra-event-type heeft een ml-hoeveelheid (dat was Nuvo-specifiek voor
// fles/water) — leeg gelaten i.p.v. verwijderd, want wheel-arc.tsx (pure engine,
// ongewijzigd overgenomen) importeert deze set nog om te bepalen of het hoeveelheid-
// invoerveld getoond moet worden.
export function formatTemperature(celsius: number, unit: TempUnit = 'celsius'): string {
  if (unit === 'fahrenheit') {
    const fahrenheit = (celsius * 9) / 5 + 32;
    return `${Math.round(fahrenheit * 10) / 10}°F`;
  }
  return `${celsius}°C`;
}

export function formatVolume(ml: number, unit: VolumeUnit): string {
  return `${ml} ${unit}`;
}
export const AMOUNT_KINDS = new Set<EventKind>([]);

function variantLabels(t: Dictionary): Record<string, string> {
  return {
    licht: t.eventOptions.gedragLicht,
    matig: t.eventOptions.gedragMatig,
    heftig: t.eventOptions.gedragHeftig,
    geluid: t.eventOptions.prikkelGeluid,
    aanraking: t.eventOptions.prikkelAanraking,
    geur: t.eventOptions.prikkelGeur,
    anders: t.eventOptions.other,
    '1': t.eventOptions.stemming1,
    '2': t.eventOptions.stemming2,
    '3': t.eventOptions.stemming3,
    '4': t.eventOptions.stemming4,
    '5': t.eventOptions.stemming5,
  };
}

export function formatEventDetailLine(event: EventRow, t: Dictionary): string | null {
  if (event.variant !== null) return variantLabels(t)[event.variant] ?? event.variant;
  return null;
}

export function formatEventTimeLabel(event: EventRow, timeFormat: TimeFormat = '24h', t?: Dictionary): string {
  if (!event.end_at) return formatTime(new Date(event.start_at), timeFormat);
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const label = `${formatTime(start, timeFormat)} – ${formatTime(end, timeFormat)}`;
  const crossesDay = start.toDateString() !== end.toDateString();
  return crossesDay && t ? `${label} ${t.eventDetail.nextDaySuffix}` : label;
}

export function formatDurationMinutes(minutes: number, t: Dictionary): string {
  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}${t.formats.durationMinute}`;
  if (mins === 0) return `${hours}${t.formats.durationHour}`;
  return `${hours}${t.formats.durationHour}${String(mins).padStart(2, '0')}`;
}

const TIMELINE_NOTE_MAX_CHARS = 24;

function truncateForTimeline(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= TIMELINE_NOTE_MAX_CHARS) return trimmed;
  return `${trimmed.slice(0, TIMELINE_NOTE_MAX_CHARS - 1).trimEnd()}…`;
}

/** Korte, timeline-vriendelijke samenvatting per event: slaap toont de duur, de rest
 * valt terug op het variant-label of de notitie. `volumeUnit`/`tempUnit` zijn ongebruikt
 * voor Vindra's event-typen (geen ml-hoeveelheden/temperatuurmetingen) — blijven in de
 * signatuur staan omdat de ongewijzigde `event-capsule.tsx`/`event-dot.tsx` (pure engine)
 * ze nog meegeven bij elke aanroep. */
export function formatTimelineDetail(
  event: EventRow,
  _volumeUnit: VolumeUnit,
  _tempUnit: TempUnit,
  t: Dictionary
): string | null {
  if (event.kind === 'slaap') {
    const start = new Date(event.start_at).getTime();
    const end = event.end_at ? new Date(event.end_at).getTime() : Date.now();
    return formatDurationMinutes(Math.max(0, (end - start) / 60000), t);
  }
  return formatEventDetailLine(event, t) ?? (event.note ? truncateForTimeline(event.note) : null) ?? EVENT_TYPES[event.kind].label(t);
}

export interface KindTotal {
  count: number;
  minutes: number;
}

/** Per event-kind: hoeveel keer vandaag, en (voor duur-events) hoeveel minuten totaal. */
export function computeKindTotals(events: EventRow[]): Map<EventKind, KindTotal> {
  const totals = new Map<EventKind, KindTotal>();
  for (const event of events) {
    const current = totals.get(event.kind) ?? { count: 0, minutes: 0 };
    current.count += 1;
    if (EVENT_TYPES[event.kind].isDuration) {
      const end = event.end_at ? new Date(event.end_at).getTime() : Date.now();
      current.minutes += Math.max(0, (end - new Date(event.start_at).getTime()) / 60000);
    }
    totals.set(event.kind, current);
  }
  return totals;
}

export function formatKindBadge(total: KindTotal | undefined, isDuration: boolean, t: Dictionary): string | null {
  if (!total || total.count === 0) return null;
  return isDuration ? formatDurationMinutes(total.minutes, t) : String(total.count);
}

/** Nuvo's versie van deze functie liet het aantal stilzwijgend vallen zodra één lid een
 * duur-type was ("anyDuration ? duur : aantal") — onschuldig daar, want geen van Nuvo's
 * gegroepeerde banen mixt duur- en momentopname-typen. Vindra's "Overig"-baan doet dat
 * wél (slaap + positief moment), dus hier duur én aantal apart bijhouden en allebei
 * tonen i.p.v. het aantal te laten verdwijnen. */
export function formatGroupBadge(totals: Map<EventKind, KindTotal>, memberKinds: EventKind[], t: Dictionary): string | null {
  let durationMinutes = 0;
  let hasDuration = false;
  let nonDurationCount = 0;
  for (const kind of memberKinds) {
    const total = totals.get(kind);
    if (!total) continue;
    if (EVENT_TYPES[kind].isDuration) {
      hasDuration = true;
      durationMinutes += total.minutes;
    } else {
      nonDurationCount += total.count;
    }
  }
  const parts: string[] = [];
  if (hasDuration) parts.push(formatDurationMinutes(durationMinutes, t));
  if (nonDurationCount > 0) parts.push(`${nonDurationCount}×`);
  return parts.length > 0 ? parts.join(' · ') : null;
}
