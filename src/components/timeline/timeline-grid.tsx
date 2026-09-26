import { StyleSheet, View } from 'react-native';

import { windowHours, type TimeWindow } from '@/lib/day-window';

interface TimelineGridProps {
  pixelsPerHour: number;
  window: TimeWindow;
}

/** Uurlijnen over het dagvenster; elke zesde lijn (00:00, 06:00, …) iets sterker. */
export function TimelineGrid({ pixelsPerHour, window }: TimelineGridProps) {
  const hours = Math.round(windowHours(window));
  const startMs = window.start.getTime();
  return (
    <View style={styles.grid}>
      {Array.from({ length: hours }, (_, index) => (
        <View
          key={index}
          style={[
            styles.hourLine,
            new Date(startMs + index * 3_600_000).getHours() % 6 === 0 && styles.majorHourLine,
            { top: index * pixelsPerHour },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flex: 1,
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  majorHourLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
});
