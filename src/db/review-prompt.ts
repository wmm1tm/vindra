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

/** Aantal niet-verwijderde events en op hoeveel verschillende LOKALE dagen ze gelogd zijn,
 * over alle kinderen heen. start_at staat in UTC (toISOString), dus de dag rekenen we hier
 * in lokale tijd uit — anders telt een log om 00:30 bij de dag ervoor. De laatste 200 events
 * zijn genoeg om "minstens 3 dagen" te zien. */
export async function getLoggingStats(db: SQLiteDatabase): Promise<{ events: number; days: number }> {
  const count = await db.getFirstAsync<{ events: number }>(
    `SELECT COUNT(*) AS events FROM event WHERE deleted_at IS NULL`
  );
  const recent = await db.getAllAsync<{ start_at: string }>(
    `SELECT start_at FROM event WHERE deleted_at IS NULL ORDER BY start_at DESC LIMIT 200`
  );
  const days = new Set(
    recent.map((row) => {
      const date = new Date(row.start_at);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    })
  );
  return { events: count?.events ?? 0, days: days.size };
}
