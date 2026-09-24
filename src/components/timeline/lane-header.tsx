import { StyleSheet, Text, View } from 'react-native';

import { TIMELINE_HORIZONTAL_PADDING, TIMELINE_LANES } from '@/constants/timeline-lanes';
import { lighten, withAlpha } from '@/lib/color';
import { useI18n } from '@/lib/i18n';

/** Vaste hoogte (incl. marge onder) — de lang-druk-banner (hold-banner.tsx) hangt direct
 * hieronder en rekent met deze waarde i.p.v. de kop te meten. */
export const LANE_HEADER_HEIGHT = 34;
const PILL_GAP = 6;

interface LaneHeaderProps {
  mirrored?: boolean;
  laneWidth: number;
  /** Width of the hour-labels spacer this header aligns with — rendered as part of the
   * same reversible row as the lanes themselves (not a separate sibling wrapper), so
   * mirroring flips the spacer and the lane order together in one go. */
  hourColumnWidth: number;
  /** Index van de kolom die nu "actief" is (event vastgehouden): die licht op, de rest
   * treedt terug. null = alle kolommen gewoon. */
  activeLaneIndex?: number | null;
}

/** Vaste kolomkoppen boven de tijdlijn als getinte pilletjes met een kleurbolletje
 * (design-voorstel 2026-09-24). Blijft buiten de ScrollView staan (zie app/index.tsx)
 * zodat het niet meescrolt met de uren. */
export function LaneHeader({ mirrored = false, laneWidth, hourColumnWidth, activeLaneIndex = null }: LaneHeaderProps) {
  const { t } = useI18n();

  return (
    <View style={[styles.row, mirrored && styles.rowMirrored]}>
      <View style={{ width: hourColumnWidth }} />
      {TIMELINE_LANES.map((lane, index) => {
        const isActive = activeLaneIndex === index;
        const isMuted = activeLaneIndex !== null && !isActive;
        return (
          <View key={lane.id} style={[styles.lane, { width: laneWidth }]}>
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: withAlpha(lane.color, isActive ? 0.3 : 0.12),
                  borderColor: isActive ? withAlpha(lane.color, 0.7) : 'transparent',
                  opacity: isMuted ? 0.45 : 1,
                },
              ]}>
              <View style={[styles.dot, { backgroundColor: lane.color }]} />
              <Text
                style={[styles.label, { color: lighten(lane.color, isActive ? 0.6 : 0.35) }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}>
                {lane.label(t)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: TIMELINE_HORIZONTAL_PADDING,
    height: LANE_HEADER_HEIGHT,
    alignItems: 'flex-start',
  },
  rowMirrored: {
    flexDirection: 'row-reverse',
  },
  lane: {
    paddingHorizontal: PILL_GAP / 2,
  },
  pill: {
    height: 26,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
});
