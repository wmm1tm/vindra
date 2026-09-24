import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { withAlpha } from '@/lib/color';
import { useI18n } from '@/lib/i18n';

export const HUB_SIZE = 52;
const HUB_EDGE_INSET = 14;
const HUB_SWIPE_THRESHOLD = 36;
const HUB_LONG_PRESS_MS = 380;
// Vindra's amber accent (zelfde als PrimaryButton/NowLine), zodat de hub bij de rest van
// de app hoort maar niet als een extra (gekleurde) logknop leest.
const HUB_COLOR = '#D6A866';

interface WheelHubProps {
  mirrored: boolean;
  /** Hoogte van het draaipunt van het wiel: de hub staat op dezelfde hoogte, in het hart
   * van de boog, zodat hij leest als "het midden van de draaiknop". */
  y: number;
  expanded: boolean;
  onSetExpanded: (expanded: boolean) => void;
  /** Lang drukken: wiel aanpassen (zelfde patroon als lang drukken op het iOS-beginscherm
   * om apps te schikken). */
  onCustomize: () => void;
}

/** Vaste knop in het hart van het wiel (vervangt het smalle randhandvat `WheelHandle`).
 * - Tik: wiel in- of uitklappen.
 * - Veeg naar de rand / naar het midden: in- of uitklappen (zoals het oude handvat).
 * - Lang drukken: stevige tik, knop veert, "Wiel aanpassen" opent.
 * Het icoon is een neutrale "draaiknop/regelaar" (tune-variant): het wiel is iets wat je
 * instelt, en een neutraal glyph voorkomt dat de knop een oordeel lijkt te geven. */
export function WheelHub({ mirrored, y, expanded, onSetExpanded, onCustomize }: WheelHubProps) {
  const { t } = useI18n();
  const scale = useSharedValue(1);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onEnd((e) => {
      // Positief = naar rechts geveegd. Bij de normale (niet-gespiegelde) boog rechtsonder
      // is "naar rechts" = naar de rand toe = inklappen; gespiegeld is dat andersom.
      const towardEdge = mirrored ? -e.translationX : e.translationX;
      if (towardEdge > HUB_SWIPE_THRESHOLD) runOnJS(onSetExpanded)(false);
      else if (towardEdge < -HUB_SWIPE_THRESHOLD) runOnJS(onSetExpanded)(true);
    });

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    scale.value = withSequence(withTiming(1.18, { duration: 120 }), withSpring(1, { damping: 10, stiffness: 260 }));
    onCustomize();
  };

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const sideStyle = mirrored ? { left: HUB_EDGE_INSET } : { right: HUB_EDGE_INSET };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.wrapper, { top: y - HUB_SIZE / 2 }, sideStyle, animatedStyle]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSetExpanded(!expanded);
          }}
          onLongPress={handleLongPress}
          delayLongPress={HUB_LONG_PRESS_MS}
          accessibilityRole="button"
          accessibilityLabel={expanded ? t.wheel.collapseWheelLabel : t.wheel.expandWheelLabel}
          accessibilityHint={t.wheel.hubHint}
          style={styles.pressable}>
          <LinearGradient
            colors={['#252c38', '#181d25', '#12171C']}
            locations={[0, 0.6, 1]}
            start={{ x: 0.3, y: 0.15 }}
            end={{ x: 0.8, y: 0.95 }}
            style={styles.fill}>
            <LinearGradient
              colors={[withAlpha('#FFFFFF', 0.1), withAlpha('#FFFFFF', 0)]}
              pointerEvents="none"
              style={styles.glossCap}
            />
            <MaterialCommunityIcons name="tune-variant" size={24} color={HUB_COLOR} />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    width: HUB_SIZE,
    height: HUB_SIZE,
    borderRadius: HUB_SIZE / 2,
    shadowColor: HUB_COLOR,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  pressable: {
    flex: 1,
    borderRadius: HUB_SIZE / 2,
    borderWidth: 2,
    borderColor: HUB_COLOR,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glossCap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '58%',
  },
});
