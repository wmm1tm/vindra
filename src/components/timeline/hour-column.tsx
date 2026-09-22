import { StyleSheet, Text, View } from 'react-native';

import { HOUR_COLUMN_WIDTH } from '@/constants/timeline';
import { usePreferences } from '@/lib/preferences-context';
import { formatTime } from '@/lib/time-options';

interface HourColumnProps {
  pixelsPerHour: number;
}

const HOUR_MARKS = Array.from({ length: 24 }, (_, hour) => {
  const date = new Date(2000, 0, 1, hour, 0, 0, 0);
  return { hour, date };
});

export function HourColumn({ pixelsPerHour }: HourColumnProps) {
  const { timeFormat } = usePreferences();

  return (
    <View style={styles.column}>
      {HOUR_MARKS.map(({ hour, date }) => (
        <View key={hour} style={[styles.hourSlot, { height: pixelsPerHour }]}>
          <Text style={styles.hourLabel}>{formatTime(date, timeFormat)}</Text>
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
