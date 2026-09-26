import type { SQLiteDatabase } from 'expo-sqlite';

import { isKnownEventKind, type EventDetails, type EventKind } from '@/constants/event-types';

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
  /** Dunn's Sensory Profile-uitbreiding voor 'prikkel'-events — 'laag'/'hoog' resp.
   * 'opzoekend'/'vermijdend', of NULL. Zelfde achteraf-invullen-via-bewerkscherm-
   * patroon als de ABC-velden hierboven. Ongebruikt voor de overige event-typen. */
  sensory_threshold: string | null;
  sensory_response: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Laat events weg waarvan deze app-versie het type niet kent — bv. een type dat een
 * partner met een nieuwere versie via sync (of een back-up van een nieuwere versie)
 * heeft aangeleverd. De rij blijft wel in de database staan, dus na een app-update
 * verschijnt hij alsnog. Zonder dit crasht elk scherm op `EVENT_TYPES[kind]`. */
function knownKindsOnly(rows: EventRow[]): EventRow[] {
  return rows.filter((row) => isKnownEventKind(row.kind));
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
    sensory_threshold: null,
    sensory_response: null,
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
  const rows = await db.getAllAsync<EventRow>(
    `SELECT * FROM event WHERE child_id = ? AND deleted_at IS NULL ORDER BY start_at ASC`,
    [childId]
  );
  return knownKindsOnly(rows);
}

/** Tijdstip (ms) van het eerste niet-verwijderde event van dit kind, of null. Voor de
 * trendgrafiek: weken vóór je eerste log tellen niet mee. */
export async function getFirstEventTime(db: SQLiteDatabase, childId: string): Promise<number | null> {
  const row = await db.getFirstAsync<{ start_at: string }>(
    `SELECT start_at FROM event WHERE child_id = ? AND deleted_at IS NULL ORDER BY start_at ASC LIMIT 1`,
    [childId]
  );
  return row ? new Date(row.start_at).getTime() : null;
}

/** Kolommen van een event-rij zoals ze gedeeld worden (back-up, sync) — nooit de lokale
 * boekhouding zoals pushed_updated_at. */
const EVENT_COLUMNS = `id, child_id, kind, start_at, end_at, amount_ml,
        side, variant, note, temperature_c, antecedent, location, what_helped,
        sensory_threshold, sensory_response, created_at, updated_at, deleted_at`;

/** Bij ON CONFLICT: alle gedeelde velden behalve id/child_id/created_at overnemen. */
const EVENT_UPDATE_SET = `kind = excluded.kind, start_at = excluded.start_at, end_at = excluded.end_at,
       amount_ml = excluded.amount_ml, side = excluded.side, variant = excluded.variant,
       note = excluded.note, temperature_c = excluded.temperature_c,
       antecedent = excluded.antecedent, location = excluded.location, what_helped = excluded.what_helped,
       sensory_threshold = excluded.sensory_threshold, sensory_response = excluded.sensory_response,
       updated_at = excluded.updated_at, deleted_at = excluded.deleted_at`;

function eventValues(childId: string, row: EventRow) {
  return [
    row.id,
    childId,
    row.kind,
    row.start_at,
    row.end_at,
    row.amount_ml ?? null,
    row.side ?? null,
    row.variant ?? null,
    row.note ?? null,
    row.temperature_c ?? null,
    // ?? null: decryptJson/oude back-ups zijn ongetypeerd JSON en kunnen deze velden missen
    // (undefined) — expo-sqlite's bind accepteert geen undefined.
    row.antecedent ?? null,
    row.location ?? null,
    row.what_helped ?? null,
    row.sensory_threshold ?? null,
    row.sensory_response ?? null,
    row.created_at,
    row.updated_at,
    row.deleted_at ?? null,
  ];
}

/** Zet een event uit een back-up terug. Laatste-schrijver-wint (een oudere back-up
 * overschrijft nooit een nieuwere lokale wijziging), en de child_id van een bestaande rij
 * verandert nooit — anders kon een back-up een event naar een ander kind verhuizen. Een
 * geïmporteerde rij blijft "dirty" (pushed_updated_at leeg), zodat hij ook naar de partner
 * gaat. Geeft true als er iets veranderde. */
export async function importEventRow(db: SQLiteDatabase, childId: string, row: EventRow): Promise<boolean> {
  const result = await db.runAsync(
    `INSERT INTO event (${EVENT_COLUMNS}, pushed_updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
     ON CONFLICT (id) DO UPDATE SET
       ${EVENT_UPDATE_SET}, pushed_updated_at = NULL
     WHERE excluded.updated_at > event.updated_at`,
    eventValues(childId, row)
  );
  return result.changes > 0;
}

