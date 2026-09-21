import type { SQLiteDatabase } from 'expo-sqlite';

import type { EventDetails, EventKind } from '@/constants/event-types';

export interface EventRow {
  id: string;
  child_id: string;
  kind: EventKind;
  start_at: string;
  end_at: string | null;
  amount_ml: number | null;
  side: string | null;
  variant: string | null;
  note: string | null;
  temperature_c: number | null;
  /** ABC-methodiek-velden voor 'gedrag'-events (aanleiding/plek/wat hielp) — bewust
   * niet ingevuld bij het snel-loggen zelf, alleen achteraf via het bewerkscherm.
   * Ongebruikt (altijd NULL) voor de overige event-typen. */
  antecedent: string | null;
  location: string | null;
  what_helped: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function insertMomentEvent(
  db: SQLiteDatabase,
  childId: string,
  kind: EventKind,
  startAt: Date,
  details: EventDetails = {},
  amountMl?: number
): Promise<EventRow> {
  const now = new Date().toISOString();
  const row: EventRow = {
    id: generateId(),
    child_id: childId,
    kind,
    start_at: startAt.toISOString(),
    end_at: null,
    amount_ml: amountMl ?? null,
    side: details.side ?? null,
    variant: details.variant ?? null,
    note: null,
    temperature_c: null,
    antecedent: null,
    location: null,
    what_helped: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  await db.runAsync(
    `INSERT INTO event
       (id, child_id, kind, start_at, end_at, amount_ml, side, variant, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.child_id,
      row.kind,
      row.start_at,
      row.end_at,
      row.amount_ml,
      row.side,
      row.variant,
      row.created_at,
      row.updated_at,
    ]
  );

  return row;
}

export async function getAllEvents(db: SQLiteDatabase, childId: string): Promise<EventRow[]> {
  return db.getAllAsync<EventRow>(
    `SELECT * FROM event WHERE child_id = ? AND deleted_at IS NULL ORDER BY start_at ASC`,
    [childId]
  );
}

/** Zet een volledige event-rij terug (export/import), met behoud van het originele id en
 * de originele tijdstempels — geen nieuwe rij aanmaken zoals insertMomentEvent doet. */
export async function importEventRow(db: SQLiteDatabase, childId: string, row: EventRow): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO event
       (id, child_id, kind, start_at, end_at, amount_ml,
        side, variant, note, temperature_c, antecedent, location, what_helped,
        created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      childId,
      row.kind,
      row.start_at,
      row.end_at,
      row.amount_ml,
      row.side,
      row.variant,
      row.note,
      row.temperature_c,
      row.antecedent ?? null,
      row.location ?? null,
      row.what_helped ?? null,
      row.created_at,
      row.updated_at,
      row.deleted_at,
    ]
  );
}

/** Past een event toe dat van de sync-server kwam. In tegenstelling tot importEventRow
 * (back-up herstellen, altijd overschrijven) geldt hier laatste-schrijver-wint: alleen
 * toepassen als de binnenkomende updated_at niet ouder is dan wat hier al lokaal staat —
 * anders zou een net teruggehaalde oudere versie een nieuwere lokale wijziging overschrijven. */
export async function applyRemoteEvent(db: SQLiteDatabase, childId: string, row: EventRow): Promise<void> {
  await db.runAsync(
    `INSERT INTO event
       (id, child_id, kind, start_at, end_at, amount_ml,
        side, variant, note, temperature_c, antecedent, location, what_helped,
        created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       kind = excluded.kind, start_at = excluded.start_at, end_at = excluded.end_at,
       amount_ml = excluded.amount_ml, side = excluded.side, variant = excluded.variant,
       note = excluded.note, temperature_c = excluded.temperature_c,
       antecedent = excluded.antecedent, location = excluded.location, what_helped = excluded.what_helped,
       updated_at = excluded.updated_at, deleted_at = excluded.deleted_at
     WHERE excluded.updated_at >= event.updated_at`,
    [
      row.id,
      childId,
      row.kind,
      row.start_at,
      row.end_at,
      row.amount_ml,
      row.side,
      row.variant,
      row.note,
      row.temperature_c,
      // ?? null (niet alleen row.antecedent): decryptJson/oude back-ups zijn ongetypeerd
      // JSON en kunnen deze velden missen (undefined) i.p.v. echt null — expo-sqlite's
      // bind accepteert geen undefined, dat zou de hele sync-/import-rij laten falen.
      row.antecedent ?? null,
      row.location ?? null,
      row.what_helped ?? null,
      row.created_at,
      row.updated_at,
      row.deleted_at,
    ]
  );
}

export async function getEventsForDay(db: SQLiteDatabase, childId: string, dayStart: Date): Promise<EventRow[]> {
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  return getEventsForRange(db, childId, dayStart, dayEnd);
}

export async function getEventsForRange(
  db: SQLiteDatabase,
  childId: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<EventRow[]> {
  return db.getAllAsync<EventRow>(
    `SELECT * FROM event
     WHERE child_id = ? AND deleted_at IS NULL AND start_at >= ? AND start_at < ?
     ORDER BY start_at ASC`,
    [childId, rangeStart.toISOString(), rangeEnd.toISOString()]
  );
}

/** Days into the past this still looks for a session that hasn't wrapped up yet —
 * nothing realistically stays open (or needs to visually carry into a later day) any
 * longer than this. */
const OPEN_EVENT_LOOKBACK_DAYS = 3;

/** Events that started before `before` but hadn't ended yet at that point — e.g. an
 * overnight sleep that started yesterday evening and is still running (or only ended
 * this morning). `getEventsForRange`/`getEventsForDay` only match on `start_at`, so a
 * session like that would otherwise vanish from today's timeline entirely. This layer
 * doesn't know which event kinds are duration-based (that's app-level config, see
 * constants/event-types.ts) — the caller passes in which `kinds` to look for. */
export async function getOpenOrOverlappingEvents(
  db: SQLiteDatabase,
  childId: string,
  before: Date,
  kinds: string[]
): Promise<EventRow[]> {
  if (kinds.length === 0) return [];
  const lookback = new Date(before.getTime() - OPEN_EVENT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const placeholders = kinds.map(() => '?').join(',');
  return db.getAllAsync<EventRow>(
    `SELECT * FROM event
     WHERE child_id = ? AND deleted_at IS NULL AND kind IN (${placeholders})
       AND start_at >= ? AND start_at < ?
       AND (end_at IS NULL OR end_at > ?)
     ORDER BY start_at ASC`,
    [childId, ...kinds, lookback.toISOString(), before.toISOString(), before.toISOString()]
  );
}

export interface EventDetailUpdate {
  amountMl?: number;
  note?: string;
  temperatureC?: number;
  details?: EventDetails;
}

/** Returns the `updated_at` it wrote, so callers building an in-memory row to push to
 * sync (see lib/sync.ts) reflect the exact same timestamp the DB now has — building
 * that row from a stale pre-update value would freeze the row's server-side
 * last-writer-wins timestamp and silently stop the edit from ever reaching a partner. */
export async function updateEventDetails(
  db: SQLiteDatabase,
  id: string,
  { amountMl, note, temperatureC, details = {} }: EventDetailUpdate
): Promise<string> {
  const updatedAt = new Date().toISOString();
  await db.runAsync(
    `UPDATE event
     SET amount_ml = ?, note = ?, temperature_c = ?, side = ?, variant = ?, updated_at = ?
     WHERE id = ?`,
    [
      amountMl ?? null,
      note ?? null,
      temperatureC ?? null,
      details.side ?? null,
      details.variant ?? null,
      updatedAt,
      id,
    ]
  );
  return updatedAt;
}

export async function getLastAmountMl(db: SQLiteDatabase, childId: string, kind: EventKind): Promise<number | null> {
  const row = await db.getFirstAsync<{ amount_ml: number }>(
    `SELECT amount_ml FROM event
     WHERE child_id = ? AND kind = ? AND amount_ml IS NOT NULL AND deleted_at IS NULL
     ORDER BY start_at DESC LIMIT 1`,
    [childId, kind]
  );

  return row?.amount_ml ?? null;
}

export async function getFrequentNotes(db: SQLiteDatabase, childId: string, limit = 4): Promise<string[]> {
  const rows = await db.getAllAsync<{ note: string }>(
    `SELECT note FROM event
     WHERE child_id = ? AND deleted_at IS NULL AND note IS NOT NULL AND note != ''
     GROUP BY note
     ORDER BY COUNT(*) DESC, MAX(created_at) DESC
     LIMIT ?`,
    [childId, limit]
  );
  return rows.map((row) => row.note);
}

export async function getActiveEvent(db: SQLiteDatabase, childId: string, kind: EventKind): Promise<EventRow | null> {
  const row = await db.getFirstAsync<EventRow>(
    `SELECT * FROM event
     WHERE child_id = ? AND kind = ? AND end_at IS NULL AND deleted_at IS NULL
     ORDER BY start_at DESC LIMIT 1`,
    [childId, kind]
  );

  return row ?? null;
}

export async function closeEvent(db: SQLiteDatabase, id: string, endAt: Date): Promise<string> {
  const updatedAt = new Date().toISOString();
  await db.runAsync(`UPDATE event SET end_at = ?, updated_at = ? WHERE id = ?`, [
    endAt.toISOString(),
    updatedAt,
    id,
  ]);
  return updatedAt;
}

export async function rescheduleEvent(
  db: SQLiteDatabase,
  id: string,
  startAt: Date,
  endAt: Date | null
): Promise<string> {
  const updatedAt = new Date().toISOString();
  await db.runAsync(`UPDATE event SET start_at = ?, end_at = ?, updated_at = ? WHERE id = ?`, [
    startAt.toISOString(),
    endAt ? endAt.toISOString() : null,
    updatedAt,
    id,
  ]);
  return updatedAt;
}

export async function reopenEvent(db: SQLiteDatabase, id: string): Promise<string> {
  const updatedAt = new Date().toISOString();
  await db.runAsync(`UPDATE event SET end_at = NULL, updated_at = ? WHERE id = ?`, [updatedAt, id]);
  return updatedAt;
}

export async function softDeleteEvent(db: SQLiteDatabase, id: string): Promise<string> {
  const now = new Date().toISOString();
  await db.runAsync(`UPDATE event SET deleted_at = ?, updated_at = ? WHERE id = ?`, [now, now, id]);
  return now;
}

/** Soft-deletes every (nog niet verwijderde) event van één kind waarvan `start_at`
 * binnen de opgegeven dag valt — voor de "verwijder alle events van deze dag"-knop in
 * instellingen. Geeft de bijgewerkte rijen terug (met de nieuwe deleted_at/updated_at)
 * zodat de aanroeper ze, net als bij een losse verwijdering, naar de sync-server kan
 * pushen en uit de lokale state kan filteren — één gedeelde timestamp voor de hele batch. */
export async function softDeleteEventsForDay(db: SQLiteDatabase, childId: string, dayStart: Date): Promise<EventRow[]> {
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const rows = await db.getAllAsync<EventRow>(
    `SELECT * FROM event WHERE child_id = ? AND deleted_at IS NULL AND start_at >= ? AND start_at < ?`,
    [childId, dayStart.toISOString(), dayEnd.toISOString()]
  );
  if (rows.length === 0) return [];

  const now = new Date().toISOString();
  const placeholders = rows.map(() => '?').join(',');
  await db.runAsync(`UPDATE event SET deleted_at = ?, updated_at = ? WHERE id IN (${placeholders})`, [
    now,
    now,
    ...rows.map((row) => row.id),
  ]);
  return rows.map((row) => ({ ...row, deleted_at: now, updated_at: now }));
}

export interface EventEditUpdate {
  startAt: Date;
  endAt: Date | null;
  note: string | null;
  amountMl: number | null;
  details: EventDetails;
  /** ABC-velden, alleen relevant voor 'gedrag'-events — zie EventRow. */
  antecedent?: string | null;
  location?: string | null;
  whatHelped?: string | null;
}

export async function updateEventEdit(
  db: SQLiteDatabase,
  id: string,
  { startAt, endAt, note, amountMl, details, antecedent, location, whatHelped }: EventEditUpdate
): Promise<string> {
  const updatedAt = new Date().toISOString();
  await db.runAsync(
    `UPDATE event
     SET start_at = ?, end_at = ?, note = ?, amount_ml = ?,
         side = ?, variant = ?, antecedent = ?, location = ?, what_helped = ?, updated_at = ?
     WHERE id = ?`,
    [
      startAt.toISOString(),
      endAt ? endAt.toISOString() : null,
      note,
      amountMl,
      details.side ?? null,
      details.variant ?? null,
      antecedent ?? null,
      location ?? null,
      whatHelped ?? null,
      updatedAt,
      id,
    ]
  );
  return updatedAt;
}
