import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

// Hoe ver (in px, naar links dus negatief) geveegd moet zijn voordat `onTrigger` afgaat,
// en de harde grens waar de rij niet verder dan mag meebewegen.
const SWIPE_TRIGGER_X = -64;
const SWIPE_MAX_X = -96;

export function ToggleRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.toggleBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.toggleRow}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <Pressable key={option.value} onPress={() => onChange(option.value)}>
              <LinearGradient
                colors={active ? ['#F0C077', '#E3A857'] : ['#1b212a', '#12161c']}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={[styles.toggleOption, active && styles.toggleOptionActive]}>
                <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>{option.label}</Text>
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SwitchRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      <Pressable onPress={() => onChange(!value)}>
        <LinearGradient
          colors={value ? ['#F0C077', '#E3A857'] : ['#1b212a', '#12161c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.switchTrack, value && styles.switchTrackActive]}>
          <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

/** Small uppercase section header, matching the archived-section label already used in
 * children-settings-sheet — reused here to group rows into scannable sections. */
export function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Wraps arbitrary row content so it only triggers `onTrigger` on a left-swipe past a
 * threshold, instead of a tap — used where a plain Pressable turned out to be unreliable
 * (see "Kinderen"/"Wiel" in settings), for the destructive "delete this day" row (whose
 * own confirmation Alert.alert is what `onTrigger` should open, not the deletion itself),
 * and for a per-row "•••" action menu (see children-settings-sheet) — one consistent
 * gesture everywhere a row needs a secondary action instead of a separate tap target.
 * The pan gesture only claims a clearly-horizontal drag (`activeOffsetX`/`failOffsetY`),
 * so a normal vertical scroll over this row still reaches the surrounding ScrollView, and
 * a plain tap still reaches whatever's inside `children` (e.g. children-settings-sheet's
 * own row-select Pressable) since the gesture never activates for it. */
export function SwipeToReveal({
  onTrigger,
  danger = false,
  revealIcon,
  children,
}: {
  onTrigger: () => void;
  danger?: boolean;
  revealIcon: IconName;
  children: React.ReactNode;
}) {
  const translateX = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      translateX.value = Math.max(Math.min(e.translationX, 0), SWIPE_MAX_X);
    })
    .onEnd(() => {
      const triggered = translateX.value <= SWIPE_TRIGGER_X;
      translateX.value = withSpring(0, { damping: 22, stiffness: 320 });
      if (triggered) runOnJS(onTrigger)();
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const revealStyle = useAnimatedStyle(() => ({
    opacity: Math.min(translateX.value / SWIPE_TRIGGER_X, 1),
  }));

  return (
    <View style={styles.swipeWrapper}>
      <Animated.View
        pointerEvents="none"
        style={[styles.swipeReveal, danger && styles.swipeRevealDanger, revealStyle]}>
        <MaterialCommunityIcons name={revealIcon} size={18} color="#ECEDEE" />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

/** A row that triggers its action (opening another screen, or a destructive
 * confirmation) on a left-swipe past a threshold — see SwipeToReveal. */
export function SwipeActionRow({
  label,
  hint,
  icon,
  onTrigger,
  danger = false,
}: {
  label: string;
  hint?: string;
  icon: string;
  onTrigger: () => void;
  danger?: boolean;
}) {
  return (
    <SwipeToReveal onTrigger={onTrigger} danger={danger} revealIcon={danger ? 'trash-can-outline' : 'chevron-double-left'}>
      <LinearGradient
        colors={['#1c222c', '#141920']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.navRow, styles.swipeRow]}>
        <LinearGradient colors={['#333c4a', '#242b35']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.navIcon}>
          <MaterialCommunityIcons name={icon as IconName} size={18} color="#ECEDEE" />
        </LinearGradient>
        <View style={styles.swipeTextColumn}>
          <Text style={styles.navLabel}>{label}</Text>
          {hint && <Text style={styles.swipeHint}>{hint}</Text>}
        </View>
        <MaterialCommunityIcons name="gesture-swipe-left" size={18} color="#8B95A1" />
      </LinearGradient>
    </SwipeToReveal>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    color: '#ECEDEE',
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    color: '#8B95A1',
    fontSize: 12,
    marginTop: 2,
  },
  toggleBlock: {
    marginTop: 10,
    gap: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // Content-sized rather than flex:1 — with only two short options (°C/°F, ml/cc) that
  // looked the same either way, but the language row can hold 7 options of very
  // different lengths ("Toestel" vs. "Português"), where flex:1 would squeeze every
  // label onto one unreadably narrow row instead of wrapping to fit.
  toggleOption: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  toggleOptionActive: {
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#E3A857',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  toggleLabel: {
    color: '#ECEDEE',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleLabelActive: {
    color: '#12161c',
  },
  switchRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchText: {
    flex: 1,
  },
  switchTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  switchTrackActive: {
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#E3A857',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8B95A1',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  switchThumbActive: {
    backgroundColor: '#171a1f',
    alignSelf: 'flex-end',
  },
  navRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  navIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  navLabel: {
    flex: 1,
    color: '#ECEDEE',
    fontSize: 14,
    fontWeight: '600',
  },
  swipeWrapper: {
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  // navRow's own marginTop would otherwise leave a gap above the row, inside
  // swipeWrapper's bounds, where the absolutely-positioned reveal color would show
  // through unaligned — swipeWrapper carries that spacing instead.
  swipeRow: {
    marginTop: 0,
  },
  swipeReveal: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#5B8FB0',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 20,
  },
  swipeRevealDanger: {
    backgroundColor: '#C97B7B',
  },
  swipeTextColumn: {
    flex: 1,
    gap: 2,
  },
  swipeHint: {
    color: '#8B95A1',
    fontSize: 11,
  },
  sectionLabel: {
    color: '#8B95A1',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 2,
  },
});