/** Past een event toe dat van de sync-server kwam: laatste-schrijver-wint, alleen als de
 * binnenkomende updated_at NIEUWER is dan de lokale (anders zou een net teruggehaalde oudere
 * versie een nieuwere lokale wijziging overschrijven). `updated_at` moet genormaliseerd zijn
 * (toISOString), anders klopt de tekstvergelijking niet. De rij geldt daarna als gepusht (hij
 * staat immers al op de server). Geeft true als er echt iets veranderde. */
export async function applyRemoteEvent(db: SQLiteDatabase, childId: string, row: EventRow): Promise<boolean> {
  const result = await db.runAsync(
    `INSERT INTO event (${EVENT_COLUMNS}, pushed_updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       ${EVENT_UPDATE_SET}, pushed_updated_at = excluded.updated_at
     WHERE excluded.updated_at > event.updated_at`,
    [...eventValues(childId, row), row.updated_at]
  );
  return result.changes > 0;
}

/** Events van dit kind die nog naar de server moeten: nieuw of gewijzigd sinds de laatste
 * geslaagde push — INCLUSIEF verwijderde rijen (een offline verwijdering moet de partner
 * ook bereiken) en rijen van een type dat deze versie niet kent (die kwamen van de server of
 * een back-up en horen gewoon mee te gaan). */
export async function getDirtyEvents(db: SQLiteDatabase, childId: string): Promise<EventRow[]> {
  return db.getAllAsync<EventRow>(
    `SELECT ${EVENT_COLUMNS} FROM event
     WHERE child_id = ? AND (pushed_updated_at IS NULL OR pushed_updated_at <> updated_at)
     ORDER BY updated_at ASC`,
    [childId]
  );
}

/** Markeert een event als gepusht — alleen als de rij sindsdien niet opnieuw gewijzigd is. */
export async function markEventPushed(db: SQLiteDatabase, id: string, updatedAt: string): Promise<void> {
  await db.runAsync(`UPDATE event SET pushed_updated_at = ? WHERE id = ? AND updated_at = ?`, [updatedAt, id, updatedAt]);
}

/** Alle niet-verwijderde events van een kind voor de JSON-back-up — ook van types die deze
 * app-versie niet kent (die mogen bij een back-up niet verloren gaan). */
export async function getAllEventRowsForBackup(db: SQLiteDatabase, childId: string): Promise<EventRow[]> {
  return db.getAllAsync<EventRow>(
    `SELECT ${EVENT_COLUMNS} FROM event WHERE child_id = ? AND deleted_at IS NULL ORDER BY start_at ASC`,
    [childId]
  );
}

