import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { getFirstEventTime } from '@/db/events';
import { useActiveChild } from '@/lib/active-child-context';
import { addDays, daysBetween, isSameDay, logicalDay } from '@/lib/day-window';
import { useI18n } from '@/lib/i18n';
import { usePreferences } from '@/lib/preferences-context';

/** Minstens zoveel dagen in de lijst, ook bij een nieuwe gebruiker. */
const MIN_DAYS_BACK = 30;

interface DayPickerSheetProps {
  selectedDate: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
}

/** Kies een logische dag. Gaat terug tot de dag van je eerste log (minstens 30 dagen) —
 * er is geen geschiedenisgrens, dus ook oudere dagen blijven bereikbaar. */
export function DayPickerSheet({ selectedDate, onClose, onSelect }: DayPickerSheetProps) {
  const db = useSQLiteContext();
  const { childId } = useActiveChild();
  const { dayStartHour } = usePreferences();
  const { t, localeTag } = useI18n();
  const [firstEventTime, setFirstEventTime] = useState<number | null>(null);

  useEffect(() => {
    if (!childId) return;
    getFirstEventTime(db, childId).then(setFirstEventTime);
  }, [db, childId]);

  const today = logicalDay(new Date(), dayStartHour);
  const daysBack =
    firstEventTime === null
      ? MIN_DAYS_BACK
      : Math.max(MIN_DAYS_BACK, daysBetween(logicalDay(new Date(firstEventTime), dayStartHour), today) + 1);
  const days = Array.from({ length: daysBack }, (_, i) => addDays(today, -i));

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{t.dayPicker.title}</Text>
          <ScrollView style={styles.list}>
            {days.map((date) => {
              const isToday = isSameDay(date, today);
              const isSelected = isSameDay(date, selectedDate);
              const label = isToday
                ? t.common.today
                : new Intl.DateTimeFormat(localeTag, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  }).format(date);

              return (
                <Pressable
                  key={date.toISOString()}
                  style={[styles.row, isSelected && styles.rowSelected]}
                  onPress={() => onSelect(date)}>
                  <Text style={[styles.rowLabel, isSelected && styles.rowLabelSelected]}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 300,
    maxHeight: '70%',
    backgroundColor: '#1C252A',
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  title: {
    color: '#F1EEE7',
    fontSize: 17,
    fontWeight: '600',
  },
  list: {
    maxHeight: 380,
  },
  row: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  rowSelected: {
    borderRadius: 8,
    backgroundColor: 'rgba(227, 168, 87, 0.15)',
  },
  rowLabel: {
    color: '#F1EEE7',
    fontSize: 15,
  },
  rowLabelSelected: {
    color: '#D6A866',
    fontWeight: '600',
  },
});
