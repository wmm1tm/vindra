import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { EVENT_TYPES, SECOND_LEVEL_OPTIONS } from '@/constants/event-types';
import { updateEventEdit, type EventRow } from '@/db/events';
import {
  AMOUNT_KINDS,
  formatEventDetailLine,
  formatEventTimeLabel,
  formatTemperature,
  formatVolume,
} from '@/lib/event-summary';
import { useI18n } from '@/lib/i18n';
import { usePreferences } from '@/lib/preferences-context';

function currentOptionId(event: EventRow): string | null {
  const options = SECOND_LEVEL_OPTIONS[event.kind];
  if (!options) return null;
  const match = options.find(
    (o) => (o.details.side ?? null) === event.side && (o.details.variant ?? null) === event.variant
  );
  return match?.id ?? null;
}

interface EventDetailSheetProps {
  event: EventRow;
  onClose: () => void;
  onDelete: () => void;
  onSaved: (row: EventRow) => void;
}

export function EventDetailSheet({ event, onClose, onDelete, onSaved }: EventDetailSheetProps) {
  const db = useSQLiteContext();
  const { timeFormat, tempUnit, volumeUnit } = usePreferences();
  const { t } = useI18n();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editing, setEditing] = useState(false);

  const start = new Date(event.start_at);
  const end = event.end_at ? new Date(event.end_at) : null;

  const [startHour, setStartHour] = useState(String(start.getHours()));
  const [startMinute, setStartMinute] = useState(String(start.getMinutes()));
  const [endHour, setEndHour] = useState(end ? String(end.getHours()) : '');
  const [endMinute, setEndMinute] = useState(end ? String(end.getMinutes()) : '');
  // Springt automatisch door naar het minuut-veld zodra het uur-veld 2 cijfers heeft.
  const startMinuteRef = useRef<TextInput>(null);
  const endMinuteRef = useRef<TextInput>(null);
  const [noteValue, setNoteValue] = useState(event.note ?? '');
  const [amountValue, setAmountValue] = useState(event.amount_ml !== null ? String(event.amount_ml) : '');
  const [optionId, setOptionId] = useState(currentOptionId(event));
  const [antecedentValue, setAntecedentValue] = useState(event.antecedent ?? '');
  const [locationValue, setLocationValue] = useState(event.location ?? '');
  const [whatHelpedValue, setWhatHelpedValue] = useState(event.what_helped ?? '');

  const type = EVENT_TYPES[event.kind];
  const options = SECOND_LEVEL_OPTIONS[event.kind];
  const showAmount = AMOUNT_KINDS.has(event.kind);
  const supportsEndTime = type.isDuration;

  const detail = formatEventDetailLine(event, t);
  const timeLabel = formatEventTimeLabel(event, timeFormat, t);
  // ABC-velden (aanleiding/plek/wat hielp) — alleen zinvol bij 'gedrag', zie
  // db/schema.ts CREATE_SCHEMA_V12 en het onderzoek dat hiertoe leidde (PLAN.md).
  const showAbcFields = event.kind === 'gedrag';

  const startEditing = () => {
    setStartHour(String(start.getHours()));
    setStartMinute(String(start.getMinutes()));
    setEndHour(end ? String(end.getHours()) : '');
    setEndMinute(end ? String(end.getMinutes()) : '');
    setNoteValue(event.note ?? '');
    setAmountValue(event.amount_ml !== null ? String(event.amount_ml) : '');
    setOptionId(currentOptionId(event));
    setAntecedentValue(event.antecedent ?? '');
    setLocationValue(event.location ?? '');
    setWhatHelpedValue(event.what_helped ?? '');
    setEditing(true);
  };

  const clampedTime = (date: Date, hourStr: string, minuteStr: string) => {
    const next = new Date(date);
    const hours = Math.min(Math.max(Number(hourStr) || 0, 0), 23);
    const minutes = Math.min(Math.max(Number(minuteStr) || 0, 0), 59);
    next.setHours(hours, minutes, 0, 0);
    return next;
  };

  const handleSave = () => {
    const newStartAt = clampedTime(start, startHour, startMinute);
    const hasEndInput = endHour.trim() !== '' && endMinute.trim() !== '';
    const newEndAt = hasEndInput ? clampedTime(end ?? start, endHour, endMinute) : null;
    // "0:00" (or any clock time earlier than the start) means the end of the day the
    // event started, i.e. the start of the next calendar day — not a moment before it
    // even began. Roll forward a day rather than saving a negative/zero-length span.
    if (newEndAt && newEndAt.getTime() < newStartAt.getTime()) {
      newEndAt.setDate(newEndAt.getDate() + 1);
    }
    const option = options?.find((o) => o.id === optionId);

    updateEventEdit(db, event.id, {
      startAt: newStartAt,
      endAt: newEndAt,
      note: noteValue.trim() || null,
      amountMl: showAmount && amountValue.trim() ? Number(amountValue) : null,
      details: option?.details ?? {},
      antecedent: showAbcFields ? antecedentValue.trim() || null : event.antecedent,
      location: showAbcFields ? locationValue.trim() || null : event.location,
      whatHelped: showAbcFields ? whatHelpedValue.trim() || null : event.what_helped,
    }).then((updatedAt) => {
      onSaved({
        ...event,
        start_at: newStartAt.toISOString(),
        end_at: newEndAt ? newEndAt.toISOString() : null,
        note: noteValue.trim() || null,
        amount_ml: showAmount && amountValue.trim() ? Number(amountValue) : null,
        side: option?.details.side ?? null,
        variant: option?.details.variant ?? null,
        antecedent: showAbcFields ? antecedentValue.trim() || null : event.antecedent,
        location: showAbcFields ? locationValue.trim() || null : event.location,
        what_helped: showAbcFields ? whatHelpedValue.trim() || null : event.what_helped,
        updated_at: updatedAt,
      });
      onClose();
    });
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={[styles.badge, { backgroundColor: type.color }]}>
            <Text style={styles.badgeLabel}>{type.label(t)}</Text>
          </View>

          {!editing && (
            <>
              <Text style={styles.time}>{timeLabel}</Text>
              {detail && <Text style={styles.detail}>{detail}</Text>}
              {event.amount_ml !== null && (
                <Text style={styles.detail}>{formatVolume(event.amount_ml, volumeUnit)}</Text>
              )}
              {event.temperature_c !== null && (
                <Text style={styles.detail}>{formatTemperature(event.temperature_c, tempUnit)}</Text>
              )}
              {event.note && <Text style={styles.note}>{event.note}</Text>}
              {showAbcFields && event.antecedent && (
                <Text style={styles.note}>
                  {t.eventDetail.antecedentLabel}: {event.antecedent}
                </Text>
              )}
              {showAbcFields && event.location && (
                <Text style={styles.note}>
                  {t.eventDetail.locationLabel}: {event.location}
                </Text>
              )}
              {showAbcFields && event.what_helped && (
                <Text style={styles.note}>
                  {t.eventDetail.whatHelpedLabel}: {event.what_helped}
                </Text>
              )}

              <View style={styles.actionsRow}>
                <Pressable onPress={startEditing}>
                  <Text style={styles.editLabel}>{t.eventDetail.edit}</Text>
                </Pressable>
                {confirmingDelete ? (
                  <Pressable style={styles.deleteConfirmButton} onPress={onDelete}>
                    <Text style={styles.deleteConfirmLabel}>{t.eventDetail.confirmDelete}</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => setConfirmingDelete(true)}>
                    <Text style={styles.deleteLabel}>{t.eventDetail.delete}</Text>
                  </Pressable>
                )}
              </View>
            </>
          )}

          {editing && (
            <>
              <View style={styles.row}>
                <Text style={styles.fieldLabel}>{t.eventDetail.time}</Text>
                <TextInput
                  style={styles.timeInput}
                  value={startHour}
                  onChangeText={(text) => {
                    setStartHour(text);
                    if (text.length === 2) startMinuteRef.current?.focus();
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                  placeholder={t.wheel.hourPlaceholder}
                  placeholderTextColor="#8B95A1"
                />
                <TextInput
                  ref={startMinuteRef}
                  style={styles.timeInput}
                  value={startMinute}
                  onChangeText={setStartMinute}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                  placeholder={t.wheel.minutePlaceholder}
                  placeholderTextColor="#8B95A1"
                />
              </View>

              {supportsEndTime && (
                <View style={styles.row}>
                  <Text style={styles.fieldLabel}>{t.eventDetail.end}</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={endHour}
                    onChangeText={(text) => {
                      setEndHour(text);
                      if (text.length === 2) endMinuteRef.current?.focus();
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                    placeholder={t.wheel.hourPlaceholder}
                    placeholderTextColor="#8B95A1"
                  />
                  <TextInput
                    ref={endMinuteRef}
                    style={styles.timeInput}
                    value={endMinute}
                    onChangeText={setEndMinute}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                    placeholder={t.wheel.minutePlaceholder}
                    placeholderTextColor="#8B95A1"
                  />
                </View>
              )}

              {options && (
                <View style={styles.pillRow}>
                  {options.map((o) => (
                    <Pressable
                      key={o.id}
                      onPress={() => setOptionId(o.id)}
                      style={[styles.pill, optionId === o.id && { backgroundColor: type.color }]}>
                      <Text style={styles.pillLabel}>{o.label(t)}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {showAmount && (
                <View style={styles.row}>
                  <Text style={styles.fieldLabel}>{volumeUnit}</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amountValue}
                    onChangeText={setAmountValue}
                    keyboardType="number-pad"
                    placeholder="—"
                    placeholderTextColor="#8B95A1"
                  />
                </View>
              )}

              {showAbcFields && (
                <>
                  <TextInput
                    style={styles.noteInput}
                    value={antecedentValue}
                    onChangeText={setAntecedentValue}
                    placeholder={t.eventDetail.antecedentPlaceholder}
                    placeholderTextColor="#8B95A1"
                  />
                  <TextInput
                    style={styles.noteInput}
                    value={locationValue}
                    onChangeText={setLocationValue}
                    placeholder={t.eventDetail.locationPlaceholder}
                    placeholderTextColor="#8B95A1"
                  />
                  <TextInput
                    style={styles.noteInput}
                    value={whatHelpedValue}
                    onChangeText={setWhatHelpedValue}
                    placeholder={t.eventDetail.whatHelpedPlaceholder}
                    placeholderTextColor="#8B95A1"
                  />
                </>
              )}

              <TextInput
                style={styles.noteInput}
                value={noteValue}
                onChangeText={setNoteValue}
                placeholder={t.common.note}
                placeholderTextColor="#8B95A1"
              />

              <View style={styles.actionsRow}>
                <Pressable onPress={() => setEditing(false)}>
                  <Text style={styles.cancelLabel}>{t.common.cancel}</Text>
                </Pressable>
                <Pressable style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveLabel}>{t.common.save}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
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
    width: 280,
    backgroundColor: '#1c222b',
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeLabel: {
    color: '#12161c',
    fontWeight: '600',
    fontSize: 13,
  },
  time: {
    color: '#ECEDEE',
    fontSize: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  detail: {
    color: '#8B95A1',
    fontSize: 14,
  },
  note: {
    color: '#ECEDEE',
    fontSize: 14,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  editLabel: {
    color: '#E3A857',
    fontSize: 14,
  },
  deleteLabel: {
    color: '#C97B7B',
    fontSize: 14,
  },
  deleteConfirmButton: {
    backgroundColor: '#C97B7B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteConfirmLabel: {
    color: '#12161c',
    fontWeight: '600',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldLabel: {
    color: '#8B95A1',
    fontSize: 13,
    width: 32,
  },
  timeInput: {
    width: 44,
    color: '#ECEDEE',
    fontSize: 15,
    backgroundColor: '#12161c',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: 'center',
  },
  amountInput: {
    flex: 1,
    color: '#ECEDEE',
    fontSize: 15,
    backgroundColor: '#12161c',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  noteInput: {
    color: '#ECEDEE',
    fontSize: 14,
    backgroundColor: '#12161c',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    backgroundColor: '#12161c',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillLabel: {
    color: '#ECEDEE',
    fontSize: 12,
  },
  cancelLabel: {
    color: '#8B95A1',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#E3A857',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  saveLabel: {
    color: '#12161c',
    fontWeight: '600',
    fontSize: 14,
  },
});
