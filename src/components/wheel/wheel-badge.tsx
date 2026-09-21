import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text } from 'react-native';

import { WHEEL_BUTTON_SIZE } from '@/components/wheel/wheel-button';
import { lighten } from '@/lib/color';

const BADGE_HEIGHT = 18;
const BADGE_WIDTH = 56;
const BADGE_SCREEN_MARGIN = 4;

interface WheelBadgeProps {
  x: number;
  y: number;
  text: string;
  /** Same color as the button this badge belongs to — badges used to share one fixed
   * accent color regardless of the button, which made a cluster of them (e.g. every
   * button in the "Overig" group) hard to tell apart at a glance. */
  color: string;
  /** Shift further down when this button also shows a caption at the usual badge slot.
   * No current event type does both, but this keeps them from ever overlapping. */
  hasCaption?: boolean;
  screenWidth?: number;
  screenHeight?: number;
}

/** Renders a count/duration badge for a wheel button. Always drawn in a pass that runs
 * after every button on its ring (see WheelArc/WheelRing), so it never ends up visually
 * underneath a neighbouring button — a fixed corner-offset badge drawn as part of each
 * button used to get covered by whichever button happened to render after it. Centered
 * directly below the button (the same slot a caption uses) so it lands in the same,
 * predictable place for every event type regardless of how tightly the arc is packed. */
export function WheelBadge({ x, y, text, color, hasCaption = false, screenWidth, screenHeight }: WheelBadgeProps) {
  const top = y + WHEEL_BUTTON_SIZE / 2 + 4 + (hasCaption ? 16 : 0);
  const left = x - BADGE_WIDTH / 2;
  const clampedTop = screenHeight
    ? Math.min(Math.max(top, BADGE_SCREEN_MARGIN), screenHeight - BADGE_HEIGHT - BADGE_SCREEN_MARGIN)
    : top;
  const clampedLeft = screenWidth
    ? Math.min(Math.max(left, BADGE_SCREEN_MARGIN), screenWidth - BADGE_WIDTH - BADGE_SCREEN_MARGIN)
    : left;

  return (
    <LinearGradient
      colors={[lighten(color, 0.12), color]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      pointerEvents="none"
      style={[styles.badge, { left: clampedLeft, top: clampedTop, shadowColor: color }]}>
      <Text style={styles.text} numberOfLines={1}>
        {text}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    width: BADGE_WIDTH,
    height: BADGE_HEIGHT,
    borderRadius: BADGE_HEIGHT / 2,
    borderWidth: 1,
    borderColor: '#12161c',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  text: {
    color: '#12161c',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: BADGE_HEIGHT - 2,
    textAlign: 'center',
  },
});
