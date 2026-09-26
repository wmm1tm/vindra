import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/lib/preferences-context';
import { minutesFromWindowStart } from '@/lib/day-window';
import { formatTime } from '@/lib/time-options';

interface TargetTimeLineProps {
  time: Date;
  pixelsPerHour: number;
  /** Begin van het dagvenster van de tijdlijn. */
  windowStart: Date;
  /** Omit while showing a live, self-clearing time (e.g. during a drag) — there's
   * nothing for the user to manually clear, so the close button is hidden. */
  onClear?: () => void;
}

// The row's own top must land on the dashed line's true time, not the row's top edge —
// alignItems:'center' centers every child (including the line) within the row's height,
// so without an explicit height/offset here the line drifts down to the row's vertical
// center (roughly half the label pill's height below the real time). Giving the row a
// fixed height and shifting it up by half that height puts the centered line exactly
// where it belongs, same fix as event-capsule.tsx's marker anchoring.
const ROW_HEIGHT = 26;

export function TargetTimeLine({ time, pixelsPerHour, windowStart, onClear }: TargetTimeLineProps) {
  const { timeFormat } = usePreferences();
  const top = (minutesFromWindowStart(time, windowStart) / 60) * pixelsPerHour - ROW_HEIGHT / 2;

  return (
    <View style={[styles.row, { top }]}>
      <View style={styles.line} />
      <View style={styles.labelPill}>
        <Text style={styles.label}>{formatTime(time, timeFormat)}</Text>
      </View>
      {onClear && (
        <Pressable style={styles.clearButton} onPress={onClear} hitSlop={10}>
          <MaterialCommunityIcons name="close" size={13} color="#12171C" />
        </Pressable>
      )}
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
    zIndex: 5,
  },
  line: {
    flex: 1,
    height: 0,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#F1EEE7',
  },
  labelPill: {
    backgroundColor: '#F1EEE7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 6,
  },
  label: {
    color: '#12171C',
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F1EEE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});
