import { Modal, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useI18n } from '@/lib/i18n';

const DAYS_BACK = 30;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date) {
  return a.getTime() === b.getTime();
}

interface DayPickerSheetProps {
  selectedDate: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
}

export function DayPickerSheet({ selectedDate, onClose, onSelect }: DayPickerSheetProps) {
  const { t, localeTag } = useI18n();
  const today = startOfDay(new Date());
  const days = Array.from({ length: DAYS_BACK }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    return date;
  });

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{t.dayPicker.title}</Text>
          <ScrollView style={styles.list}>
            {days.map((date) => {
              const isToday = isSameDay(date, today);
              const isSelected = isSameDay(date, startOfDay(selectedDate));
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
