import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Design } from '@/constants/design';
import { withAlpha } from '@/lib/color';
import { usePreferences } from '@/lib/preferences-context';
import { minutesSinceMidnight } from '@/lib/time';
import { formatTime } from '@/lib/time-options';

interface NowLineProps {
  pixelsPerHour: number;
  color?: string;
  /** Gespiegeld (linkshandig): het tijdlabel staat dan rechts, bij de urenkolom. */
  mirrored?: boolean;
}

// Same fix as target-time-line.tsx: a fixed height + half-height upward shift puts the
// centered line exactly on time.
const ROW_HEIGHT = 20;

/** "Nu"-lijn met de tijd als amberkleurig labeltje over de urenkolom (design-voorstel
 * scherm 1). Stond eerst als losse tekst rechts, waar de wielhub hem bedekte, en de lijn
 * liep over de event-labels heen; app/index.tsx tekent hem nu vóór de events, dus eronder. */
export function NowLine({ pixelsPerHour, color = Design.accent, mirrored = false }: NowLineProps) {
  const { timeFormat } = usePreferences();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const top = (minutesSinceMidnight(now) / 60) * pixelsPerHour - ROW_HEIGHT / 2;

  return (
    <View style={[styles.row, mirrored && styles.rowMirrored, { top }]} pointerEvents="none">
      <View style={[styles.pill, { backgroundColor: color }]}>
        <Text style={styles.label}>{formatTime(now, timeFormat)}</Text>
      </View>
      <View style={[styles.line, { backgroundColor: withAlpha(color, 0.7) }]} />
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
  rowMirrored: {
    flexDirection: 'row-reverse',
  },
  pill: {
    paddingHorizontal: 6,
    height: ROW_HEIGHT,
    borderRadius: 7,
    justifyContent: 'center',
  },
  label: {
    color: Design.ground,
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  line: {
    flex: 1,
    height: 1.5,
  },
});
