import { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import type { Dictionary } from '@/lib/i18n/translations';

/** Parses a day/month/year field trio into a Date, or undefined if any field is empty
 * or out of range — callers treat undefined as "leave the birth date as it was". Checks
 * the day against the actual length of the given month (not just a blanket 1-31), so an
 * impossible date like 31 February is rejected instead of silently rolling over into
 * March via JS's own `Date` overflow behaviour. */
export function parseBirthDate(day: string, month: string, year: string): Date | undefined {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  const currentYear = new Date().getFullYear();
  if (!d || !m || !y || m < 1 || m > 12 || y < 1900 || y > currentYear + 1) {
    return undefined;
  }
  const daysInMonth = new Date(y, m, 0).getDate();
  if (d < 1 || d > daysInMonth) return undefined;
  return new Date(y, m - 1, d);
}

/** Day/month/year trio shared by every place that asks for a birth date (add/edit child,
 * the onboarding-name banner) — each field selects its value on focus and jumps to the
 * next one automatically once it's full, so the whole date can be typed in one
 * continuous motion (same trick as the wheel's time entry). */
export function BirthDateFields({
  t,
  day,
  month,
  year,
  onChangeDay,
  onChangeMonth,
  onChangeYear,
  onSubmit,
}: {
  t: Dictionary;
  day: string;
  month: string;
  year: string;
  onChangeDay: (value: string) => void;
  onChangeMonth: (value: string) => void;
  onChangeYear: (value: string) => void;
  onSubmit: () => void;
}) {
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  return (
    <View style={styles.dateRow}>
      <TextInput
        style={styles.dateInput}
        value={day}
        onChangeText={(text) => {
          onChangeDay(text);
          if (text.length === 2) monthRef.current?.focus();
        }}
        keyboardType="number-pad"
        maxLength={2}
        selectTextOnFocus
        placeholder={t.children.dayPlaceholder}
        placeholderTextColor="#AAB4B6"
      />
      <TextInput
        ref={monthRef}
        style={styles.dateInput}
        value={month}
        onChangeText={(text) => {
          onChangeMonth(text);
          if (text.length === 2) yearRef.current?.focus();
        }}
        keyboardType="number-pad"
        maxLength={2}
        selectTextOnFocus
        placeholder={t.children.monthPlaceholder}
        placeholderTextColor="#AAB4B6"
      />
      <TextInput
        ref={yearRef}
        style={styles.dateInputYear}
        value={year}
        onChangeText={onChangeYear}
        keyboardType="number-pad"
        maxLength={4}
        selectTextOnFocus
        placeholder={t.children.yearPlaceholder}
        placeholderTextColor="#AAB4B6"
        onSubmitEditing={onSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInput: {
    width: 52,
    color: '#F1EEE7',
    fontSize: 15,
    backgroundColor: '#12171C',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    textAlign: 'center',
  },
  dateInputYear: {
    width: 72,
    color: '#F1EEE7',
    fontSize: 15,
    backgroundColor: '#12171C',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    textAlign: 'center',
  },
});
