import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { HelpSheet } from '@/components/help/help-sheet';
import { PaywallScreen } from '@/components/paywall/paywall-screen';
import { ChildrenSettingsSheet } from '@/components/settings/children-settings-sheet';
import { SectionLabel, SwipeActionRow, SwitchRow, ToggleRow } from '@/components/settings/settings-rows';
import { SettingsSheetShell } from '@/components/settings/settings-sheet-shell';
import { SubscriptionSheet } from '@/components/settings/subscription-sheet';
import { WheelSettingsSheet } from '@/components/settings/wheel-settings-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import type { LanguageSetting, TempUnit, TimeFormat, VolumeUnit } from '@/db/child';
import { softDeleteEventsForDay, type EventRow } from '@/db/events';
import { useActiveChild } from '@/lib/active-child-context';
import { exportBackupJson, exportEventsCsv, importBackupFromUri } from '@/lib/backup';
import { useI18n } from '@/lib/i18n';
import { usePreferences } from '@/lib/preferences-context';
import { usePurchases } from '@/lib/purchases-context';

interface SettingsSheetProps {
  onClose: () => void;
  /** Dag die de tijdlijn op dit moment toont — bepaalt welke events de "verwijder alle
   * events van deze dag"-rij treft. */
  selectedDate: Date;
  /** Al opgemaakt label voor diezelfde dag (bv. "Vandaag" of de weekdagnaam), voor in de
   * bevestigingswaarschuwing — instellingen zelf weet niet of dit vandaag is. */
  dayLabel: string;
  /** De verwijderde rijen (met hun nieuwe deleted_at/updated_at) — de aanroeper filtert
   * ze net als bij een losse verwijdering uit zijn eigen state en pusht ze naar sync. */
  onDayEventsDeleted: (rows: EventRow[]) => void;
}

// Lang genoeg voor de sluit-animatie van Instellingen voordat de intro-Modal opent.
const REPLAY_AFTER_CLOSE_MS = 350;

function clampDayStartHour(text: string): number {
  const parsed = Number(text);
  return text.trim() && !Number.isNaN(parsed) ? Math.min(Math.max(Math.round(parsed), 0), 23) : 0;
}

