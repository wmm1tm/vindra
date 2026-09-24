import { StyleSheet, Text, View } from 'react-native';

import { EventIcon } from '@/components/ui/event-icon';
import { withAlpha } from '@/lib/color';

const ACCENT = '#D6A866';

/** Eén uitlegregel in de intro: klein amber icoon links, korte zin rechts. */
export function OnboardingTip({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.tip}>
      <View style={styles.icon}>
        <EventIcon name={icon} set="mci" size={18} color={ACCENT} />
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: withAlpha(ACCENT, 0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    color: '#F1EEE7',
    fontSize: 15,
    lineHeight: 21,
    paddingTop: 6,
  },
});
