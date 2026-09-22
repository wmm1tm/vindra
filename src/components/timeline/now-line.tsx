import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/lib/preferences-context';
import { minutesSinceMidnight } from '@/lib/time';
import { formatTime } from '@/lib/time-options';

interface NowLineProps {
  pixelsPerHour: number;
  color?: string;
}

// Same fix as target-time-line.tsx: alignItems:'center' centers every child (dot, line,
// label) within the row's auto height, which drags the line itself down to the row's
// vertical center instead of the real "now" pixel. A fixed height + half-height upward
// shift puts the centered line exactly on time.
const ROW_HEIGHT = 16;

export function NowLine({ pixelsPerHour, color = '#D6A866' }: NowLineProps) {
  const { timeFormat } = usePreferences();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const top = (minutesSinceMidnight(now) / 60) * pixelsPerHour - ROW_HEIGHT / 2;

  return (
    <View style={[styles.row, { top }]} pointerEvents="none">
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={[styles.line, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{formatTime(now, timeFormat)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D6A866',
    marginRight: -3,
  },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#D6A866',
  },
  label: {
    color: '#D6A866',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    marginLeft: 6,
  },
});
