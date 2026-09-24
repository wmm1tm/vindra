import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text } from 'react-native';

import { WHEEL_BUTTON_SIZE } from '@/components/wheel/wheel-button';
import { lighten } from '@/lib/color';


// Klein rondje rechtsboven op de knop (was een pil eronder die bij 7-8 knoppen over de
// buurknoppen viel, toesteltest 2026-09-24). Breder alleen voor een duur als "1u20".
const BADGE_HEIGHT = 20;
const BADGE_MIN_WIDTH = 20;
const BADGE_SCREEN_MARGIN = 4;

interface WheelBadgeProps {
  x: number;
  y: number;
  text: string;
  /** Same color as the button this badge belongs to — badges used to share one fixed
   * accent color regardless of the button, which made a cluster of them (e.g. every
   * button in the "Overig" group) hard to tell apart at a glance. */
  color: string;
  screenWidth?: number;
  screenHeight?: number;
}

/** Renders a count/duration badge for a wheel button. Always drawn in a pass that runs
 * after every button on its ring (see WheelArc/WheelRing), so it never ends up visually
 * underneath a neighbouring button — a fixed corner-offset badge drawn as part of each
 * button used to get covered by whichever button happened to render after it. Centered
 * directly below the button (the same slot a caption uses) so it lands in the same,
 * predictable place for every event type regardless of how tightly the arc is packed. */
export function WheelBadge({ x, y, text, color, screenWidth, screenHeight }: WheelBadgeProps) {
  const width = Math.max(BADGE_MIN_WIDTH, text.length * 7 + 8);
  const offset = (WHEEL_BUTTON_SIZE / 2) * 0.72;
  const top = y - offset - BADGE_HEIGHT / 2;
  const left = x + offset - width / 2;
  const clampedTop = screenHeight
    ? Math.min(Math.max(top, BADGE_SCREEN_MARGIN), screenHeight - BADGE_HEIGHT - BADGE_SCREEN_MARGIN)
    : top;
  const clampedLeft = screenWidth
    ? Math.min(Math.max(left, BADGE_SCREEN_MARGIN), screenWidth - width - BADGE_SCREEN_MARGIN)
    : left;

  return (
    <LinearGradient
      colors={[lighten(color, 0.15), color]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      pointerEvents="none"
      style={[styles.badge, { left: clampedLeft, top: clampedTop, width, shadowColor: color }]}>
      <Text style={styles.text} numberOfLines={1}>
        {text}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    height: BADGE_HEIGHT,
    borderRadius: BADGE_HEIGHT / 2,
    borderWidth: 2,
    borderColor: '#12171C',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  text: {
    color: '#12171C',
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    lineHeight: BADGE_HEIGHT - 4,
    textAlign: 'center',
  },
});
