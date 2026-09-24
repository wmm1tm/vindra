import { StyleSheet, View } from 'react-native';

import { arcPosition } from '@/lib/wheel-geometry';
import { WHEEL_BUTTON_SIZE, WheelButton } from '@/components/wheel/wheel-button';
import { WheelBadge } from '@/components/wheel/wheel-badge';

// A ring never curls further round than this, regardless of how many items it holds.
const MAX_SUB_RING_SPAN_DEG = 130;
// Minimum arc-length between two button centers: wide enough to clear both the 66px
// buttons themselves and the ~80px-wide caption/badge text some of them carry.
const MIN_BUTTON_GAP = 20;

export interface WheelRingItem {
  id: string;
  label?: string;
  icon?: React.ComponentProps<typeof WheelButton>['icon'];
  iconSet?: React.ComponentProps<typeof WheelButton>['iconSet'];
  caption?: string;
  badge?: string | null;
  selected?: boolean;
  color?: string;
}

interface WheelRingProps {
  items: WheelRingItem[];
  color: string;
  radius: number;
  pivot: { x: number; y: number };
  stepDeg: number;
  onSelect: (id: string) => void;
  mirrored?: boolean;
  screenWidth?: number;
  screenHeight?: number;
}

export function WheelRing({
  items,
  color,
  radius,
  pivot,
  stepDeg,
  onSelect,
  mirrored = false,
  screenWidth = 0,
  screenHeight,
}: WheelRingProps) {
  // Never pack items closer than what their own size needs, even if the ring inherited
  // a tighter step from the (differently-sized) main wheel it branches off from.
  const minStepDeg = ((WHEEL_BUTTON_SIZE + MIN_BUTTON_GAP) / radius) * (180 / Math.PI);
  const angleSpanDeg = Math.min(Math.max(stepDeg, minStepDeg) * (items.length - 1), MAX_SUB_RING_SPAN_DEG);

  const positioned = items.map((item, i) => {
    const { x, y } = arcPosition({ index: i, count: items.length, radius, angleSpanDeg, pivot });
    return { item, x: mirrored ? screenWidth - x : x, y };
  });

  return (
    <View style={styles.layer} pointerEvents="box-none">
      {positioned.map(({ item, x, y }) => (
        <WheelButton
          key={item.id}
          x={x}
          y={y}
          color={item.color ?? color}
          icon={item.icon}
          iconSet={item.iconSet}
          label={item.label}
          caption={item.caption}
          selected={item.selected}
          onPress={() => onSelect(item.id)}
        />
      ))}
      {/* Drawn after every button on this ring so a badge is never visually covered by
          a neighbouring button — see WheelBadge. */}
      {positioned.map(
        ({ item, x, y }) =>
          item.badge && (
            <WheelBadge
              key={item.id}
              x={x}
              y={y}
              text={item.badge}
              color={item.color ?? color}
              screenWidth={screenWidth}
              screenHeight={screenHeight}
            />
          )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
  },
});
