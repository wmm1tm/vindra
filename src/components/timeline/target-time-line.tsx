import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/lib/preferences-context';
import { minutesSinceMidnight } from '@/lib/time';
import { formatTime } from '@/lib/time-options';

interface TargetTimeLineProps {
  time: Date;
  pixelsPerHour: number;
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

export function TargetTimeLine({ time, pixelsPerHour, onClear }: TargetTimeLineProps) {
  const { timeFormat } = usePreferences();
  const top = (minutesSinceMidnight(time) / 60) * pixelsPerHour - ROW_HEIGHT / 2;

  return (
    <View style={[styles.row, { top }]}>
      <View style={styles.line} />
      <View style={styles.labelPill}>
        <Text style={styles.label}>{formatTime(time, timeFormat)}</Text>
      </View>
      {onClear && (
        <Pressable style={styles.clearButton} onPress={onClear} hitSlop={10}>
          <MaterialCommunityIcons name="close" size={13} color="#12161c" />
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
    borderColor: '#ECEDEE',
  },
  labelPill: {
    backgroundColor: '#ECEDEE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 6,
  },
  label: {
    color: '#12161c',
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ECEDEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});
