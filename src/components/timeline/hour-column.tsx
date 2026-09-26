import { StyleSheet, Text, View } from 'react-native';

import { HOUR_COLUMN_WIDTH } from '@/constants/timeline';
import { windowHours, type TimeWindow } from '@/lib/day-window';
import { usePreferences } from '@/lib/preferences-context';
import { formatTime } from '@/lib/time-options';

interface HourColumnProps {
  pixelsPerHour: number;
  /** Het dagvenster van de tijdlijn (begint op het dagstart-uur, 23-25 uur lang). */
  window: TimeWindow;
}

/** Uurlabels vanaf het begin van het dagvenster, één per echt verstreken uur: op de dag van
 * de wintertijd staat 02:00 er dus twee keer, bij zomertijd ontbreekt het. */
export function HourColumn({ pixelsPerHour, window }: HourColumnProps) {
  const { timeFormat } = usePreferences();
  const hours = Math.round(windowHours(window));
  const startMs = window.start.getTime();

  return (
    <View style={styles.column}>
      {Array.from({ length: hours }, (_, index) => (
        <View key={index} style={[styles.hourSlot, { height: pixelsPerHour }]}>
          <Text style={styles.hourLabel}>{formatTime(new Date(startMs + index * 3_600_000), timeFormat)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: HOUR_COLUMN_WIDTH,
  },
  hourSlot: {},
  hourLabel: {
    color: '#AAB4B6',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});
