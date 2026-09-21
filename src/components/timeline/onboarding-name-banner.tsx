import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { BirthDateFields, parseBirthDate } from '@/components/settings/birth-date-fields';
import { PrimaryButton } from '@/components/ui/primary-button';
import { renameChild, updateChildBirthDate } from '@/db/child';
import { useI18n } from '@/lib/i18n';
import { usePreferences } from '@/lib/preferences-context';

interface OnboardingNameBannerProps {
  childId: string;
  /** Called after a successful save so the parent can refetch the child list/name — this
   * banner has no reason to know how that list is stored. */
  onSaved: () => void;
}

/** Nudges a fresh install to replace the auto-generated placeholder name (see
 * DEFAULT_CHILD_NAME) with a real one — shown by the caller only while the name is still
 * that placeholder (see app/index.tsx), never as a blocking step between install and the
 * first tap. Collapsed by default (a one-line invite) so it reads as a light nudge, not a
 * form demanding attention; expands in place on tap rather than opening a separate sheet,
 * since a full settings flow for two fields would undercut the "streamlined" point of not
 * gating first use on this in the first place. The × permanently dismisses (persisted);
 * collapsing back without saving is just local UI state, so it reappears collapsed next
 * time. */
export function OnboardingNameBanner({ childId, onSaved }: OnboardingNameBannerProps) {
  const db = useSQLiteContext();
  const { t } = useI18n();
  const preferences = usePreferences();
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [saving, setSaving] = useState(false);

  const handleDismiss = () => {
    preferences.save({ onboardingNameDismissed: true });
  };

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    await renameChild(db, childId, name.trim());
    const birthDate = parseBirthDate(day, month, year);
    if (birthDate) await updateChildBirthDate(db, childId, birthDate);
    setSaving(false);
    onSaved();
  };

  return (
    <LinearGradient colors={['#3a2f1a', '#241c10']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <Pressable style={styles.headerRow} onPress={() => setExpanded((value) => !value)}>
        <MaterialCommunityIcons name="baby-face-outline" size={18} color="#E3A857" />
        <Text style={styles.title} numberOfLines={1}>
          {t.onboarding.nameBannerTitle}
        </Text>
        <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#8B95A1" />
        <Pressable onPress={handleDismiss} hitSlop={8} style={styles.dismissButton}>
          <MaterialCommunityIcons name="close" size={16} color="#8B95A1" />
        </Pressable>
      </Pressable>

      {expanded && (
        <View style={styles.form}>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder={t.children.namePlaceholder}
            placeholderTextColor="#8B95A1"
            autoFocus
          />
          <Text style={styles.fieldLabel}>{t.children.birthDateLabel}</Text>
          <BirthDateFields
            t={t}
            day={day}
            month={month}
            year={year}
            onChangeDay={setDay}
            onChangeMonth={setMonth}
            onChangeYear={setYear}
            onSubmit={handleSave}
          />
          <PrimaryButton
            style={styles.saveButton}
            label={t.common.save}
            onPress={handleSave}
            disabled={!name.trim()}
            loading={saving}
          />
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(227,168,87,0.25)',
    shadowColor: '#E3A857',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    color: '#ECEDEE',
    fontSize: 13,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 2,
  },
  form: {
    marginTop: 12,
    gap: 8,
  },
  nameInput: {
    color: '#ECEDEE',
    fontSize: 15,
    backgroundColor: '#12161c',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  fieldLabel: {
    color: '#8B95A1',
    fontSize: 12,
  },
  saveButton: {
    marginTop: 2,
    alignSelf: 'flex-start',
  },
});
