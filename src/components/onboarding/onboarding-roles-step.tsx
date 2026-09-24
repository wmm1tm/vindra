import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EventIcon } from '@/components/ui/event-icon';
import { MAX_ACTIVE_WHEEL_ENTRIES } from '@/constants/event-types';
import { withAlpha } from '@/lib/color';
import { useI18n } from '@/lib/i18n';
import { OPTIONAL_WHEEL_ENTRIES, wheelFromSelection } from '@/lib/onboarding-wheel';

interface OnboardingRolesStepProps {
  selected: ReadonlySet<string>;
  onToggle: (entryId: string) => void;
}

/** Intro-stap "wat speelt er bij je kind?": zet de conditie-specifieke typen (standaard
 * uit) desgewenst op het wiel. Toont meteen welke basisknoppen plaatsmaken als het samen
 * niet onder het maximum past, zodat het wiel nooit ongemerkt verandert. */
export function OnboardingRolesStep({ selected, onToggle }: OnboardingRolesStepProps) {
  const { t } = useI18n();
  const hints: Record<string, string> = t.onboarding.roleHints;
  const { dropped } = wheelFromSelection(selected);

  return (
    <View style={styles.page}>
      <Text style={styles.title}>{t.onboarding.rolesTitle}</Text>
      <Text style={styles.body}>{t.onboarding.rolesBody}</Text>
      <View style={styles.list}>
        {OPTIONAL_WHEEL_ENTRIES.map((entry) => {
          const active = selected.has(entry.id);
          const label = entry.label(t);
          return (
            <Pressable
              key={entry.id}
              onPress={() => {
                Haptics.selectionAsync();
                onToggle(entry.id);
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={label}
              accessibilityHint={hints[entry.id]}
              style={[
                styles.card,
                {
                  borderColor: active ? entry.color : withAlpha(entry.color, 0.25),
                  backgroundColor: active ? withAlpha(entry.color, 0.16) : '#1C252A',
                },
              ]}>
              <View style={[styles.icon, { backgroundColor: entry.color }]}>
                <EventIcon name={entry.icon} set={entry.iconSet} size={20} color="#12171C" />
              </View>
              <View style={styles.texts}>
                <Text style={styles.label}>{label}</Text>
                {hints[entry.id] ? <Text style={styles.hint}>{hints[entry.id]}</Text> : null}
              </View>
              <View style={[styles.check, active && { backgroundColor: entry.color, borderColor: entry.color }]}>
                {active && <MaterialCommunityIcons name="check" size={14} color="#12171C" />}
              </View>
            </Pressable>
          );
        })}
      </View>
      {dropped.length > 0 && (
        <Text style={styles.roomNote}>
          {t.onboarding.rolesRoomNote(MAX_ACTIVE_WHEEL_ENTRIES, dropped.map((entry) => entry.label(t)).join(', '))}
        </Text>
      )}
      <Text style={styles.footnote}>{t.onboarding.rolesFootnote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 12,
  },
  title: {
    color: '#F1EEE7',
    fontSize: 26,
    fontWeight: '700',
  },
  body: {
    color: '#C9CFD1',
    fontSize: 16,
    lineHeight: 23,
  },
  list: {
    gap: 8,
    marginTop: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: '#F1EEE7',
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    color: '#AAB4B6',
    fontSize: 13,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#3a4250',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomNote: {
    color: '#D6A866',
    fontSize: 13,
    lineHeight: 18,
  },
  footnote: {
    color: '#7F898C',
    fontSize: 13,
    lineHeight: 18,
  },
});
