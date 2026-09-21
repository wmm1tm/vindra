import { StyleSheet, View } from 'react-native';

interface TimelineGridProps {
  pixelsPerHour: number;
}

export function TimelineGrid({ pixelsPerHour }: TimelineGridProps) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 24 }, (_, hour) => (
        <View
          key={hour}
          style={[
            styles.hourLine,
            hour % 6 === 0 && styles.majorHourLine,
            { top: hour * pixelsPerHour },
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
