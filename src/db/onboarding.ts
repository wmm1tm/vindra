import type { SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_CHILD_NAME } from '@/db/child';

/** Sleutel in `app_state` (toestelniveau, zoals het actieve kind), bewust geen kolom op
 * `child`: instellingen in Vindra horen per kind, maar de intro hoort bij het toestel. Als
 * kolom op `child` zou hij opnieuw verschijnen bij elk kind dat je later toevoegt, koppelt
 * via een partner-QR of terugzet uit een back-up. `app_state` bestaat al (zie
 * db/migrate.ts, `ensureTable`), dus dit vraagt geen schemawijziging. */
const ONBOARDING_DONE_KEY = 'onboarding_done';

/** Is de intro bij de eerste start doorlopen of overgeslagen?
 *
 * Zonder opgeslagen waarde (verse installatie, of een bestaande gebruiker die net de
 * update met de intro binnenkrijgt): wie al events heeft of zijn kind al een naam gaf, is
 * duidelijk geen nieuwe gebruiker. Die krijgt de intro niet ongevraagd te zien (hij blijft
 * te openen via Instellingen) en de vlag wordt meteen vastgelegd, zodat deze controle maar
 * één keer draait. */
export async function getOnboardingDone(db: SQLiteDatabase): Promise<boolean> {
  const stored = await db.getFirstAsync<{ value: string }>(`SELECT value FROM app_state WHERE key = ?`, [
    ONBOARDING_DONE_KEY,
  ]);
  if (stored) return stored.value === '1';

  const existingUse = await db.getFirstAsync<{ found: number }>(
    `SELECT 1 AS found
     WHERE EXISTS (SELECT 1 FROM event)
        OR EXISTS (SELECT 1 FROM child WHERE name <> ?)`,
    [DEFAULT_CHILD_NAME]
  );
  if (existingUse) {
    await setOnboardingDone(db, true);
    return true;
  }
  return false;
}

export async function setOnboardingDone(db: SQLiteDatabase, done: boolean): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_state (key, value) VALUES (?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    [ONBOARDING_DONE_KEY, done ? '1' : '0']
  );
}
