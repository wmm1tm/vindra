import { StyleSheet, Text, View } from 'react-native';

import { TIMELINE_HORIZONTAL_PADDING, TIMELINE_LANES } from '@/constants/timeline-lanes';
import { useI18n } from '@/lib/i18n';

interface LaneHeaderProps {
  mirrored?: boolean;
  laneWidth: number;
  /** Width of the hour-labels spacer this header aligns with — rendered as part of the
   * same reversible row as the lanes themselves (not a separate sibling wrapper), so
   * mirroring flips the spacer and the lane order together in one go. Reversing them in
   * two separate containers would flip which side the spacer lands on without also
   * flipping the lanes' internal order, leaving lane 0 ("Slaap") on the wrong edge. */
  hourColumnWidth: number;
}

/** Vaste kolomkoppen (SLAAP / VOEDING / LUIER / OVERIG) boven de tijdlijn — zoomonafhankelijk,
 * dus geen pixelsPerHour nodig. Blijft buiten de ScrollView staan (zie app/index.tsx) zodat
 * het niet meescrolt met de uren. */
export function LaneHeader({ mirrored = false, laneWidth, hourColumnWidth }: LaneHeaderProps) {
  const { t } = useI18n();

  return (
    <View style={[styles.row, mirrored && styles.rowMirrored]}>
      <View style={{ width: hourColumnWidth }} />
      {TIMELINE_LANES.map((lane) => (
        <View key={lane.id} style={[styles.lane, { width: laneWidth }]}>
          <Text style={styles.label} numberOfLines={1}>
            {lane.label(t)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: TIMELINE_HORIZONTAL_PADDING,
  },
  rowMirrored: {
    flexDirection: 'row-reverse',
  },
  lane: {
    alignItems: 'center',
  },
  label: {
    color: '#AAB4B6',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
