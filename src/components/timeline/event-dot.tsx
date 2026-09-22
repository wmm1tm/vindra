import { Pressable, StyleSheet, Text } from 'react-native';

import { getEventVisual } from '@/constants/event-types';
import type { EventRow } from '@/db/events';
import { useI18n } from '@/lib/i18n';
import { formatTimelineDetail } from '@/lib/event-summary';
import { usePreferences } from '@/lib/preferences-context';
import { minutesSinceMidnight } from '@/lib/time';
import { EventIcon } from '@/components/ui/event-icon';

export const DOT_SIZE = 26;
export const DOT_GAP = 7;
const DETAIL_TEXT_MIN_PIXELS_PER_HOUR = 90;

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
   * app/index.tsx, which passes the computed lane width in. Defaults to the pre-lane
   * value (120) for callers outside the lane layout. */
  detailMaxWidth?: number;
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
}: EventDotProps) {
  const { volumeUnit, tempUnit } = usePreferences();
  const { t } = useI18n();
  const visual = getEventVisual(event.kind, event.variant);

  const baseTop = (minutesSinceMidnight(new Date(event.start_at)) / 60) * pixelsPerHour - DOT_SIZE / 2;
  const dragOffsetPx = ((previewOffsetMinutes ?? 0) / 60) * pixelsPerHour;
  const top = baseTop + dragOffsetPx;
  const offset = laneOffset + column * (DOT_SIZE + DOT_GAP);
  const sideStyle = mirrored ? { right: offset } : { left: offset };
  const isDragging = previewOffsetMinutes !== null;
  const showDetail = column === 0 && pixelsPerHour >= DETAIL_TEXT_MIN_PIXELS_PER_HOUR;
  const detail = showDetail ? formatTimelineDetail(event, volumeUnit, tempUnit, t) : null;
  // Sibling of the dot rather than nested inside it, for the same reason as the
  // capsule's detail text — a 26px-wide parent squeezes the text's measured width.
  const detailPosition = mirrored
    ? { right: offset + DOT_SIZE + 6, top: top + DOT_SIZE / 2 - 7 }
    : { left: offset + DOT_SIZE + 6, top: top + DOT_SIZE / 2 - 7 };

  return (
    <>
      <Pressable
        style={[styles.dot, { top, backgroundColor: visual.color }, sideStyle, isDragging && styles.dragging]}
        onPress={onPress}>
        <EventIcon name={visual.icon} set={visual.iconSet} size={15} color="#12171C" />
      </Pressable>
      {detail && !isDragging && (
        <Text
          style={[styles.detail, detailPosition, { maxWidth: detailMaxWidth, color: visual.color }]}
          numberOfLines={1}
          pointerEvents="none">
          {detail}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragging: {
    opacity: 0.85,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  detail: {
    position: 'absolute',
    maxWidth: 120,
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
