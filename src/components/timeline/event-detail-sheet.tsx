import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const [sensoryThresholdValue, setSensoryThresholdValue] = useState(event.sensory_threshold);
  const [sensoryResponseValue, setSensoryResponseValue] = useState(event.sensory_response);

  const type = EVENT_TYPES[event.kind];
  const options = SECOND_LEVEL_OPTIONS[event.kind];
  const showAmount = AMOUNT_KINDS.has(event.kind);
  const supportsEndTime = type.isDuration;

  const detail = formatEventDetailLine(event, t);
  const timeLabel = formatEventTimeLabel(event, timeFormat, t);
  // ABC-velden (aanleiding/plek/wat hielp) — bij 'gedrag' en de twee veiligheidskritische
  // conditie-specifieke typen die dezelfde klinische vraag oproepen ("wat ging eraan
  // vooraf, wat hielp?"), zie db/schema.ts CREATE_SCHEMA_V12 en PLAN.md.
  const showAbcFields = event.kind === 'gedrag' || event.kind === 'zelfverwonding' || event.kind === 'weglopen';
  // Dunn's Sensory Profile-uitbreiding — alleen zinvol bij 'prikkel', zie
  // db/schema.ts CREATE_SCHEMA_V13 en hetzelfde onderzoek als de ABC-velden.
  const showSensoryFields = event.kind === 'prikkel';

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
    setSensoryThresholdValue(event.sensory_threshold);
    setSensoryResponseValue(event.sensory_response);
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
      sensoryThreshold: showSensoryFields ? sensoryThresholdValue : event.sensory_threshold,
      sensoryResponse: showSensoryFields ? sensoryResponseValue : event.sensory_response,
    })
      .then((updatedAt) => {
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
          sensory_threshold: showSensoryFields ? sensoryThresholdValue : event.sensory_threshold,
          sensory_response: showSensoryFields ? sensoryResponseValue : event.sensory_response,
          updated_at: updatedAt,
        });
        onClose();
      })
      .catch((error) => {
        // Zonder dit bleef de modal stilzwijgend open bij een mislukte schrijfactie —
        // de gebruiker kon dan denken dat de wijziging wél was opgeslagen.
        console.error('[event-detail-sheet] opslaan mislukt', error);
        Alert.alert(t.eventDetail.saveErrorTitle, t.eventDetail.saveErrorMessage);
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
              {showSensoryFields && event.sensory_threshold && (
                <Text style={styles.note}>
                  {t.eventDetail.sensoryThresholdLabel}:{' '}
                  {event.sensory_threshold === 'laag'
                    ? t.eventDetail.sensoryThresholdLow
                    : t.eventDetail.sensoryThresholdHigh}
                </Text>
              )}
              {showSensoryFields && event.sensory_response && (
                <Text style={styles.note}>
                  {t.eventDetail.sensoryResponseLabel}:{' '}
                  {event.sensory_response === 'opzoekend'
                    ? t.eventDetail.sensoryResponseSeeking
                    : t.eventDetail.sensoryResponseAvoiding}
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
                  placeholderTextColor="#AAB4B6"
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
                  placeholderTextColor="#AAB4B6"
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
                    placeholderTextColor="#AAB4B6"
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
                    placeholderTextColor="#AAB4B6"
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
                    placeholderTextColor="#AAB4B6"
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
                    placeholderTextColor="#AAB4B6"
                  />
                  <TextInput
                    style={styles.noteInput}
                    value={locationValue}
                    onChangeText={setLocationValue}
                    placeholder={t.eventDetail.locationPlaceholder}
                    placeholderTextColor="#AAB4B6"
                  />
                  <TextInput
                    style={styles.noteInput}
                    value={whatHelpedValue}
                    onChangeText={setWhatHelpedValue}
                    placeholder={t.eventDetail.whatHelpedPlaceholder}
                    placeholderTextColor="#AAB4B6"
                  />
                </>
              )}

              {showSensoryFields && (
                <>
                  <Text style={styles.fieldLabel}>{t.eventDetail.sensoryThresholdLabel}</Text>
                  <Text style={styles.detail}>{t.eventDetail.sensoryThresholdHint}</Text>
                  <View style={styles.pillRow}>
                    <Pressable
                      onPress={() => setSensoryThresholdValue(sensoryThresholdValue === 'laag' ? null : 'laag')}
                      style={[styles.pill, sensoryThresholdValue === 'laag' && { backgroundColor: type.color }]}>
                      <Text style={styles.pillLabel}>{t.eventDetail.sensoryThresholdLow}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSensoryThresholdValue(sensoryThresholdValue === 'hoog' ? null : 'hoog')}
                      style={[styles.pill, sensoryThresholdValue === 'hoog' && { backgroundColor: type.color }]}>
                      <Text style={styles.pillLabel}>{t.eventDetail.sensoryThresholdHigh}</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.fieldLabel}>{t.eventDetail.sensoryResponseLabel}</Text>
                  <View style={styles.pillRow}>
                    <Pressable
                      onPress={() =>
                        setSensoryResponseValue(sensoryResponseValue === 'opzoekend' ? null : 'opzoekend')
                      }
                      style={[styles.pill, sensoryResponseValue === 'opzoekend' && { backgroundColor: type.color }]}>
                      <Text style={styles.pillLabel}>{t.eventDetail.sensoryResponseSeeking}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setSensoryResponseValue(sensoryResponseValue === 'vermijdend' ? null : 'vermijdend')
                      }
                      style={[styles.pill, sensoryResponseValue === 'vermijdend' && { backgroundColor: type.color }]}>
                      <Text style={styles.pillLabel}>{t.eventDetail.sensoryResponseAvoiding}</Text>
                    </Pressable>
                  </View>
                </>
              )}

              <TextInput
                style={styles.noteInput}
                value={noteValue}
                onChangeText={setNoteValue}
                placeholder={t.common.note}
                placeholderTextColor="#AAB4B6"
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
    backgroundColor: '#1C252A',
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
    color: '#12171C',
    fontWeight: '600',
    fontSize: 13,
  },
  time: {
    color: '#F1EEE7',
    fontSize: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  detail: {
    color: '#AAB4B6',
    fontSize: 14,
  },
  note: {
    color: '#F1EEE7',
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
    color: '#D6A866',
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
    color: '#12171C',
    fontWeight: '600',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldLabel: {
    color: '#AAB4B6',
    fontSize: 13,
    width: 32,
  },
  timeInput: {
    width: 44,
    color: '#F1EEE7',
    fontSize: 15,
    backgroundColor: '#12171C',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: 'center',
  },
  amountInput: {
    flex: 1,
    color: '#F1EEE7',
    fontSize: 15,
    backgroundColor: '#12171C',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  noteInput: {
    color: '#F1EEE7',
    fontSize: 14,
    backgroundColor: '#12171C',
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
    backgroundColor: '#12171C',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillLabel: {
    color: '#F1EEE7',
    fontSize: 12,
  },
  cancelLabel: {
    color: '#AAB4B6',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#D6A866',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  saveLabel: {
    color: '#12171C',
    fontWeight: '600',
    fontSize: 14,
  },
});
