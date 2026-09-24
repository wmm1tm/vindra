import type { SQLiteDatabase } from 'expo-sqlite';

const ASK_COUNT_KEY = 'review_prompt_count';
const LAST_ASKED_KEY = 'review_prompt_last_at';

export type ReviewPromptState = { count: number; lastAskedAt: Date | null };

/** Hoe vaak en wanneer we om een review vroegen. Per toestel in app_state (net als
 * onboarding_done), niet per kind: het is een vraag aan deze gebruiker, niet over een kind. */
export async function getReviewPromptState(db: SQLiteDatabase): Promise<ReviewPromptState> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    `SELECT key, value FROM app_state WHERE key IN (?, ?)`,
    [ASK_COUNT_KEY, LAST_ASKED_KEY]
  );
  const values = new Map(rows.map((row) => [row.key, row.value]));
  const count = Number(values.get(ASK_COUNT_KEY) ?? 0);
  const last = values.get(LAST_ASKED_KEY);
  return { count: Number.isFinite(count) ? count : 0, lastAskedAt: last ? new Date(last) : null };
}

export async function recordReviewPrompt(db: SQLiteDatabase, state: ReviewPromptState, at: Date): Promise<void> {
  const upsert = `INSERT INTO app_state (key, value) VALUES (?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value`;
  await db.runAsync(upsert, [ASK_COUNT_KEY, String(state.count + 1)]);
  await db.runAsync(upsert, [LAST_ASKED_KEY, at.toISOString()]);
}

/** Aantal niet-verwijderde events en op hoeveel verschillende dagen ze gelogd zijn, over
 * alle kinderen heen. De datum is het deel vóór de "T" van start_at (lokale tijd met
 * tijdzone, zie SPEC), dus een dag zoals de gebruiker hem beleefde. */
export async function getLoggingStats(db: SQLiteDatabase): Promise<{ events: number; days: number }> {
  const row = await db.getFirstAsync<{ events: number; days: number }>(
    `SELECT COUNT(*) AS events, COUNT(DISTINCT substr(start_at, 1, 10)) AS days
     FROM event WHERE deleted_at IS NULL`
  );
  return { events: row?.events ?? 0, days: row?.days ?? 0 };
}
