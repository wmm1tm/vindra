import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import { EventIcon } from '@/components/ui/event-icon';
import { EVENT_TYPES, type EventKind } from '@/constants/event-types';
import type { EventRow } from '@/db/events';
import { lighten, withAlpha } from '@/lib/color';
import { useI18n } from '@/lib/i18n';
import type { Dictionary } from '@/lib/i18n/translations';
import {
  TREND_RANGES,
  averageOf,
  compareHalves,
  trendWeekStarts,
  vindraTrendKinds,
  vindraTrendSeries,
  type TrendComparison,
  type TrendRange,
} from '@/lib/trends';

const CHART_HEIGHT = 140;

interface TrendChartProps {
  /** Events van de laatste 12 weken, zie trendFetchStart. */
  events: EventRow[];
  /** Tijdstip van de allereerste log, voor welke weken meetellen. */
  firstEventTime: number | null;
  /** false = geen abonnement: de grafiek staat er wel, maar onder een slotje. */
  entitled: boolean;
  onUnlock: () => void;
}

function comparisonText(comparison: TrendComparison, t: Dictionary) {
  switch (comparison.kind) {
    case 'lower':
      return t.trends.lower(comparison.percent, comparison.weeks);
    case 'higher':
      return t.trends.higher(comparison.percent, comparison.weeks);
    case 'same':
      return t.trends.same(comparison.weeks);
    default:
      return t.trends.notEnoughData;
  }
}

/** Verloop over 4-12 weken in het verslag: hoe vaak een type per week gelogd is, juist wat
 * een behandelaar wil zien. Neutraal: de balken houden de kleur van het type en de
 * vergelijking staat er als tekst onder ("minder"/"meer"), zonder rood of groen. */
export function TrendChart({ events, firstEventTime, entitled, onUnlock }: TrendChartProps) {
  const { t, localeTag } = useI18n();
  const [range, setRange] = useState<TrendRange>(8);
  const [chosen, setChosen] = useState<EventKind | null>(null);
  const [chartWidth, setChartWidth] = useState(280);

  const available = vindraTrendKinds(events);
  const kind: EventKind = chosen && available.includes(chosen) ? chosen : (available[0] ?? 'gedrag');
  const color = EVENT_TYPES[kind].color;

  const now = new Date();
  const weeks = trendWeekStarts(range, now);
  const { values, activeValues } = vindraTrendSeries(events, kind, weeks, firstEventTime, now);
  const average = averageOf(activeValues);
  const max = Math.max(1, ...values, average);

  const gap = range === 12 ? 4 : 7;
  const barWidth = (chartWidth - gap * (range - 1)) / range;
  const averageY = CHART_HEIGHT - (average / max) * CHART_HEIGHT;
  const dateFormat = new Intl.DateTimeFormat(localeTag, { day: 'numeric', month: 'short' });
  const numberFormat = new Intl.NumberFormat(localeTag, { maximumFractionDigits: 1 });
  const comparison = comparisonText(compareHalves(activeValues), t);

  return (
    <View style={styles.container}>
      {available.length > 1 && (
        <View style={styles.kindRow}>
          {available.map((option) => {
            const type = EVENT_TYPES[option];
            const active = option === kind;
            return (
              <Pressable
                key={option}
                onPress={() => setChosen(option)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[
                  styles.kindChip,
                  {
                    borderColor: withAlpha(type.color, active ? 0.8 : 0.3),
                    backgroundColor: withAlpha(type.color, active ? 0.22 : 0.08),
                  },
                ]}>
                <EventIcon name={type.icon} set={type.iconSet} size={14} color={type.color} />
                <Text style={[styles.kindLabel, { color: lighten(type.color, 0.4) }]}>{type.label(t)}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
      <View style={styles.rangeRow}>
        {TREND_RANGES.map((option) => (
          <Pressable
            key={option}
            onPress={() => setRange(option)}
            style={[styles.rangePill, range === option && styles.rangePillActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: range === option }}>
            <Text style={[styles.rangeLabel, range === option && styles.rangeLabelActive]}>{t.trends.weeks(option)}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.chartArea} onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
        <Svg width={chartWidth} height={CHART_HEIGHT}>
          {values.map((value, i) => {
            const height = Math.max(3, (value / max) * CHART_HEIGHT);
            const isCurrent = i === values.length - 1;
            return (
              <Rect
                key={i}
                x={i * (barWidth + gap)}
                y={CHART_HEIGHT - height}
                width={barWidth}
                height={height}
                rx={Math.min(6, barWidth / 2)}
                fill={value > 0 ? color : withAlpha(color, 0.18)}
                fillOpacity={isCurrent ? 0.55 : 1}
              />
            );
          })}
          {average > 0 && (
            <Line
              x1={0}
              x2={chartWidth}
              y1={averageY}
              y2={averageY}
              stroke="#F1EEE7"
              strokeOpacity={0.6}
              strokeWidth={1.5}
              strokeDasharray="4 5"
            />
          )}
        </Svg>
        <View style={styles.axisRow}>
          <Text style={styles.axisLabel}>{dateFormat.format(weeks[0])}</Text>
          <Text style={styles.axisLabel}>{t.trends.thisWeek}</Text>
        </View>
        {!entitled && (
          <Pressable style={styles.lockOverlay} onPress={onUnlock} accessibilityRole="button">
            <View style={styles.lockBadge}>
              <MaterialCommunityIcons name="lock-outline" size={18} color="#12171C" />
              <Text style={styles.lockLabel}>{t.trends.unlock}</Text>
            </View>
          </Pressable>
        )}
      </View>

      <Text style={styles.summary}>
        {average > 0 ? `${t.trends.averagePerWeek(numberFormat.format(average))} · ${comparison}` : comparison}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingVertical: 4,
  },
  kindRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  kindChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  kindLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  rangeRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#12171C',
    borderRadius: 10,
    padding: 3,
  },
  rangePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rangePillActive: {
    backgroundColor: '#D6A866',
  },
  rangeLabel: {
    color: '#AAB4B6',
    fontSize: 12,
    fontWeight: '500',
  },
  rangeLabelActive: {
    color: '#12171C',
    fontWeight: '700',
  },
  chartArea: {
    gap: 6,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    color: '#AAB4B6',
    fontSize: 11,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(28,37,42,0.82)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D6A866',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  lockLabel: {
    color: '#12171C',
    fontSize: 14,
    fontWeight: '700',
  },
  summary: {
    color: '#F1EEE7',
    fontSize: 13,
    lineHeight: 18,
  },
});
