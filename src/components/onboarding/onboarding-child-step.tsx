import { StyleSheet, Text, TextInput, View } from 'react-native';

import { BirthDateFields } from '@/components/settings/birth-date-fields';
import { useI18n } from '@/lib/i18n';

export interface ChildDraft {
  name: string;
  day: string;
  month: string;
  year: string;
}

interface OnboardingChildStepProps {
  draft: ChildDraft;
  onChange: (draft: ChildDraft) => void;
  onSubmit: () => void;
}

/** Intro-stap "voor wie houd je het bij?": naam + optionele geboortedatum van het actieve
 * kind. Zelfde velden als de naambanner en "Kinderen beheren"; het opslaan zelf doet de
 * aanroeper (OnboardingFlow) pas bij "Volgende", zodat "Overslaan" echt niets verandert. */
export function OnboardingChildStep({ draft, onChange, onSubmit }: OnboardingChildStepProps) {
  const { t } = useI18n();

  return (
    <View style={styles.page}>
      <Text style={styles.title}>{t.onboarding.childTitle}</Text>
      <Text style={styles.body}>{t.onboarding.childBody}</Text>
      <TextInput
        style={styles.nameInput}
        value={draft.name}
        onChangeText={(name) => onChange({ ...draft, name })}
        placeholder={t.children.namePlaceholder}
        placeholderTextColor="#AAB4B6"
        autoCapitalize="words"
        returnKeyType="next"
      />
      <Text style={styles.fieldLabel}>{t.children.birthDateLabel}</Text>
      <BirthDateFields
        t={t}
        day={draft.day}
        month={draft.month}
        year={draft.year}
        onChangeDay={(day) => onChange({ ...draft, day })}
        onChangeMonth={(month) => onChange({ ...draft, month })}
        onChangeYear={(year) => onChange({ ...draft, year })}
        onSubmit={onSubmit}
      />
      <Text style={styles.footnote}>{t.onboarding.childFootnote}</Text>
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
  nameInput: {
    color: '#F1EEE7',
    fontSize: 17,
    backgroundColor: '#12171C',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  fieldLabel: {
    color: '#AAB4B6',
    fontSize: 13,
    marginTop: 4,
  },
  footnote: {
    color: '#7F898C',
    fontSize: 13,
    marginTop: 4,
  },
});
