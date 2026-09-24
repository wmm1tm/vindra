import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EVENT_TYPES } from '@/constants/event-types';
import type { EventRow } from '@/db/events';
import { useI18n } from '@/lib/i18n';
import { formatTimelineDetail } from '@/lib/event-summary';
import { usePreferences } from '@/lib/preferences-context';
import { minutesSinceMidnight } from '@/lib/time';
import { EventIcon } from '@/components/ui/event-icon';
import { mixOver, withAlpha } from '@/lib/color';
import { Design, glowStyle } from '@/constants/design';
import { useGlow } from '@/lib/glow-context';

export const CAPSULE_WIDTH = 26;
export const COLUMN_GAP = 6;
const MARKER_SIZE = 26;
// Below this zoom level the timeline gets too cramped for inline detail text to have
// room without overlapping neighbouring events.
const DETAIL_TEXT_MIN_PIXELS_PER_HOUR = 90;

interface PreviewEdit {
  /** Which marker is being dragged — 'whole' shifts start and end together (duration
   * unchanged), 'start'/'end' moves just that one marker (duration recomputed). */
  edge: 'start' | 'end' | 'whole';
  time: Date;
}

interface EventCapsuleProps {
  event: EventRow;
  column: number;
  pixelsPerHour: number;
  onPress: () => void;
  mirrored?: boolean;
  /** Start (midnight) of the day being viewed — this timeline only ever shows one
   * calendar day, so an event that started earlier or hasn't ended yet gets clipped to
   * this day's bounds with a "continues" chevron instead of its normal marker icon. */
  dayStart: Date;
  /** Is the day being viewed today? An event with no end_at is still running, so it
   * should visually run up to "now" — but only when "now" actually falls on this day.
   * On a past day it would otherwise drag the bar through every day in between. */
  isToday?: boolean;
  /** Live preview while this event is being rescheduled by dragging it on the timeline
   * — see app/index.tsx's longPressGesture. null when not being dragged. */
  previewEdit?: PreviewEdit | null;
  /** Pixel offset of this event's fixed timeline lane (see constants/timeline-lanes.ts)
   * from the pinned edge — added to the sub-column offset below, so events always land
   * within their own lane's reserved width. 0 outside the lane layout. */
  laneOffset?: number;
  /** Caps the inline detail-text width so it doesn't run into the next lane — see
   * app/index.tsx, which passes the computed lane width in. Defaults to the pre-lane
   * value (120) for callers outside the lane layout. */
  detailMaxWidth?: number;
  /** Een ánder event wordt nu vastgehouden: deze capsule treedt terug. */
  dimmed?: boolean;
}

