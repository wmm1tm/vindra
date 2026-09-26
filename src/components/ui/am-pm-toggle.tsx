import { Pressable, StyleSheet, Text } from 'react-native';

/** AM/PM-schakelaar naast een uur/minuut-invoer in 12-uursnotatie. */
export function AmPmToggle({ pm, onChange }: { pm: boolean; onChange: (pm: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!pm)} hitSlop={6} style={styles.toggle}>
      <Text style={styles.label}>{pm ? 'PM' : 'AM'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: {
    minWidth: 44,
    backgroundColor: '#12161c',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  label: {
    color: '#E3A857',
    fontSize: 16,
    fontWeight: '600',
  },
});
