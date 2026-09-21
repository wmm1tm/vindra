import type { SQLiteDatabase } from 'expo-sqlite';

export async function getDayRating(db: SQLiteDatabase, childId: string, date: string): Promise<number | null> {
  const row = await db.getFirstAsync<{ rating: number | null }>(
    `SELECT rating FROM day_log WHERE child_id = ? AND date = ?`,
    [childId, date]
  );

  return row?.rating ?? null;
}

export async function getAllDayRatings(
  db: SQLiteDatabase,
  childId: string
): Promise<{ date: string; rating: number | null }[]> {
  return db.getAllAsync<{ date: string; rating: number | null }>(
    `SELECT date, rating FROM day_log WHERE child_id = ? ORDER BY date ASC`,
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

/** Zelfde laatste-schrijver-wint-principe als applyRemoteEvent — zie db/events.ts. */
export async function applyRemoteDayRating(
  db: SQLiteDatabase,
  childId: string,
  date: string,
  rating: number,
  updatedAt: string
): Promise<void> {
  await db.runAsync(
    `INSERT INTO day_log (child_id, date, rating, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (child_id, date) DO UPDATE SET rating = excluded.rating, updated_at = excluded.updated_at
     WHERE excluded.updated_at >= day_log.updated_at`,
    [childId, date, rating, updatedAt]
  );
}
