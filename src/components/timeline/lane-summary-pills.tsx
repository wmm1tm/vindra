import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { TIMELINE_HORIZONTAL_PADDING, TIMELINE_LANES, type LaneId } from '@/constants/timeline-lanes';
import { getEventsForRange, type EventRow } from '@/db/events';
import { useActiveChild } from '@/lib/active-child-context';
import { lighten, withAlpha } from '@/lib/color';
import { computeKindTotals, formatGroupBadge } from '@/lib/event-summary';
import { useI18n } from '@/lib/i18n';
import type { Dictionary } from '@/lib/i18n/translations';
import { usePreferences } from '@/lib/preferences-context';

interface LaneSummaryPillsProps {
  selectedDate: Date;
  /** Verhoogd door de ouder bij elke wijziging die de tellingen kan raken — zelfde token
   * als de wiel-badges gebruiken (app/index.tsx), zodat beide gelijk oplopen. */
  badgeRefreshToken: number;
}

const SUMMARY_FORMATTERS: Record<LaneId, (t: Dictionary) => (value: string) => string> = {
  behavior: (t) => t.timeline.summaryBehavior,
  sensory: (t) => t.timeline.summarySensory,
  mood: (t) => t.timeline.summaryMood,
  care: (t) => t.timeline.summaryCare,
};

/** Samenvattingsrij bovenaan de tijdlijn ("4u22 slaap · 4 voeding · 3 luiers"), naast
 * (niet i.p.v.) de bestaande badges op de wielknoppen. Telt bewust over dezelfde
 * instelbare "dagstart" als die badges (usePreferences().dayStartHour) i.p.v. de
 * kalenderdag-scoped `events`-state van app/index.tsx — anders zouden deze cijfers en de
 * wiel-badges uiteen kunnen lopen zodra iemand een dagstart ≠ 00:00 gebruikt. Dat
 * betekent een eigen, kleine fetch die vergelijkbaar is met wheel-arc.tsx's
 * badgeEvents-effect — bewust niet hergebruikt/opgetild, om die bestaande, werkende
 * logica niet aan te hoeven raken voor dit ene extra gebruik. */
export function LaneSummaryPills({ selectedDate, badgeRefreshToken }: LaneSummaryPillsProps) {
  const db = useSQLiteContext();
  const { childId } = useActiveChild();
  const { dayStartHour } = usePreferences();
  const { t } = useI18n();
  const [rangeEvents, setRangeEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    if (!childId) return;
    const rangeStart = new Date(selectedDate);
    rangeStart.setHours(dayStartHour, 0, 0, 0);
    const rangeEnd = new Date(rangeStart.getTime() + 24 * 60 * 60 * 1000);
    getEventsForRange(db, childId, rangeStart, rangeEnd).then(setRangeEvents);
  }, [db, childId, selectedDate, dayStartHour, badgeRefreshToken]);

  const kindTotals = computeKindTotals(rangeEvents);
  const pills = TIMELINE_LANES.map((lane) => {
    const badge = formatGroupBadge(kindTotals, lane.kinds, t);
    const formatSummary = SUMMARY_FORMATTERS[lane.id](t);
    return { lane, text: badge ? formatSummary(badge) : null };
  }).filter((pill): pill is { lane: (typeof TIMELINE_LANES)[number]; text: string } => pill.text !== null);

  return (
    <View style={styles.row}>
      {pills.map(({ lane, text }) => (
        <LinearGradient
          key={lane.id}
          colors={[withAlpha(lane.color, 0.26), withAlpha(lane.color, 0.12)]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={[styles.pill, { borderColor: withAlpha(lane.color, 0.4) }]}>
          <Text style={[styles.pillText, { color: lighten(lane.color, 0.45) }]} numberOfLines={1}>
            {text}
          </Text>
        </LinearGradient>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: TIMELINE_HORIZONTAL_PADDING,
    paddingBottom: 10,
    // Reserves one pill's height even with zero pills (a fresh day, nothing logged yet)
    // so the lane header and timeline below don't jump down the moment the first event
    // of the day is logged and this row's content suddenly appears.
    minHeight: 23,
  },
  pill: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillText: {
    color: '#12171C',
    fontSize: 12,
    fontWeight: '700',
  },
});