export function SettingsSheet({ onClose, selectedDate, dayLabel, onDayEventsDeleted }: SettingsSheetProps) {
  const db = useSQLiteContext();
  const preferences = usePreferences();
  const { t } = useI18n();
  const { childId } = useActiveChild();
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(preferences.timeFormat);
  // Geen setter — geen UI-rij meer om ze te wijzigen (zie hieronder), maar de waarde
  // blijft nodig om ongewijzigd terug te geven aan save().
  const [tempUnit] = useState<TempUnit>(preferences.tempUnit);
  const [volumeUnit] = useState<VolumeUnit>(preferences.volumeUnit);
  const [leftHanded, setLeftHanded] = useState(preferences.leftHanded);
  const [dayStartHourValue, setDayStartHourValue] = useState(String(preferences.dayStartHour));
  const [nightModeAuto, setNightModeAuto] = useState(preferences.nightModeAuto);
  const [language, setLanguage] = useState<LanguageSetting>(preferences.language);
  const [saved, setSaved] = useState(false);
  const [showWheelSettings, setShowWheelSettings] = useState(false);
  const [exportBusy, setExportBusy] = useState<'csv' | 'json' | null>(null);
  const [pendingImportUri, setPendingImportUri] = useState<string | null>(null);
  const [pendingImportName, setPendingImportName] = useState<string | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showChildrenSettings, setShowChildrenSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { status: purchasesStatus } = usePurchases();

  const handleExportCsv = () => {
    if (!childId) return;
    setExportBusy('csv');
    exportEventsCsv(db, childId).finally(() => setExportBusy(null));
  };

  const handleExportJson = () => {
    if (purchasesStatus !== 'entitled') {
      setShowPaywall(true);
      return;
    }
    setExportBusy('json');
    exportBackupJson(db).finally(() => setExportBusy(null));
  };

  const handlePickImport = async () => {
    if (purchasesStatus !== 'entitled') {
      setShowPaywall(true);
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
    if (result.canceled || !result.assets?.[0]) return;
    setImportStatus(null);
    setPendingImportUri(result.assets[0].uri);
    setPendingImportName(result.assets[0].name);
  };

  const confirmImport = async () => {
    if (!pendingImportUri) return;
    setImportBusy(true);
    try {
      const { childCount, eventCount, ratingCount } = await importBackupFromUri(db, pendingImportUri, t);
      setImportStatus(t.settings.importResult(childCount, eventCount, ratingCount));
      await preferences.refresh();
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : t.settings.importError);
    }
    setImportBusy(false);
    setPendingImportUri(null);
    setPendingImportName(null);
  };

  const handleDeleteDay = () => {
    if (!childId) return;
    softDeleteEventsForDay(db, childId, selectedDate).then((rows) => {
      if (rows.length === 0) {
        Alert.alert(t.settings.deleteDayConfirmTitle, t.settings.deleteDayEmpty);
        return;
      }
      onDayEventsDeleted(rows);
      Alert.alert(t.settings.deleteDayConfirmTitle, t.settings.deleteDayDone(rows.length));
    });
  };

  const confirmDeleteDay = () => {
    Alert.alert(t.settings.deleteDayConfirmTitle, t.settings.deleteDayConfirmMessage(dayLabel), [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.settings.deleteDayConfirmButton, style: 'destructive', onPress: handleDeleteDay },
    ]);
  };

  const handleSave = () => {
    preferences
      .save({
        timeFormat,
        tempUnit,
        volumeUnit,
        leftHanded,
        dayStartHour: clampDayStartHour(dayStartHourValue),
        nightModeAuto,
        language,
      })
      .then(() => setSaved(true));
  };

  return (
    <SettingsSheetShell
      title={t.settings.title}
      onClose={onClose}
      footer={
        <>
          <Pressable onPress={onClose}>
            <Text style={styles.closeLabel}>{t.common.close}</Text>
          </Pressable>
          <PrimaryButton label={saved ? t.common.saved : t.common.save} onPress={handleSave} />
        </>
      }
      overlay={
        <>
          {showHelp && <HelpSheet onClose={() => setShowHelp(false)} />}
          {showWheelSettings && <WheelSettingsSheet onClose={() => setShowWheelSettings(false)} />}
          {showChildrenSettings && <ChildrenSettingsSheet onClose={() => setShowChildrenSettings(false)} />}
          {showSubscription && <SubscriptionSheet onClose={() => setShowSubscription(false)} />}
          {showPaywall && (
            <View style={styles.paywallOverlay}>
              <PaywallScreen onClose={() => setShowPaywall(false)} />
            </View>
          )}
        </>
      }>
        <SectionLabel label={t.settings.sectionHelp} />
        <SwipeActionRow
          label={t.settings.helpButton}
          hint={t.settings.swipeToOpenHint}
          icon="help-circle-outline"
          onTrigger={() => setShowHelp(true)}
        />
        <SwipeActionRow
          label={t.settings.replayOnboarding}
          hint={t.settings.swipeToOpenHint}
          icon="play-circle-outline"
          onTrigger={() => {
            // Eerst Instellingen dicht: twee native Modals tegelijk openen faalt op iOS
            // soms stil (zie SettingsSheetShell). Pas daarna de intro weer aanzetten.
            onClose();
            setTimeout(() => preferences.setOnboardingDone(false), REPLAY_AFTER_CLOSE_MS);
          }}
        />

        <SectionLabel label={t.settings.sectionDisplay} />
        <SwitchRow
          label={t.settings.leftHanded}
          hint={t.settings.leftHandedHint}
          value={leftHanded}
          onChange={(value) => {
            setLeftHanded(value);
            setSaved(false);
          }}
        />
        <SwitchRow
          label={t.settings.nightModeAuto}
          hint={t.settings.nightModeAutoHint}
          value={nightModeAuto}
          onChange={(value) => {
            setNightModeAuto(value);
            setSaved(false);
          }}
        />

        <SectionLabel label={t.settings.sectionTimeUnits} />
        <ToggleRow
          label={t.settings.timeFormat}
          value={timeFormat}
          onChange={(value) => {
            setTimeFormat(value);
            setSaved(false);
          }}
          options={[
            { value: '24h', label: t.settings.format24 },
            { value: '12h', label: t.settings.format12 },
          ]}
        />
        {/* Temperatuur-/volume-eenheid bewust weggelaten — geen enkel Vindra-event-type
            gebruikt amount_ml/temperature_c, in tegenstelling tot Nuvo. tempUnit/volumeUnit
            blijven wel als state bestaan (ongebruikte kolommen, zie PLAN.md) zodat save()
            hieronder niet hoeft te veranderen. */}
        <ToggleRow
          label={t.settings.language}
          value={language}
          onChange={(value) => {
            setLanguage(value);
            setSaved(false);
          }}
          options={[
            { value: 'system', label: t.settings.languageSystem },
            { value: 'nl', label: t.settings.languageNl },
            { value: 'en', label: t.settings.languageEn },
            { value: 'de', label: t.settings.languageDe },
            { value: 'es', label: t.settings.languageEs },
            { value: 'fr', label: t.settings.languageFr },
            { value: 'pt', label: t.settings.languagePt },
          ]}
        />
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>{t.settings.dayStart}</Text>
          <Text style={styles.hint}>{t.settings.dayStartHint}</Text>
          <TextInput
            style={styles.input}
            value={dayStartHourValue}
            onChangeText={(text) => {
              setDayStartHourValue(text);
              setSaved(false);
            }}
            onBlur={() => setDayStartHourValue(String(clampDayStartHour(dayStartHourValue)))}
            keyboardType="number-pad"
            maxLength={2}
            selectTextOnFocus
            placeholder="0-23"
            placeholderTextColor="#AAB4B6"
          />
        </View>

        <SectionLabel label={t.settings.sectionManage} />
        <SwipeActionRow
          label={t.settings.childrenButton}
          hint={t.settings.swipeToOpenHint}
          icon="baby-face-outline"
          onTrigger={() => setShowChildrenSettings(true)}
        />
        <SwipeActionRow
          label={t.settings.wheelButton}
          hint={t.settings.swipeToOpenHint}
          icon="chart-donut"
          onTrigger={() => setShowWheelSettings(true)}
        />
        <SwipeActionRow
          label={t.settings.subscriptionButton}
          hint={t.settings.swipeToOpenHint}
          icon="star-outline"
          onTrigger={() => setShowSubscription(true)}
        />

        <SectionLabel label={t.settings.sectionBackup} />
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>{t.settings.exportTitle}</Text>
          <Text style={styles.hint}>{t.settings.exportHint}</Text>
          <View style={styles.exportRow}>
            <PrimaryButton
              variant="neutral"
              style={styles.exportButton}
              label={t.settings.exportCsv}
              onPress={handleExportCsv}
              disabled={exportBusy !== null}
              loading={exportBusy === 'csv'}
            />
            <PrimaryButton
              variant="neutral"
              style={styles.exportButton}
              label={t.settings.exportJson}
              onPress={handleExportJson}
              disabled={exportBusy !== null}
              loading={exportBusy === 'json'}
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>{t.settings.importTitle}</Text>
          <Text style={styles.hint}>{t.settings.importHint}</Text>
          {pendingImportUri ? (
            <View style={styles.importConfirm}>
              <Text style={styles.hint} numberOfLines={1}>
                {pendingImportName}
              </Text>
              <View style={styles.exportRow}>
                <PrimaryButton
                  variant="neutral"
                  style={styles.exportButton}
                  label={t.common.cancel}
                  onPress={() => {
                    setPendingImportUri(null);
                    setPendingImportName(null);
                  }}
                />
                <PrimaryButton
                  style={styles.exportButton}
                  label={t.settings.confirmImport}
                  onPress={confirmImport}
                  loading={importBusy}
                />
              </View>
            </View>
          ) : (
            <PrimaryButton variant="neutral" style={styles.exportButton} label={t.settings.pickFile} onPress={handlePickImport} />
          )}
          {importStatus && <Text style={styles.hint}>{importStatus}</Text>}
        </View>

        <SectionLabel label={t.settings.sectionDanger} />
        <SwipeActionRow
          label={t.settings.deleteDayButton}
          hint={t.settings.swipeToDeleteHint}
          icon="trash-can-outline"
          danger
          onTrigger={confirmDeleteDay}
        />
    </SettingsSheetShell>
  );
}

const styles = StyleSheet.create({
  paywallOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fieldBlock: {
    marginTop: 10,
    gap: 2,
  },
  fieldLabel: {
    color: '#F1EEE7',
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    color: '#AAB4B6',
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    color: '#F1EEE7',
    fontSize: 15,
    backgroundColor: '#12171C',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  exportRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    flex: 1,
  },
  importConfirm: {
    gap: 6,
  },
  closeLabel: {
    color: '#AAB4B6',
    fontSize: 14,
  },
});
