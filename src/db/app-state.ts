import type { SQLiteDatabase } from 'expo-sqlite';

/** Sleutel/waarde-opslag per toestel (tabel app_state, zie db/schema.ts V8): hoort niet bij
 * een kind, gaat niet mee in een back-up en wordt niet gesynct. */
export async function getAppState(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string | null }>(`SELECT value FROM app_state WHERE key = ?`, [key]);
  return row?.value ?? null;
}

export async function setAppState(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_state (key, value) VALUES (?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

/** JSON-variant: een kapotte of ontbrekende waarde geeft `fallback`. */
export async function getAppStateJson<T>(db: SQLiteDatabase, key: string, fallback: T): Promise<T> {
  const raw = await getAppState(db, key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setAppStateJson(db: SQLiteDatabase, key: string, value: unknown): Promise<void> {
  await setAppState(db, key, JSON.stringify(value));
}
