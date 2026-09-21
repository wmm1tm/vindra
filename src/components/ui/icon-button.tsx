import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

const SIZE = 36;

interface IconButtonProps {
  onPress: () => void;
  hitSlop?: number;
  /** Lit/amber-glow variant — used for a toggle that's currently on (e.g. night mode). */
  active?: boolean;
  children: ReactNode;
}

/** Small round icon button (header actions like rating/report/night-mode/settings) with
 * the app's "soft depth" treatment: a subtle gradient fill instead of a flat color, plus
 * a colored ambient shadow (amber, only when `active`) instead of a plain grey one. */
export function IconButton({ onPress, hitSlop, active = false, children }: IconButtonProps) {
  return (
    <Pressable onPress={onPress} hitSlop={hitSlop} style={active ? styles.wrapperActive : styles.wrapper}>
      <LinearGradient
        colors={active ? ['#2c2119', '#1d1712'] : ['#252c38', '#181d25']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[styles.fill, active && styles.fillActive]}>
        {children}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  wrapperActive: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    shadowColor: '#E0673A',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  fill: {
    flex: 1,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  fillActive: {
    borderColor: 'rgba(224,103,58,0.35)',
  },
});
