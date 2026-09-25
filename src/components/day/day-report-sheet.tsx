import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { TrendChart } from '@/components/day/trend-chart';
import { PaywallScreen } from '@/components/paywall/paywall-screen';
import { EventIcon } from '@/components/ui/event-icon';
import { EVENT_TYPES, getEventVisual, type EventKind } from '@/constants/event-types';
import { TIMELINE_LANES } from '@/constants/timeline-lanes';
import { getDayRating } from '@/db/day-log';
import { getEventsForRange, getFirstEventTime, type EventRow } from '@/db/events';
import { useActiveChild } from '@/lib/active-child-context';
import { formatDurationMinutes, formatEventDetailLine, formatEventTimeLabel, formatTemperature, formatVolume } from '@/lib/event-summary';
import { useI18n } from '@/lib/i18n';
import type { Dictionary } from '@/lib/i18n/translations';
import { usePreferences } from '@/lib/preferences-context';
import { usePurchases } from '@/lib/purchases-context';
import { dateKey } from '@/lib/time';
import { trendFetchStart } from '@/lib/trends';
import type { TempUnit, TimeFormat, VolumeUnit } from '@/db/child';

const SEVERITY_VARIANTS = ['licht', 'matig', 'heftig'] as const;
// De twee event-typen die de ernstschaal delen (zelfde variant-id's/labels, zie
// SECOND_LEVEL_OPTIONS in event-types.ts) — samen de "Gedrag & veiligheid"-lane uit
// timeline-lanes.ts, op weglopen na (dat heeft geen variant, zie computeWeglopenTotal).
const SEVERITY_KINDS = ['gedrag', 'zelfverwonding'] as const;
const WEEK_DAYS = 7;

type Mode = 'day' | 'week' | 'trend';
type SeverityKind = (typeof SEVERITY_KINDS)[number];

interface DayReportSheetProps {
  selectedDate: Date;
  dateLabel: string;
  rating: number | null;
  events: EventRow[];
  onClose: () => void;
}

interface Totals {
  count: number;
  minutes: number;
}

interface DayRatingEntry {
  dateKey: string;
  label: string;
  rating: number | null;
}

interface SeverityStat {
  kind: SeverityKind;
  variant: (typeof SEVERITY_VARIANTS)[number];
  count: number;
}