export function EventCapsule({
  event,
  column,
  pixelsPerHour,
  onPress,
  mirrored = false,
  dayStart,
  isToday = true,
  previewEdit = null,
  laneOffset = 0,
  detailMaxWidth = 120,
  dimmed = false,
}: EventCapsuleProps) {
  const { volumeUnit, tempUnit } = usePreferences();
  const { t } = useI18n();
  const glow = useGlow();
  const type = EVENT_TYPES[event.kind];

  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const trueStart = new Date(event.start_at);
  const trueEnd = event.end_at ? new Date(event.end_at) : null;
  // The real start/end may fall outside the day being shown (an overnight sleep that
  // started yesterday, or hasn't ended yet) — clip to this day's bounds rather than
  // drawing a nonsensical bar, and say so with a chevron instead of the normal marker.
  const continuesBefore = trueStart.getTime() < dayStart.getTime();
  const effectiveEnd = trueEnd ?? (isToday ? new Date() : dayEnd);
  // >= , not > : an end that lands exactly on the boundary (midnight) is numerically
  // indistinguishable from today's own 00:00 once only hour/minute are read out below —
  // without treating "exactly at the end" as "continues", the bar would collapse back
  // onto the start marker instead of reaching the bottom of the day.
  const continuesAfter = effectiveEnd.getTime() >= dayEnd.getTime();

  const rawStartTop = continuesBefore ? 0 : (minutesSinceMidnight(trueStart) / 60) * pixelsPerHour;
  const rawEndTop = continuesAfter ? 24 * pixelsPerHour : (minutesSinceMidnight(effectiveEnd) / 60) * pixelsPerHour;

  // 'start'/'end' move only that marker (the other stays put, so the duration changes);
  // 'whole' shifts both by the same amount, preserving the duration.
  let startTop = rawStartTop;
  let endTop = rawEndTop;
  if (previewEdit) {
    const previewTop = (minutesSinceMidnight(previewEdit.time) / 60) * pixelsPerHour;
    if (previewEdit.edge === 'start') {
      startTop = previewTop;
    } else if (previewEdit.edge === 'end') {
      endTop = previewTop;
    } else {
      const deltaPx = previewTop - rawStartTop;
      startTop = rawStartTop + deltaPx;
      endTop = rawEndTop + deltaPx;
    }
  }
  // The wrapper's top/bottom must land on the markers' *centers*, not their edges — a
  // 26px marker pinned by top:0/bottom:0 (below) would otherwise sit half its own size
  // off from the real timestamp, same mistake event-dot.tsx avoids by subtracting
  // DOT_SIZE/2. So the wrapper is extended by half a marker on each side, and startTop
  // stays what it says: the true pixel for the event's start time.
  const wrapperTop = startTop - MARKER_SIZE / 2;
  const height = Math.max(endTop - startTop, 0) + MARKER_SIZE;
  const offset = laneOffset + column * (CAPSULE_WIDTH + COLUMN_GAP);
  const sideStyle = mirrored ? { right: offset } : { left: offset };
  const isDragging = previewEdit !== null;
  const markerFill = mixOver(type.color, Design.ground, isDragging ? 0.4 : 0.24);

  // Only the primary column has guaranteed clear space beside it — later columns exist
  // precisely because something else already overlaps that time range.
  const showDetail = column === 0 && pixelsPerHour >= DETAIL_TEXT_MIN_PIXELS_PER_HOUR;
  const detail = showDetail ? formatTimelineDetail(event, volumeUnit, tempUnit, t) : null;
  // Rendered as its own sibling, positioned directly in the events-area coordinate
  // space, rather than nested inside the 26px-wide capsule column — nesting it there
  // squeezed the text's measured width down to almost nothing and truncated it.
  // startTop is the start marker's true (now-centered) position, so this just centers
  // the text line on it.
  const detailPosition = mirrored
    ? { right: offset + CAPSULE_WIDTH + 6, top: startTop - 7 }
    : { left: offset + CAPSULE_WIDTH + 6, top: startTop - 7 };

  return (
    <>
      <Pressable
        style={[styles.wrapper, { top: wrapperTop, height, opacity: dimmed ? 0.3 : 1 }, sideStyle, isDragging && styles.dragging]}
        onPress={onPress}>
        <LinearGradient
          colors={[withAlpha(type.color, 0.55), withAlpha(type.color, 0.18)]}
          style={[styles.bar, { borderColor: withAlpha(type.color, 0.7) }]}
        />
        <View style={[styles.marker, styles.startMarker, { backgroundColor: markerFill, borderColor: type.color, ...glowStyle(type.color, glow, 0.45, 8) }]}>
          {continuesBefore ? (
            <MaterialCommunityIcons name="chevron-up" size={15} color={type.color} />
          ) : (
            <EventIcon name={type.icon} set={type.iconSet} size={15} color={type.color} />
          )}
        </View>
        {continuesAfter ? (
          <View style={[styles.marker, styles.endMarker, styles.endMarkerRing, { backgroundColor: markerFill, borderColor: type.color, ...glowStyle(type.color, glow, 0.45, 8) }]}>
            <MaterialCommunityIcons name="chevron-down" size={15} color={type.color} />
          </View>
        ) : event.end_at ? (
          <View style={[styles.marker, styles.endMarker, styles.endMarkerRing, { backgroundColor: markerFill, borderColor: type.color, ...glowStyle(type.color, glow, 0.45, 8) }]}>
            <EventIcon name={type.endIcon ?? type.icon} set={type.endIconSet ?? type.iconSet} size={15} color={type.color} />
          </View>
        ) : (
          type.isDuration && (
            <View style={styles.openBadge}>
              <Text style={styles.openBadgeText}>!</Text>
            </View>
          )
        )}
      </Pressable>
      {detail && !isDragging && (
        <Text
          style={[styles.detail, detailPosition, { maxWidth: detailMaxWidth, color: type.color }]}
          numberOfLines={1}
          pointerEvents="none">
          {detail}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    width: CAPSULE_WIDTH,
  },
  dragging: {
    opacity: 0.85,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  bar: {
    position: 'absolute',
    left: (CAPSULE_WIDTH - 12) / 2,
    top: MARKER_SIZE / 2,
    bottom: MARKER_SIZE / 2,
    width: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  marker: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: 9,
    borderWidth: 1.5,
    backgroundColor: Design.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
  },
  startMarker: {
    top: 0,
  },
  detail: {
    position: 'absolute',
    maxWidth: 120,
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  endMarker: {
    bottom: 0,
  },
  endMarkerRing: {
    borderWidth: 2,
  },
  openBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: Design.accent,
    borderWidth: 1.5,
    borderColor: Design.ground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openBadgeText: {
    color: Design.ground,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
});
