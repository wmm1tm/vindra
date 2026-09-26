import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import { getChildSyncInfo, type TimeFormat } from '@/db/child';
import type { EventRow } from '@/db/events';
import type { Dictionary } from '@/lib/i18n/translations';
import { stopOpenSessions } from '@/lib/sleep-actions';
import { confirmStopRunningSleep, showSleepAlreadyStopped } from '@/lib/sleep-prompts';
import { syncWidget, type WidgetNotice } from '@/lib/widget-sync';

interface UseWidgetSyncOptions {
  db: SQLiteDatabase;
  childId: string | null;
  /** Pas importeren als instellingen én abonnementsstatus geladen zijn: anders telt een tik
   * met de standaardinstellingen (dagstart, wiel) of een nog onbekende status. */
  ready: boolean;
  isEntitled: boolean;
  wheelConfig: string[] | null;
  timeFormat: TimeFormat;
  dayStartHour: number;
  /** Titel van de widget: "Vindra", of de naam van het kind als er meer dan één is. */
  title: string;
  t: Dictionary;
  /** Verhoogd bij elke wijziging: daarna de widget bijwerken. */
  refreshToken: number;
  /** Rijen die door de widget (of een bevestigde stop) veranderden: tonen en pushen. */
  onChanged: (rows: EventRow[]) => void;
}

/** Beginscherm-widget (lib/widget-sync.ts): bij openen, bij terugkomen naar de app en na
 * elke wijziging de tikken verwerken en de stand bijwerken. Meldingen (verouderde widget,
 * slaap al gestopt) worden hier als vraag/melding getoond. Doet niets in Expo Go. */
export function useWidgetSync({
  db,
  childId,
  ready,
  isEntitled,
  wheelConfig,
  timeFormat,
  dayStartHour,
  title,
  t,
  refreshToken,
  onChanged,
}: UseWidgetSyncOptions) {
  const handleNotice = useCallback(
    async (notice: WidgetNotice, activeChildId: string) => {
      if (notice.kind === 'alreadyStopped') {
        showSleepAlreadyStopped(t, timeFormat, notice.lastEnd);
        return;
      }
      const stop = await confirmStopRunningSleep(t, timeFormat, new Date(notice.running.start_at), notice.tappedAt);
      if (!stop) return;
      const rows = await stopOpenSessions(db, activeChildId, notice.running.kind, notice.tappedAt);
      if (rows.length > 0) onChanged(rows);
    },
    [db, t, timeFormat, onChanged]
  );

  const run = useCallback(async () => {
    if (!childId || !ready) return;
    const sync = await getChildSyncInfo(db, childId);
    const result = await syncWidget({
      db,
      childId,
      wheelConfig,
      isEntitled,
      use12h: timeFormat === '12h',
      dayStartHour,
      isShared: Boolean(sync?.syncEnabled && sync.syncId),
      title,
      t,
    });
    if (result.changed.length > 0) onChanged(result.changed);
    for (const notice of result.notices) await handleNotice(notice, childId);
  }, [db, childId, ready, wheelConfig, isEntitled, timeFormat, dayStartHour, title, t, onChanged, handleNotice]);

  useEffect(() => {
    run();
  }, [run, refreshToken]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => subscription.remove();
  }, [run]);
}
