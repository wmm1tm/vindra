import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { useI18n } from '@/lib/i18n';

const HANDLE_WIDTH = 22;
const HANDLE_HEIGHT = 64;
const HANDLE_SWIPE_THRESHOLD = 36;

interface WheelHandleProps {
  mirrored: boolean;
  y: number;
  expanded: boolean;
  onSetExpanded: (expanded: boolean) => void;
}

/** Klein, altijd zichtbaar handvat bij de schermrand — bewust los van elke WheelButton
 * (en van de boog zelf), zodat een normale tik op een wielknop nooit met dit veeg-gebaar
 * kan botsen. De boog beslaat te veel van het scherm om er zelf één groot veeg-gebied
 * overheen te leggen zonder de tijdlijn-scroll/pinch eronder te verstoren. Wegvegen van
 * het midden (naar de rand toe) klapt in; naar het midden toe vegen klapt uit — een
 * gewone tik toggelt ook. */
export function WheelHandle({ mirrored, y, expanded, onSetExpanded }: WheelHandleProps) {
  const { t } = useI18n();

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onEnd((e) => {
      // Positief = naar rechts geveegd. Bij de normale (niet-gespiegelde) boog rechtsonder
      // is "naar rechts" = naar de rand toe = inklappen; gespiegeld is dat andersom.
      const towardEdge = mirrored ? -e.translationX : e.translationX;
      if (towardEdge > HANDLE_SWIPE_THRESHOLD) runOnJS(onSetExpanded)(false);
      else if (towardEdge < -HANDLE_SWIPE_THRESHOLD) runOnJS(onSetExpanded)(true);
    });

  const pointsRight = expanded !== mirrored;

  const cornerStyle = mirrored
    ? { left: 0, borderTopRightRadius: 12, borderBottomRightRadius: 12 }
    : { right: 0, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 };

  return (
    <GestureDetector gesture={pan}>
      <Pressable
        onPress={() => onSetExpanded(!expanded)}
        accessibilityLabel={expanded ? t.wheel.collapseWheelLabel : t.wheel.expandWheelLabel}
        style={[styles.wrapper, { top: y - HANDLE_HEIGHT / 2 }, cornerStyle]}>
        <LinearGradient
          colors={['#252c38', '#181d25']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.handle, cornerStyle]}>
          <MaterialCommunityIcons name={pointsRight ? 'chevron-right' : 'chevron-left'} size={16} color="#F1EEE7" />
        </LinearGradient>
      </Pressable>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    width: HANDLE_WIDTH,
    height: HANDLE_HEIGHT,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  handle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
