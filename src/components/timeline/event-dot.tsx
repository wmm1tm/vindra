import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { EventIcon } from '@/components/ui/event-icon';
import { getEventVisual } from '@/constants/event-types';
import { glowStyle } from '@/constants/design';
import type { EventRow } from '@/db/events';
import { withAlpha } from '@/lib/color';
import { useGlow } from '@/lib/glow-context';
import { formatTimelineDetail } from '@/lib/event-summary';
import { useI18n } from '@/lib/i18n';
import { usePreferences } from '@/lib/preferences-context';
import { minutesSinceMidnight } from '@/lib/time';

/** Tegeltje (vierkant met ronde hoeken) i.p.v. het oude bolletje: onderscheidt een gelogd
 * event van de ronde wielknoppen (design-voorstel 2026-09-24, scherm 5). */
export const DOT_SIZE = 30;
export const DOT_GAP = 7;
const TILE_RADIUS = 10;
const DETAIL_TEXT_MIN_PIXELS_PER_HOUR = 90;
const HELD_SCALE = 1.25;

interface EventDotProps {
  event: EventRow;
  column: number;
  pixelsPerHour: number;
  onPress: () => void;
  mirrored?: boolean;
  /** Live offset (in minutes) while this event is being rescheduled by dragging it on
   * the timeline — see app/index.tsx's longPressGesture. null when not being dragged. */
  previewOffsetMinutes?: number | null;
  /** Pixel offset of this event's fixed timeline lane (see constants/timeline-lanes.ts)
   * from the pinned edge — added to the sub-column offset below, so events always land
   * within their own lane's reserved width. 0 outside the lane layout. */
  laneOffset?: number;
  /** Caps the inline detail-text width so it doesn't run into the next lane — see
   * app/index.tsx, which passes the computed lane width in. */
  detailMaxWidth?: number;
  /** Een ánder event wordt nu vastgehouden: dit tegeltje treedt terug. */
  dimmed?: boolean;
}

export function EventDot({
  event,
  column,
  pixelsPerHour,
  onPress,
  mirrored = false,
  previewOffsetMinutes = null,
  laneOffset = 0,
  detailMaxWidth = 120,
  dimmed = false,
}: EventDotProps) {
  const { volumeUnit, tempUnit } = usePreferences();
  const { t } = useI18n();
  const glow = useGlow();
  const visual = getEventVisual(event.kind, event.variant);

  const baseTop = (minutesSinceMidnight(new Date(event.start_at)) / 60) * pixelsPerHour - DOT_SIZE / 2;
  const dragOffsetPx = ((previewOffsetMinutes ?? 0) / 60) * pixelsPerHour;
  const top = baseTop + dragOffsetPx;
  const offset = laneOffset + column * (DOT_SIZE + DOT_GAP);
  const sideStyle = mirrored ? { right: offset } : { left: offset };
  const isHeld = previewOffsetMinutes !== null;
  const showDetail = column === 0 && pixelsPerHour >= DETAIL_TEXT_MIN_PIXELS_PER_HOUR;
  const detail = showDetail ? formatTimelineDetail(event, volumeUnit, tempUnit, t) : null;
  const detailPosition = mirrored
    ? { right: offset + DOT_SIZE + 6, top: top + DOT_SIZE / 2 - 7 }
    : { left: offset + DOT_SIZE + 6, top: top + DOT_SIZE / 2 - 7 };

  // Vasthouden (design-voorstel scherm 2): tegeltje veert op naar 1,25× en twee ringen
  // pulseren naar buiten zolang je vasthoudt. Alles op de UI-thread (Reanimated).
  const scale = useSharedValue(1);
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (isHeld) {
      scale.value = withSpring(HELD_SCALE, { damping: 12, stiffness: 220 });
      pulse.value = 0;
      pulse.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }), -1, false);
    } else {
      scale.value = withSpring(1, { damping: 14, stiffness: 240 });
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 150 });
    }
  }, [isHeld, scale, pulse]);

  const tileStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const innerRingStyle = useAnimatedStyle(() => ({
    opacity: pulse.value === 0 ? 0 : 0.7 * (1 - pulse.value),
    transform: [{ scale: 1.1 + pulse.value * 0.6 }],
  }));
  const outerRingStyle = useAnimatedStyle(() => {
    const p = (pulse.value + 0.45) % 1;
    return {
      opacity: pulse.value === 0 ? 0 : 0.45 * (1 - p),
      transform: [{ scale: 1.1 + p * 1.0 }],
    };
  });

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[styles.ring, { top, borderColor: visual.color }, sideStyle, outerRingStyle]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.ring, { top, borderColor: visual.color }, sideStyle, innerRingStyle]}
      />
      <Animated.View style={[styles.tileWrap, { top, opacity: dimmed ? 0.3 : 1 }, sideStyle, tileStyle]}>
        <Pressable
          style={[
            styles.tile,
            {
              backgroundColor: isHeld ? withAlpha(visual.color, 0.34) : withAlpha(visual.color, 0.18),
              borderColor: visual.color,
              ...glowStyle(visual.color, glow, isHeld ? 0.8 : 0.4, 8),
            },
          ]}
          onPress={onPress}>
          <EventIcon name={visual.icon} set={visual.iconSet} size={18} color={visual.color} />
        </Pressable>
      </Animated.View>
      {detail && !isHeld && (
        <Text
          style={[
            styles.detail,
            detailPosition,
            { maxWidth: detailMaxWidth, color: visual.color, opacity: dimmed ? 0.3 : 1 },
          ]}
          numberOfLines={1}
          pointerEvents="none">
          {detail}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  tileWrap: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
  },
  tile: {
    flex: 1,
    borderRadius: TILE_RADIUS,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  ring: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: TILE_RADIUS + 2,
    borderWidth: 2,
  },
  detail: {
    position: 'absolute',
    maxWidth: 120,
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
