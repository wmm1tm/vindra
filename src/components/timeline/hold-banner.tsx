import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { LANE_HEADER_HEIGHT } from '@/components/timeline/lane-header';
import { EventIcon } from '@/components/ui/event-icon';
import { EVENT_TYPES, getEventVisual } from '@/constants/event-types';
import { Design, SHINE } from '@/constants/design';
import { TIMELINE_HORIZONTAL_PADDING, laneIndexForKind } from '@/constants/timeline-lanes';
import type { EventRow } from '@/db/events';
import { mixOver, withAlpha } from '@/lib/color';
import { useGlow } from '@/lib/glow-context';
import { formatEventDetailLine } from '@/lib/event-summary';
import { useI18n } from '@/lib/i18n';
import { usePreferences } from '@/lib/preferences-context';
import { formatTime } from '@/lib/time-options';

const BANNER_HEIGHT = 64;
const NOTCH_SIZE = 8;
const SHINE_WIDTH = 70;

interface HoldBannerProps {
  event: EventRow;
  /** Welk deel wordt versleept — bepaalt tegen welke oorspronkelijke tijd het verschil
   * ("+15 min") wordt gerekend. */
  edge: 'start' | 'end' | 'whole';
  /** De tijd waar de vinger nu is (gesnapt), of null vlak na het vastpakken. */
  previewTime: Date | null;
  laneWidth: number;
  hourColumnWidth: number;
  mirrored: boolean;
}

/** Banner die onder de kolomkoppen inschuift zolang je een event vasthoudt
 * (design-voorstel 2026-09-24, scherm 2): icoon, type · keuze, tijd en hoeveel je het al
 * verschoven hebt, met een pijltje naar de kolom van het event. Hangt aan
 * LANE_HEADER_HEIGHT en de kolombreedte (dezelfde waarden die de tijdlijn zelf tekent),
 * niet aan een gemeten sibling. */
export function HoldBanner({ event, edge, previewTime, laneWidth, hourColumnWidth, mirrored }: HoldBannerProps) {
  const { t } = useI18n();
  const { timeFormat } = usePreferences();
  const glow = useGlow();
  const { width } = useWindowDimensions();
  const visual = getEventVisual(event.kind, event.variant);
  const type = EVENT_TYPES[event.kind];

  const detail = formatEventDetailLine(event, t);
  const title = detail ? `${type.label(t)} · ${detail}` : type.label(t);

  const originalIso = edge === 'end' && event.end_at ? event.end_at : event.start_at;
  const original = new Date(originalIso);
  const shown = previewTime ?? original;
  const deltaMinutes = Math.round((shown.getTime() - original.getTime()) / 60000);

  const start = edge === 'start' || edge === 'whole' ? shown : new Date(event.start_at);
  const endIso = event.end_at;
  let end: Date | null = null;
  if (edge === 'end') end = shown;
  else if (endIso && edge === 'whole') end = new Date(new Date(endIso).getTime() + deltaMinutes * 60000);
  else if (endIso) end = new Date(endIso);
  const timeLine = end ? `${formatTime(start, timeFormat)} → ${formatTime(end, timeFormat)}` : formatTime(start, timeFormat);

  const laneIndex = laneIndexForKind(event.kind);
  const laneCenter = TIMELINE_HORIZONTAL_PADDING + hourColumnWidth + laneWidth * (laneIndex + 0.5);
  const notchLeft = (mirrored ? width - laneCenter : laneCenter) - NOTCH_SIZE;

  // Eén glansstreep direct na het inschuiven, daarna rustig om de 2,4 s zolang je vasthoudt.
  const shine = useSharedValue(0);
  useEffect(() => {
    if (!SHINE) return;
    shine.value = withRepeat(
      withSequence(
        withDelay(120, withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) })),
        withDelay(1500, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );
  }, [shine]);
  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -SHINE_WIDTH + shine.value * (width + SHINE_WIDTH) }, { skewX: '-18deg' }],
  }));

  const deep = mixOver(visual.color, Design.ground, 0.32);
  const mid = mixOver(visual.color, Design.surface, 0.18);

  return (
    <Animated.View
      pointerEvents="none"
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(160)}
      style={styles.container}>
      <View style={[styles.notch, { left: notchLeft, borderBottomColor: withAlpha(visual.color, 0.9) }]} />
      <View style={[styles.banner, { borderColor: withAlpha(visual.color, 0.6), shadowColor: glow > 0 ? visual.color : '#000', shadowOpacity: glow > 0 ? 0.45 * glow + 0.15 : 0.35 }]}>
        <LinearGradient
          colors={[deep, mid, Design.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {SHINE && (
          <Animated.View style={[styles.shine, shineStyle]}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
        <View style={[styles.iconTile, { backgroundColor: withAlpha(visual.color, 0.25), borderColor: visual.color }]}>
          <EventIcon name={visual.icon} set={visual.iconSet} size={26} color={visual.color} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {`${timeLine} · ${t.timeline.holdHint}`}
          </Text>
        </View>
        {deltaMinutes !== 0 && (
          <View style={styles.deltaPill}>
            <Text style={styles.deltaText}>{t.timeline.holdDelta(deltaMinutes)}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: LANE_HEADER_HEIGHT - 4,
    left: 0,
    right: 0,
    paddingTop: NOTCH_SIZE,
    paddingHorizontal: TIMELINE_HORIZONTAL_PADDING,
    zIndex: 20,
  },
  notch: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: NOTCH_SIZE,
    borderRightWidth: NOTCH_SIZE,
    borderBottomWidth: NOTCH_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  banner: {
    height: BANNER_HEIGHT,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SHINE_WIDTH,
  },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    color: Design.muted,
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  deltaPill: {
    backgroundColor: Design.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deltaText: {
    color: Design.ground,
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
