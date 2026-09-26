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

/** Minuten van één event die binnen [from, to) vallen (ms). Dé gedeelde regel voor elk
 * "totaal over een periode" (tijdlijn-pills, wielbadges, verslag, trend, weekkaart): een
 * duur-event over de dag-/weekgrens (slaap 18:30 → 06:00) telt per periode alleen voor het
 * deel dat erin valt, een lopend event telt mee tot nu, en slechte data (eind vóór begin)
 * telt als 0 — nooit negatief. */
export function minutesWithin(event: EventRow, from: number, to: number, now = Date.now()) {
  const start = Math.max(new Date(event.start_at).getTime(), from);
  const end = Math.min(event.end_at ? new Date(event.end_at).getTime() : now, to);
  return Math.max(0, end - start) / 60000;
}

/** Of een event meetelt voor een periode. Keuze voor tellingen ("2× slaap"): een event telt
 * mee zodra het de periode raakt — het begint erin, of het is een duur-event dat erin
 * doorloopt. Een nacht over middernacht telt dus op beide dagen één keer mee, terwijl de
 * minuten via minutesWithin over de twee dagen verdeeld worden. */
export function overlapsPeriod(event: EventRow, from: number, to: number, now = Date.now()) {
  const start = new Date(event.start_at).getTime();
  if (start >= from && start < to) return true;
  return EVENT_TYPES[event.kind].isDuration && minutesWithin(event, from, to, now) > 0;
}

/** Minuten binnen [from, to) die door minstens één van de events gedekt worden: de UNIE
 * van de intervallen, geknipt op de periode. Twee overlappende slapen (bv. allebei de ouders
 * startten er een) tellen zo nooit dubbel. Een lopend event telt tot `now`. */
export function unionMinutesWithin(events: EventRow[], from: number, to: number, now = Date.now()) {
  const intervals = events
    .map((event) => {
      const start = Math.max(new Date(event.start_at).getTime(), from);
      const end = Math.min(event.end_at ? new Date(event.end_at).getTime() : now, to);
      return [start, end] as const;
    })
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);
  let total = 0;
  let runStart = 0;
  let runEnd = -Infinity;
  for (const [start, end] of intervals) {
    if (start > runEnd) {
      if (runEnd > runStart) total += runEnd - runStart;
      runStart = start;
      runEnd = end;
    } else if (end > runEnd) {
      runEnd = end;
    }
  }
  if (runEnd > runStart) total += runEnd - runStart;
  return total / 60000;
}

/** Minuten slaap binnen [from, to) in ms: een slaap over de dagrand telt per periode voor
 * het deel dat erin valt, een lopende slaap telt mee tot nu, overlappende slapen als unie. */
export function sleepMinutesBetween(events: EventRow[], from: number, to: number, now = Date.now()) {
  return unionMinutesWithin(
    events.filter((event) => event.kind === 'slaap'),
    from,
    to,
    now
  );
}

export function formatVolume(ml: number, unit: VolumeUnit): string {
  return `${ml} ${unit}`;
}
export const AMOUNT_KINDS = new Set<EventKind>([]);

// Let op, bestaande beperking (niet nieuw): deze lookup is plat op de variant-string
// zelf, niet op (kind, variant) samen — 'licht' betekent bij gedrag/zelfverwonding
// "lichte ernst" en bij prikkel "lichtprikkel", die toevallig hetzelfde Nederlandse
// woord zijn. Geen van de hieronder toegevoegde nieuwe variant-strings botst met een
// bestaande op die manier; als dat ooit wel gebeurt, moet dit een echte (kind,variant)-
// key worden.
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
    fladderen: t.eventOptions.stimmenFladderen,
    geluiden: t.eventOptions.stimmenGeluiden,
    wiegen: t.eventOptions.stimmenWiegen,
    geweigerd: t.eventOptions.etenGeweigerd,
    nieuw: t.eventOptions.etenNieuw,
    gegeten: t.eventOptions.etenGegeten,
    geslaagd: t.eventOptions.zindelijkheidGeslaagd,
    ongelukje: t.eventOptions.zindelijkheidOngelukje,
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

/** Per event-kind: hoeveel keer binnen [from, to) (ms), en (voor duur-events) hoeveel
 * minuten daarvan binnen die periode vallen — zie minutesWithin/overlapsPeriod. Geef ook
 * duur-events mee die vóór `from` begonnen (getEventsOverlappingRange in db/events.ts),
 * anders mist de ochtend het staartje van de nacht. */
export function computeKindTotals(
  events: EventRow[],
  from: number,
  to: number,
  now = Date.now()
): Map<EventKind, KindTotal> {
  const byKind = new Map<EventKind, EventRow[]>();
  for (const event of events) {
    if (!overlapsPeriod(event, from, to, now)) continue;
    const list = byKind.get(event.kind) ?? [];
    list.push(event);
    byKind.set(event.kind, list);
  }
  const totals = new Map<EventKind, KindTotal>();
  byKind.forEach((kindEvents, kind) => {
    totals.set(kind, {
      count: kindEvents.length,
      // Unie, geen som: een dubbele (overlappende) slaap telt maar één keer mee.
      minutes: EVENT_TYPES[kind].isDuration ? unionMinutesWithin(kindEvents, from, to, now) : 0,
    });
  });
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

/** Prikkelprofiel-waarden ('laag'/'hoog', 'opzoekend'/'vermijdend') in de taal van de app. */
export function sensoryThresholdLabel(value: string | null, t: Dictionary): string {
  if (!value) return '';
  return value === 'laag' ? t.eventDetail.sensoryThresholdLow : t.eventDetail.sensoryThresholdHigh;
}

export function sensoryResponseLabel(value: string | null, t: Dictionary): string {
  if (!value) return '';
  return value === 'opzoekend' ? t.eventDetail.sensoryResponseSeeking : t.eventDetail.sensoryResponseAvoiding;
}

/** De ABC-velden en het prikkelprofiel van een event als losse "Label: waarde"-regels, voor
 * het verslag/de PDF — alleen wat ingevuld is. */
export function formatAbcAndSensory(event: EventRow, t: Dictionary): string[] {
  return [
    event.antecedent ? `${t.eventDetail.antecedentLabel}: ${event.antecedent}` : null,
    event.location ? `${t.eventDetail.locationLabel}: ${event.location}` : null,
    event.what_helped ? `${t.eventDetail.whatHelpedLabel}: ${event.what_helped}` : null,
    event.sensory_threshold
      ? `${t.eventDetail.sensoryThresholdLabel}: ${sensoryThresholdLabel(event.sensory_threshold, t)}`
      : null,
    event.sensory_response
      ? `${t.eventDetail.sensoryResponseLabel}: ${sensoryResponseLabel(event.sensory_response, t)}`
      : null,
  ].filter((line): line is string => line !== null);
}
