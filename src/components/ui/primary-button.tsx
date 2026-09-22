import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** 'accent' (default) is the amber call-to-action used for "Opslaan"/confirm buttons;
   * 'neutral' is the darker secondary style used for export/import/file-picker buttons. */
  variant?: 'accent' | 'neutral';
  style?: StyleProp<ViewStyle>;
}

const ACCENT_COLORS = ['#E5BE87', '#D6A866'] as const;
const NEUTRAL_COLORS = ['#1c222c', '#12171C'] as const;

/** Shared "soft depth" button: the same gradient-fill Opslaan/Exporteren/Importeren
 * button used to be copy-pasted with a flat background across settings-sheet.tsx,
 * wheel-settings-sheet.tsx and children-settings-sheet.tsx. */
export function PrimaryButton({ label, onPress, disabled = false, loading = false, variant = 'accent', style }: PrimaryButtonProps) {
  const isAccent = variant === 'accent';
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={[style, disabled && styles.disabled]}>
      <LinearGradient
        colors={isAccent ? ACCENT_COLORS : NEUTRAL_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.button, isAccent ? styles.accentShadow : styles.neutralBorder]}>
        {loading ? (
          <ActivityIndicator size="small" color={isAccent ? '#12171C' : '#F1EEE7'} />
        ) : (
          <Text style={isAccent ? styles.accentLabel : styles.neutralLabel}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentShadow: {
    shadowColor: '#D6A866',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  neutralBorder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  disabled: {
    opacity: 0.5,
  },
  accentLabel: {
    color: '#12171C',
    fontWeight: '600',
    fontSize: 13,
  },
  neutralLabel: {
    color: '#F1EEE7',
    fontWeight: '600',
    fontSize: 13,
  },
});
