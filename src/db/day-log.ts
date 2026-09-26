import type { SQLiteDatabase } from 'expo-sqlite';

/** Dagbeoordelingen per kind, sleutel = datum van de logische dag (lib/day-window.ts
 * logicalDateKey). `pushed_updated_at` = de updated_at die het laatst naar de server ging;
 * wijkt die af (of is hij leeg), dan moet de rij nog gepusht worden. */

export interface DayRatingRow {
  date: string;
  rating: number | null;
  updated_at: string;
}

export async function getDayRating(db: SQLiteDatabase, childId: string, date: string): Promise<number | null> {
  const row = await db.getFirstAsync<{ rating: number | null }>(
    `SELECT rating FROM day_log WHERE child_id = ? AND date = ?`,
    [childId, date]
  );

  return row?.rating ?? null;
}

export async function getAllDayRatings(db: SQLiteDatabase, childId: string): Promise<DayRatingRow[]> {
  return db.getAllAsync<DayRatingRow>(
    `SELECT date, rating, updated_at FROM day_log WHERE child_id = ? ORDER BY date ASC`,
    [childId]
  );
}

export async function setDayRating(db: SQLiteDatabase, childId: string, date: string, rating: number): Promise<void> {
  await db.runAsync(
    `INSERT INTO day_log (child_id, date, rating, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (child_id, date) DO UPDATE SET rating = excluded.rating, updated_at = excluded.updated_at`,
    [childId, date, rating, new Date().toISOString()]
  );
}

/** Zelfde laatste-schrijver-wint-principe als applyRemoteEvent — zie db/events.ts. Geldt
 * daarna als gepusht. Geeft true als er echt iets veranderde. */
export async function applyRemoteDayRating(
  db: SQLiteDatabase,
  childId: string,
  date: string,
  rating: number,
  updatedAt: string
): Promise<boolean> {
  const result = await db.runAsync(
    `INSERT INTO day_log (child_id, date, rating, updated_at, pushed_updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (child_id, date) DO UPDATE SET
       rating = excluded.rating, updated_at = excluded.updated_at, pushed_updated_at = excluded.updated_at
     WHERE excluded.updated_at > day_log.updated_at`,
    [childId, date, rating, updatedAt, updatedAt]
  );
  return result.changes > 0;
}

/** Dagbeoordeling uit een back-up: laatste-schrijver-wint op de opgeslagen updated_at (een
 * oude back-up zonder updated_at overschrijft nooit een bestaande waarde) en daarna dirty,
 * zodat hij ook naar de partner gaat. Geeft true als er iets veranderde. */
export async function importDayRating(
  db: SQLiteDatabase,
  childId: string,
  date: string,
  rating: number,
  updatedAt: string | null
): Promise<boolean> {
  const result = await db.runAsync(
    `INSERT INTO day_log (child_id, date, rating, updated_at, pushed_updated_at) VALUES (?, ?, ?, ?, NULL)
     ON CONFLICT (child_id, date) DO UPDATE SET
       rating = excluded.rating, updated_at = excluded.updated_at, pushed_updated_at = NULL
     WHERE ? IS NOT NULL AND excluded.updated_at > day_log.updated_at`,
    [childId, date, rating, updatedAt ?? new Date().toISOString(), updatedAt]
  );
  return result.changes > 0;
}

/** Dagbeoordelingen die nog naar de server moeten. */
export async function getDirtyDayRatings(db: SQLiteDatabase, childId: string): Promise<DayRatingRow[]> {
  return db.getAllAsync<DayRatingRow>(
    `SELECT date, rating, updated_at FROM day_log
     WHERE child_id = ? AND rating IS NOT NULL
       AND (pushed_updated_at IS NULL OR pushed_updated_at <> updated_at)`,
    [childId]
  );
}

export async function markDayRatingPushed(
  db: SQLiteDatabase,
  childId: string,
  date: string,
  updatedAt: string
): Promise<void> {
  await db.runAsync(
    `UPDATE day_log SET pushed_updated_at = ? WHERE child_id = ? AND date = ? AND updated_at = ?`,
    [updatedAt, childId, date, updatedAt]
  );
}
