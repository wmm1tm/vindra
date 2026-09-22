import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EventIcon, type IconSet } from '@/components/ui/event-icon';
import { darken, lighten, withAlpha } from '@/lib/color';

export const WHEEL_BUTTON_SIZE = 66;

interface WheelButtonProps {
  color: string;
  x: number;
  y: number;
  onPress: () => void;
  icon?: string;
  iconSet?: IconSet;
  label?: string;
  caption?: string;
  accessibilityLabel?: string;
  dimmed?: boolean;
  selected?: boolean;
  /** Toont een slotje-badge en dimt de knop een stuk, maar blijft wél aantikbaar —
   * anders dan `dimmed` (dat de knop juist onbereikbaar maakt). De aanroeper (WheelArc)
   * vangt de tik op een locked knop af en toont de paywall i.p.v. het event te loggen. */
  locked?: boolean;
}

export function WheelButton({
  color,
  x,
  y,
  onPress,
  icon,
  iconSet = 'mci',
  label,
  caption,
  accessibilityLabel,
  dimmed = false,
  selected = false,
  locked = false,
}: WheelButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        pointerEvents={dimmed ? 'none' : 'auto'}
        style={[
          styles.button,
          {
            left: x - WHEEL_BUTTON_SIZE / 2,
            top: y - WHEEL_BUTTON_SIZE / 2,
            opacity: dimmed ? 0.25 : locked ? 0.55 : 1,
            // Ambient shadow tinted to the button's own color instead of plain black —
            // this is what gives the "soft depth" buttons their glow. iOS-only (Android
            // ignores shadowColor and falls back to its own grey elevation shadow).
            shadowColor: color,
          },
          selected && styles.selected,
        ]}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button">
        {/* Diagonal light-to-dark gradient approximates the radial glass-highlight look
            (RN's LinearGradient has no radial variant) — lightened top-left, true color
            at center, darkened bottom-right for a subtle 3D roundness. */}
        <LinearGradient
          colors={[lighten(color, 0.12), color, darken(color, 0.08)]}
          locations={[0, 0.55, 1]}
          start={{ x: 0.25, y: 0.12 }}
          end={{ x: 0.8, y: 0.95 }}
          style={styles.fill}>
          {/* Gloss cap getemperd (was 0.38) — minder glazig-glanzend, past beter bij een
              doelgroep die vaak onder stress logt (zie PLAN.md, look-and-feel-onderzoek
              2026-09-21). */}
          <LinearGradient
            colors={[withAlpha('#FFFFFF', 0.14), withAlpha('#FFFFFF', 0)]}
            pointerEvents="none"
            style={styles.glossCap}
          />
          {icon ? (
            <EventIcon name={icon} set={iconSet} size={32} color="#12171C" />
          ) : (
            <Text style={styles.label} numberOfLines={2}>
              {label}
            </Text>
          )}
        </LinearGradient>
        {locked && (
          <View style={styles.lockBadge}>
            <EventIcon name="lock" set="material" size={11} color="#F1EEE7" />
          </View>
        )}
      </Pressable>
      {caption && !dimmed && (
        <Text
          style={[styles.caption, { left: x - 40, top: y + WHEEL_BUTTON_SIZE / 2 + 4, color }]}
          numberOfLines={1}
          pointerEvents="none">
          {caption}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: WHEEL_BUTTON_SIZE,
    height: WHEEL_BUTTON_SIZE,
    borderRadius: WHEEL_BUTTON_SIZE / 2,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  fill: {
    flex: 1,
    borderRadius: WHEEL_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  glossCap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '58%',
  },
  selected: {
    borderWidth: 3,
    borderColor: '#F1EEE7',
  },
  lockBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#12171C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  label: {
    color: '#12171C',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  caption: {
    position: 'absolute',
    width: 80,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