export async function getEventsForRange(
  db: SQLiteDatabase,
  childId: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<EventRow[]> {
  const rows = await db.getAllAsync<EventRow>(
    `SELECT * FROM event
     WHERE child_id = ? AND deleted_at IS NULL AND start_at >= ? AND start_at < ?
     ORDER BY start_at ASC`,
    [childId, rangeStart.toISOString(), rangeEnd.toISOString()]
  );
  return knownKindsOnly(rows);
}

/** Hoe ver terug we zoeken naar een AFGESLOTEN duur-event dat nog in een periode doorliep
 * (een nacht duurt geen drie dagen). Een event dat nog LOOPT (end_at leeg) telt altijd mee,
 * hoe oud ook — net als getActiveEvent, anders zou een vergeten slaap onzichtbaar open
 * blijven staan terwijl het wiel er wel op stopt. */
export const OPEN_EVENT_LOOKBACK_DAYS = 3;

/** Duur-events die vóór `before` begonnen en op dat moment nog liepen — bv. een nacht die
 * gisteravond begon en nog loopt (of pas vanochtend eindigde). `getEventsForRange` kijkt
 * alleen naar start_at, dus zonder dit zou zo'n sessie van de tijdlijn van vandaag
 * verdwijnen. De db-laag weet niet welke types een duur hebben (dat is app-config, zie
 * constants/event-types.ts) — de aanroeper geeft `kinds` mee. */
export async function getOpenOrOverlappingEvents(
  db: SQLiteDatabase,
  childId: string,
  before: Date,
  kinds: string[]
): Promise<EventRow[]> {
  if (kinds.length === 0) return [];
  const lookback = new Date(before.getTime() - OPEN_EVENT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const placeholders = kinds.map(() => '?').join(',');
  const rows = await db.getAllAsync<EventRow>(
    `SELECT * FROM event
     WHERE child_id = ? AND deleted_at IS NULL AND kind IN (${placeholders})
       AND start_at < ?
       AND (end_at IS NULL OR (start_at >= ? AND end_at > ?))
     ORDER BY start_at ASC`,
    [childId, ...kinds, before.toISOString(), lookback.toISOString(), before.toISOString()]
  );
  return knownKindsOnly(rows);
}

/** Alles wat een periode [rangeStart, rangeEnd) raakt: events die erin beginnen, plus
 * duur-events (`durationKinds`) die eerder begonnen maar er nog in doorliepen — bv. de
 * nacht van gisteravond in de ochtend van vandaag. Voor totalen per periode; het knippen
 * op de periodegrenzen doet minutesWithin in lib/event-summary.ts. */
export async function getEventsOverlappingRange(
  db: SQLiteDatabase,
  childId: string,
  rangeStart: Date,
  rangeEnd: Date,
  durationKinds: string[]
): Promise<EventRow[]> {
  const [carriedOver, inRange] = await Promise.all([
    getOpenOrOverlappingEvents(db, childId, rangeStart, durationKinds),
    getEventsForRange(db, childId, rangeStart, rangeEnd),
  ]);
  return [...carriedOver, ...inRange];
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

/** Alle nog lopende (open) events van één type, oudste eerst. Normaal hooguit één, maar
 * twee toestellen kunnen offline elk een slaap gestart hebben — bij stoppen sluiten we ze
 * allemaal, zodat er nooit een "vergeten" tweede open slaap blijft staan. */
export async function getOpenEvents(db: SQLiteDatabase, childId: string, kind: EventKind): Promise<EventRow[]> {
  return db.getAllAsync<EventRow>(
    `SELECT * FROM event
     WHERE child_id = ? AND kind = ? AND end_at IS NULL AND deleted_at IS NULL
     ORDER BY start_at ASC`,
    [childId, kind]
  );
}

/** Het laatst afgesloten event van dit type (op eindtijd) — voor "was al gestopt om 06:10". */
export async function getLastClosedEvent(db: SQLiteDatabase, childId: string, kind: EventKind): Promise<EventRow | null> {
  const row = await db.getFirstAsync<EventRow>(
    `SELECT * FROM event
     WHERE child_id = ? AND kind = ? AND end_at IS NOT NULL AND deleted_at IS NULL
     ORDER BY end_at DESC LIMIT 1`,
    [childId, kind]
  );
  return row ?? null;
}

export async function getEventById(db: SQLiteDatabase, id: string): Promise<EventRow | null> {
  const row = await db.getFirstAsync<EventRow>(`SELECT * FROM event WHERE id = ?`, [id]);
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
 * binnen het opgegeven dagvenster valt — voor de "verwijder alle events van deze dag"-knop
 * in instellingen. Alleen types die deze app-versie kent: een rij van een nieuwer type
 * (via sync/back-up) staat niet op de tijdlijn en mag dus ook niet stiekem mee verdwijnen.
 * Geeft de bijgewerkte rijen terug (met de nieuwe deleted_at/updated_at) zodat de aanroeper
 * ze uit de lokale state kan filteren — één gedeelde timestamp voor de hele batch. */
export async function softDeleteEventsForDay(
  db: SQLiteDatabase,
  childId: string,
  window: { start: Date; end: Date }
): Promise<EventRow[]> {
  const rows = knownKindsOnly(
    await db.getAllAsync<EventRow>(
      `SELECT * FROM event WHERE child_id = ? AND deleted_at IS NULL AND start_at >= ? AND start_at < ?`,
      [childId, window.start.toISOString(), window.end.toISOString()]
    )
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
  /** Sensory Profile-velden, alleen relevant voor 'prikkel'-events — zie EventRow. */
  sensoryThreshold?: string | null;
  sensoryResponse?: string | null;
}

export async function updateEventEdit(
  db: SQLiteDatabase,
  id: string,
  {
    startAt,
    endAt,
    note,
    amountMl,
    details,
    antecedent,
    location,
    whatHelped,
    sensoryThreshold,
    sensoryResponse,
  }: EventEditUpdate
): Promise<string> {
  const updatedAt = new Date().toISOString();
  await db.runAsync(
    `UPDATE event
     SET start_at = ?, end_at = ?, note = ?, amount_ml = ?,
         side = ?, variant = ?, antecedent = ?, location = ?, what_helped = ?,
         sensory_threshold = ?, sensory_response = ?, updated_at = ?
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
      sensoryThreshold ?? null,
      sensoryResponse ?? null,
      updatedAt,
      id,
    ]
  );
  return updatedAt;
}
