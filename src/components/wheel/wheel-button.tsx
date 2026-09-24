import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EventIcon, type IconSet } from '@/components/ui/event-icon';
import { Design, glowStyle } from '@/constants/design';
import { withAlpha } from '@/lib/color';
import { useGlow } from '@/lib/glow-context';

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
  const glow = useGlow();
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
            // Gloed in de eigen kleur van de knop (stijl A "Gloeiring", design-voorstel
            // 2026-09-24). Alleen iOS; Android valt terug op zijn eigen grijze schaduw.
            ...glowStyle(color, glow, 0.55, 10),
            borderColor: color,
          },
          selected && styles.selected,
        ]}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button">
        {/* Stijl A: donkere kern met een lichte kant linksboven (benadert een radiaal verloop,
            RN's LinearGradient heeft geen radiale variant), icoon en ring in de eigen kleur. */}
        <LinearGradient
          colors={Design.coreGradient}
          locations={[0, 0.6, 1]}
          start={{ x: 0.3, y: 0.15 }}
          end={{ x: 0.8, y: 0.95 }}
          style={styles.fill}>
          <LinearGradient
            colors={[withAlpha(color, 0.18), withAlpha(color, 0)]}
            pointerEvents="none"
            style={styles.glossCap}
          />
          {icon ? (
            <EventIcon name={icon} set={iconSet} size={30} color={color} />
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
          style={[styles.caption, { left: x - 40, top: y + WHEEL_BUTTON_SIZE / 2 + 5 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
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
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
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
    color: '#F1EEE7',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  caption: {
    position: 'absolute',
    width: 80,
    fontSize: 11,
    fontWeight: '700',
    color: '#F1EEE7',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
    textAlign: 'center',
  },
});