interface DayGroup {
  key: string;
  label: string;
  events: EventRow[];
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatShortDay(date: Date, localeTag: string) {
  return new Intl.DateTimeFormat(localeTag, { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
}

function formatWeekRangeLabel(weekStart: Date, weekEndInclusive: Date, localeTag: string) {
  const start = new Intl.DateTimeFormat(localeTag, { day: 'numeric', month: 'short' }).format(weekStart);
  const end = new Intl.DateTimeFormat(localeTag, { day: 'numeric', month: 'short' }).format(weekEndInclusive);
  return `${start} – ${end}`;
}

/** Groepeert een al-gesorteerde eventlijst per dag, voor de weekmodus-lijst op het scherm
 * — zelfde groepering als de PDF-export al langer toepast op zijn eigen tabel (zie
 * `grouped` in buildReportHtml hieronder), nu ook zichtbaar in de app zelf i.p.v. alleen
 * een weekdag-achtervoegsel per rij. */
function groupEventsByDay(events: EventRow[], localeTag: string): DayGroup[] {
  const groups = new Map<string, EventRow[]>();
  for (const event of events) {
    const key = dateKey(new Date(event.start_at));
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }
  return Array.from(groups.entries()).map(([key, dayEvents]) => ({
    key,
    label: formatShortDay(new Date(`${key}T00:00:00`), localeTag),
    events: dayEvents,
  }));
}

function computeTotals(events: EventRow[]): Map<EventKind, Totals> {
  const totals = new Map<EventKind, Totals>();

  for (const event of events) {
    // Gedrag, zelfverwonding, weglopen en slaap krijgen elk hun eigen prominente rij
    // bovenaan (computeSeverityStats/computeWeglopenTotal/computeSleepTotal) i.p.v.
    // tussen de kleinere "overige" chips verderop.
    if (event.kind === 'gedrag' || event.kind === 'slaap' || event.kind === 'zelfverwonding' || event.kind === 'weglopen') continue;
    const current = totals.get(event.kind) ?? { count: 0, minutes: 0 };
    current.count += 1;
    totals.set(event.kind, current);
  }

  return totals;
}

/** Volgorde van de resterende (niet-prominente) totalen volgt de tijdlijn-lanes i.p.v.
 * willekeurige Map-insertievolgorde — zelfde groepering als de tijdlijn zelf, zodat een
 * ouder die daar al aan gewend is dit rapport net zo makkelijk kan scannen. Elke kind die
 * al een eigen prominente rij heeft (gedrag/zelfverwonding/weglopen/slaap) staat sowieso
 * nooit in `totals`, dus die worden hier vanzelf overgeslagen. */
function orderedTotals(totals: Map<EventKind, Totals>): [EventKind, Totals][] {
  const entries: [EventKind, Totals][] = [];
  for (const lane of TIMELINE_LANES) {
    for (const kind of lane.kinds) {
      const total = totals.get(kind);
      if (total) entries.push([kind, total]);
    }
  }
  return entries;
}

/** Gedrag én zelfverwonding delen dezelfde ernstschaal (licht/matig/heftig, zie
 * SECOND_LEVEL_OPTIONS in event-types.ts) en horen sinds de lane-herindeling (zie
 * timeline-lanes.ts, 2026-09-22) bij dezelfde "Gedrag & veiligheid"-groep — beide krijgen
 * daarom een prominente uitsplitsing per ernst i.p.v. alleen een totaalaantal, net als
 * Nuvo's voeding-uitsplitsing. `getEventVisual` geeft elk kind automatisch zijn eigen
 * icoon + kleurtoon (bv. bandage/rozig voor zelfverwonding vs. report-problem/rood voor
 * gedrag), dus de twee blijven ook zonder expliciete sub-koppen visueel uit elkaar te
 * houden. */
function computeSeverityStats(events: EventRow[]): SeverityStat[] {
  const stats: SeverityStat[] = [];
  for (const kind of SEVERITY_KINDS) {
    const kindEvents = events.filter((event) => event.kind === kind);
    for (const variant of SEVERITY_VARIANTS) {
      const count = kindEvents.filter((event) => event.variant === variant).length;
      if (count > 0) stats.push({ kind, variant, count });
    }
  }
  return stats;
}

function severityVariantLabel(variant: string, t: Dictionary): string {
  if (variant === 'licht') return t.eventOptions.gedragLicht;
  if (variant === 'matig') return t.eventOptions.gedragMatig;
  return t.eventOptions.gedragHeftig;
}

/** Weglopen deelt de "Gedrag & veiligheid"-groep met gedrag/zelfverwonding maar heeft
 * geen ernst-variant (`hasSecondLevel: false`) — dus alleen een plat totaal, geen
 * uitsplitsing. */
function computeWeglopenTotal(events: EventRow[]): number {
  return events.filter((event) => event.kind === 'weglopen').length;
}

/** Slaap krijgt, net als gedrag, een eigen prominente totaalregel bovenaan i.p.v. tussen
 * de kleinere "overige" chips verderop — een lopende (nog niet afgesloten) sessie telt
 * mee tot nu, net als computeKindTotals in lib/event-summary.ts. */
function computeSleepTotal(events: EventRow[]): Totals | null {
  const sleepEvents = events.filter((event) => event.kind === 'slaap');
  if (sleepEvents.length === 0) return null;
  const minutes = sleepEvents.reduce((sum, event) => {
    const end = event.end_at ? new Date(event.end_at).getTime() : Date.now();
    return sum + Math.max(0, (end - new Date(event.start_at).getTime()) / 60000);
  }, 0);
  return { count: sleepEvents.length, minutes };
}

function formatEventExtras(event: EventRow, tempUnit: TempUnit, volumeUnit: VolumeUnit, t: Dictionary) {
  const detail = formatEventDetailLine(event, t);
  return [
    detail,
    event.amount_ml !== null ? formatVolume(event.amount_ml, volumeUnit) : null,
    event.temperature_c !== null ? formatTemperature(event.temperature_c, tempUnit) : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

function buildReportHtml(
  periodLabel: string,
  rating: number | null,
  ratingsRow: DayRatingEntry[] | null,
  severityStats: SeverityStat[],
  weglopenTotal: number,
  sleepTotal: Totals | null,
  totals: Map<EventKind, Totals>,
  sorted: EventRow[],
  timeFormat: TimeFormat,
  tempUnit: TempUnit,
  volumeUnit: VolumeUnit,
  grouped: boolean,
  t: Dictionary,
  localeTag: string
) {
  const rowHtml = (event: EventRow) => {
    const type = EVENT_TYPES[event.kind];
    return `<tr>
      <td style="color:${type.color};font-weight:600;">${type.label(t)}</td>
      <td>${formatEventTimeLabel(event, timeFormat, t)}</td>
      <td>${formatEventExtras(event, tempUnit, volumeUnit, t)}</td>
      <td>${event.note ?? ''}</td>
    </tr>`;
  };

  let rows: string;
  if (grouped) {
    const groups = new Map<string, EventRow[]>();
    for (const event of sorted) {
      const key = dateKey(new Date(event.start_at));
      const list = groups.get(key) ?? [];
      list.push(event);
      groups.set(key, list);
    }
    rows = Array.from(groups.entries())
      .map(([key, dayEvents]) => {
        const header = formatShortDay(new Date(`${key}T00:00:00`), localeTag);
        return `<tr><td colspan="4" style="padding-top:12px; font-weight:700; border-bottom:1px solid #ccc;">${header}</td></tr>${dayEvents
          .map(rowHtml)
          .join('')}`;
      })
      .join('');
  } else {
    rows = sorted.map(rowHtml).join('');
  }

  const severityRows = severityStats
    .map((stat) => `<li>${EVENT_TYPES[stat.kind].label(t)} – ${severityVariantLabel(stat.variant, t)}: ${stat.count}×</li>`)
    .join('');
  const weglopenRow = weglopenTotal > 0 ? `<li>${EVENT_TYPES.weglopen.label(t)}: ${weglopenTotal}×</li>` : '';
  const behaviorRows = severityRows + weglopenRow;

  const totalRows = orderedTotals(totals)
    .map(([kind, total]) => {
      const type = EVENT_TYPES[kind];
      return `<li>${type.label(t)}: ${total.minutes > 0 ? formatDurationMinutes(total.minutes, t) : `${total.count}×`}</li>`;
    })
    .join('');

  const ratingsHtml = ratingsRow
    ? `<h3>${t.dayReport.dayRatings}</h3><ul>${ratingsRow
        .map((entry) => `<li>${entry.label}: ${entry.rating !== null ? `${entry.rating}/10` : '–'}</li>`)
        .join('')}</ul>`
    : '';

  return `<html><head><meta charset="utf-8" /></head>
    <body style="font-family: -apple-system, sans-serif; padding: 24px; color: #12171C;">
      <h1 style="margin-bottom: 0;">${grouped ? t.dayReport.weekReport : t.dayReport.dayReport}</h1>
      <p style="color:#555; margin-top:4px;">${periodLabel}${rating !== null ? t.dayReport.ratingSuffix(rating) : ''}</p>
      ${ratingsHtml}
      ${behaviorRows ? `<h3>${t.dayReport.behavior}</h3><ul>${behaviorRows}</ul>` : ''}
      ${sleepTotal ? `<h3>${EVENT_TYPES.slaap.label(t)}</h3><p>${formatDurationMinutes(sleepTotal.minutes, t)} (${sleepTotal.count}×)</p>` : ''}
      ${totalRows ? `<h3>${t.dayReport.other}</h3><ul>${totalRows}</ul>` : ''}
      <h3>${t.dayReport.overview}</h3>
      <table style="width:100%; border-collapse: collapse;">
        <thead><tr style="text-align:left; border-bottom: 1px solid #ccc;">
          <th>${t.dayReport.columnType}</th><th>${t.dayReport.columnTime}</th><th>${t.dayReport.columnDetails}</th><th>${t.dayReport.columnNote}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`;
}

export function DayReportSheet({ selectedDate, dateLabel, rating, events, onClose }: DayReportSheetProps) {
  const db = useSQLiteContext();
  const { timeFormat, tempUnit, volumeUnit } = usePreferences();
  const { t, localeTag } = useI18n();
  const { childId } = useActiveChild();
  const { status: purchasesStatus } = usePurchases();
  const [mode, setMode] = useState<Mode>('day');
  const [weekEvents, setWeekEvents] = useState<EventRow[]>([]);
  const [weekRatings, setWeekRatings] = useState<DayRatingEntry[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [trendEvents, setTrendEvents] = useState<EventRow[]>([]);
  const [firstEventTime, setFirstEventTime] = useState<number | null>(null);

  const weekStart = new Date(startOfDay(selectedDate).getTime() - (WEEK_DAYS - 1) * 24 * 60 * 60 * 1000);
  const weekEnd = new Date(startOfDay(selectedDate).getTime() + 24 * 60 * 60 * 1000);
  const weekRangeLabel = formatWeekRangeLabel(weekStart, startOfDay(selectedDate), localeTag);

  useEffect(() => {
    if (mode !== 'week' || !childId) return;

    getEventsForRange(db, childId, weekStart, weekEnd).then(setWeekEvents);

    const dayDates = Array.from({ length: WEEK_DAYS }, (_, i) => new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000));
    Promise.all(dayDates.map((date) => getDayRating(db, childId, dateKey(date)))).then((ratings) => {
      setWeekRatings(
        dayDates.map((date, i) => ({ dateKey: dateKey(date), label: formatShortDay(date, localeTag), rating: ratings[i] }))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, db, childId, weekStart.getTime(), weekEnd.getTime(), localeTag]);

  // Trend: de laatste 12 weken in één keer (4 en 8 zijn daar een deel van), los van de
  // gekozen dag, plus de eerste log zodat weken daarvoor niet meetellen.
  useEffect(() => {
    if (mode !== 'trend' || !childId) return;
    const now = new Date();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    getEventsForRange(db, childId, trendFetchStart(now), to).then(setTrendEvents);
    getFirstEventTime(db, childId).then(setFirstEventTime);
  }, [mode, db, childId]);

  const displayedEvents = mode === 'week' ? weekEvents : events;
  const totals = computeTotals(displayedEvents);
  const sorted = [...displayedEvents].sort((a, b) => a.start_at.localeCompare(b.start_at));
  const severityStats = computeSeverityStats(displayedEvents);
  const weglopenTotal = computeWeglopenTotal(displayedEvents);
  const sleepTotal = computeSleepTotal(displayedEvents);
  const periodLabel = mode === 'trend' ? t.trends.subtitle : mode === 'week' ? weekRangeLabel : dateLabel;
  const headerRating = mode === 'day' ? rating : null;
  const dayGroups = mode === 'week' ? groupEventsByDay(sorted, localeTag) : null;

  const handleExport = async () => {
    if (purchasesStatus !== 'entitled') {
      setShowPaywall(true);
      return;
    }
    const html = buildReportHtml(
      periodLabel,
      headerRating,
      mode === 'week' ? weekRatings : null,
      severityStats,
      weglopenTotal,
      sleepTotal,
      totals,
      sorted,
      timeFormat,
      tempUnit,
      volumeUnit,
      mode === 'week',
      t,
      localeTag
    );
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    }
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === 'trend' ? t.trends.title : mode === 'week' ? t.dayReport.weekReport : t.dayReport.dayReport}
            </Text>
            {headerRating !== null && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingBadgeLabel}>{headerRating}/10</Text>
              </View>
            )}
          </View>
          <Text style={styles.dateLabel}>{periodLabel}</Text>

          <View style={styles.modeToggle}>
            <Pressable
              style={[styles.modeOption, mode === 'day' && styles.modeOptionActive]}
              onPress={() => setMode('day')}>
              <Text style={[styles.modeLabel, mode === 'day' && styles.modeLabelActive]}>{t.dayReport.dayMode}</Text>
            </Pressable>
            <Pressable
              style={[styles.modeOption, mode === 'week' && styles.modeOptionActive]}
              onPress={() => setMode('week')}>
              <Text style={[styles.modeLabel, mode === 'week' && styles.modeLabelActive]}>{t.dayReport.weekMode}</Text>
            </Pressable>
            <Pressable
              style={[styles.modeOption, mode === 'trend' && styles.modeOptionActive]}
              onPress={() => setMode('trend')}>
              <Text style={[styles.modeLabel, mode === 'trend' && styles.modeLabelActive]}>{t.dayReport.trendMode}</Text>
            </Pressable>
          </View>

          {mode === 'trend' && (
            <TrendChart
              events={trendEvents}
              firstEventTime={firstEventTime}
              entitled={purchasesStatus === 'entitled'}
              onUnlock={() => setShowPaywall(true)}
            />
          )}

          {mode === 'week' && weekRatings.length > 0 && (
            <View style={styles.weekRatingsRow}>
              {weekRatings.map((entry) => (
                <View key={entry.dateKey} style={styles.weekRatingChip}>
                  <Text style={styles.weekRatingDay}>{entry.label.split(' ')[0]}</Text>
                  <Text style={styles.weekRatingValue}>{entry.rating !== null ? entry.rating : '–'}</Text>
                </View>
              ))}
            </View>
          )}

          {mode !== 'trend' && (severityStats.length > 0 || weglopenTotal > 0 || sleepTotal) && (
            <View style={styles.drinkStats}>
              {severityStats.map((stat) => {
                const visual = getEventVisual(stat.kind, stat.variant);
                return (
                  <View key={`${stat.kind}-${stat.variant}`} style={styles.drinkStatRow}>
                    <View style={[styles.drinkStatIcon, { backgroundColor: visual.color }]}>
                      <EventIcon name={visual.icon} set={visual.iconSet} size={13} color="#12171C" />
                    </View>
                    <Text style={styles.drinkStatLabel}>
                      {EVENT_TYPES[stat.kind].label(t)} – {severityVariantLabel(stat.variant, t)}
                    </Text>
                    <Text style={styles.drinkStatValue}>{stat.count}×</Text>
                  </View>
                );
              })}
              {weglopenTotal > 0 && (
                <View style={styles.drinkStatRow}>
                  <View style={[styles.drinkStatIcon, { backgroundColor: EVENT_TYPES.weglopen.color }]}>
                    <EventIcon name={EVENT_TYPES.weglopen.icon} set={EVENT_TYPES.weglopen.iconSet} size={13} color="#12171C" />
                  </View>
                  <Text style={styles.drinkStatLabel}>{EVENT_TYPES.weglopen.label(t)}</Text>
                  <Text style={styles.drinkStatValue}>{weglopenTotal}×</Text>
                </View>
              )}
              {sleepTotal && (
                <View style={styles.drinkStatRow}>
                  <View style={[styles.drinkStatIcon, { backgroundColor: EVENT_TYPES.slaap.color }]}>
                    <EventIcon name={EVENT_TYPES.slaap.icon} set={EVENT_TYPES.slaap.iconSet} size={13} color="#12171C" />
                  </View>
                  <Text style={styles.drinkStatLabel}>{EVENT_TYPES.slaap.label(t)}</Text>
                  <Text style={styles.drinkStatValue}>{formatDurationMinutes(sleepTotal.minutes, t)}</Text>
                </View>
              )}
            </View>
          )}

          {mode !== 'trend' && totals.size > 0 && (
            <View style={styles.totalsRow}>
              {orderedTotals(totals).map(([kind, total]) => {
                const type = EVENT_TYPES[kind];
                return (
                  <View key={kind} style={[styles.totalChip, { backgroundColor: type.color }]}>
                    <EventIcon name={type.icon} set={type.iconSet} size={13} color="#12171C" />
                    <Text style={styles.totalChipLabel}>
                      {type.label(t)}: {total.minutes > 0 ? formatDurationMinutes(total.minutes, t) : `${total.count}×`}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {mode !== 'trend' && (
            <ScrollView style={styles.list}>
              {sorted.length === 0 && (
                <Text style={styles.empty}>{mode === 'week' ? t.dayReport.emptyWeek : t.dayReport.emptyDay}</Text>
              )}
              {dayGroups
                ? dayGroups.map((group) => (
                    <View key={group.key}>
                      <Text style={styles.dayGroupHeader}>{group.label}</Text>
                      {group.events.map((event) => (
                        <EventRowItem key={event.id} event={event} t={t} timeFormat={timeFormat} tempUnit={tempUnit} volumeUnit={volumeUnit} />
                      ))}
                    </View>
                  ))
                : sorted.map((event) => (
                    <EventRowItem key={event.id} event={event} t={t} timeFormat={timeFormat} tempUnit={tempUnit} volumeUnit={volumeUnit} />
                  ))}
            </ScrollView>
          )}

          <View style={styles.actionsRow}>
            <Pressable onPress={onClose}>
              <Text style={styles.closeLabel}>{t.common.close}</Text>
            </Pressable>
            {mode !== 'trend' && (
              <Pressable style={styles.exportButton} onPress={handleExport}>
                <MaterialCommunityIcons name="file-pdf-box" size={16} color="#12171C" />
                <Text style={styles.exportLabel}>{t.dayReport.export}</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
      <Modal visible={showPaywall} animationType="slide" onRequestClose={() => setShowPaywall(false)}>
        <PaywallScreen onClose={() => setShowPaywall(false)} />
      </Modal>
    </Modal>
  );
}

/** Eén rij in de chronologische lijst — losgetrokken uit de render zelf zodat 'm zowel
 * vanuit de platte dagmodus-lijst als vanuit elke dag-sectie in weekmodus (zie
 * groupEventsByDay) aangeroepen kan worden zonder duplicatie. Geen weekdag-achtervoegsel
 * meer op de rij zelf — dat is nu de dag-sectiekop erboven (weekmodus) of vanzelfsprekend
 * (dagmodus, één dag). */
function EventRowItem({
  event,
  t,
  timeFormat,
  tempUnit,
  volumeUnit,
}: {
  event: EventRow;
  t: Dictionary;
  timeFormat: TimeFormat;
  tempUnit: TempUnit;
  volumeUnit: VolumeUnit;
}) {
  const type = EVENT_TYPES[event.kind];
  const extras = formatEventExtras(event, tempUnit, volumeUnit, t);
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: type.color }]}>
        <EventIcon name={type.icon} set={type.iconSet} size={14} color="#12171C" />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>
          {type.label(t)} · {formatEventTimeLabel(event, timeFormat, t)}
        </Text>
        {extras.length > 0 && <Text style={styles.rowDetail}>{extras}</Text>}
        {event.note && <Text style={styles.rowNote}>{event.note}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 320,
    maxHeight: '78%',
    backgroundColor: '#1C252A',
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#F1EEE7',
    fontSize: 18,
    fontWeight: '700',
  },
  ratingBadge: {
    backgroundColor: '#D6A866',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ratingBadgeLabel: {
    color: '#12171C',
    fontSize: 12,
    fontWeight: '700',
  },
  dateLabel: {
    color: '#AAB4B6',
    fontSize: 13,
    marginBottom: 8,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#12171C',
    borderRadius: 10,
    padding: 3,
    marginBottom: 10,
  },
  modeOption: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  modeOptionActive: {
    backgroundColor: '#D6A866',
  },
  modeLabel: {
    color: '#AAB4B6',
    fontSize: 13,
    fontWeight: '600',
  },
  modeLabelActive: {
    color: '#12171C',
  },
  weekRatingsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  weekRatingChip: {
    alignItems: 'center',
    backgroundColor: '#12171C',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 38,
  },
  weekRatingDay: {
    color: '#AAB4B6',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  weekRatingValue: {
    color: '#F1EEE7',
    fontSize: 13,
    fontWeight: '700',
  },
  drinkStats: {
    gap: 4,
    marginBottom: 10,
  },
  drinkStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drinkStatIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drinkStatLabel: {
    color: '#F1EEE7',
    fontSize: 13,
    flex: 1,
  },
  drinkStatValue: {
    color: '#D6A866',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  totalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  totalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  totalChipLabel: {
    color: '#12171C',
    fontSize: 11,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  dayGroupHeader: {
    color: '#AAB4B6',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 2,
  },
  empty: {
    color: '#AAB4B6',
    fontSize: 13,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  rowIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: '#F1EEE7',
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  rowDetail: {
    color: '#AAB4B6',
    fontSize: 12,
    marginTop: 1,
  },
  rowNote: {
    color: '#F1EEE7',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  closeLabel: {
    color: '#AAB4B6',
    fontSize: 14,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D6A866',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exportLabel: {
    color: '#12171C',
    fontWeight: '600',
    fontSize: 13,
  },
});
