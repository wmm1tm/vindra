import { getCalendars, getLocales } from 'expo-localization';
import type { SQLiteDatabase } from 'expo-sqlite';

import { generateSyncId, generateSyncKey } from '@/lib/crypto';

export const DEFAULT_CHILD_ID = 'default-child';
/** Naam waarmee een gloednieuwe installatie start (zie ensureAtLeastOneChild) — ook het
 * signaal dat de naam/geboortedatum-onboardingbanner op de tijdlijn gebruikt om te weten
 * of dit kind nog nooit een echte naam gekregen heeft. */
export const DEFAULT_CHILD_NAME = 'Kind';

/** De standaardnaam in elke app-taal. Een nieuwe installatie krijgt die in de taal van het
 * toestel; alle varianten tellen als "nog geen echte naam" (isDefaultChildName). */
const DEFAULT_CHILD_NAMES: Record<string, string> = {
  nl: 'Kind',
  en: 'Child',
  de: 'Kind',
  es: 'Niño',
  fr: 'Enfant',
  pt: 'Criança',
};
export const ALL_DEFAULT_CHILD_NAMES = Array.from(new Set(Object.values(DEFAULT_CHILD_NAMES)));

export function isDefaultChildName(name: string | undefined | null): boolean {
  return Boolean(name && ALL_DEFAULT_CHILD_NAMES.includes(name));
}

function deviceDefaultChildName(): string {
  try {
    return DEFAULT_CHILD_NAMES[getLocales()[0]?.languageCode ?? ''] ?? DEFAULT_CHILD_NAMES.en;
  } catch {
    return DEFAULT_CHILD_NAME;
  }
}
const ACTIVE_CHILD_KEY = 'active_child_id';

export type TimeFormat = '24h' | '12h';
export type TempUnit = 'celsius' | 'fahrenheit';
export type VolumeUnit = 'ml' | 'cc';
export type LanguageSetting = 'system' | 'nl' | 'en' | 'de' | 'es' | 'fr' | 'pt';

export interface Child {
  id: string;
  name: string;
  birthDate: string;
  isActive: boolean;
}

/** Partner-sync-status van één kind. syncId/syncKey zijn beide null zolang het kind niet
 * gedeeld is. syncKey verlaat dit toestel nooit via de server — zie lib/crypto.ts. */
export interface ChildSyncInfo {
  syncId: string | null;
  syncKey: string | null;
  syncEnabled: boolean;
  /** Oude watermark (updated_at) — alleen nog voor de terugval zolang de server de
   * v2-functies (seq) niet heeft; zie lib/sync.ts. */
  lastSyncedAt: string | null;
  /** Hoogste server-volgnummer dat dit toestel al binnenhaalde, per soort. */
  seqEvents: number;
  seqRatings: number;
}

export interface ChildSettings {
  timeFormat: TimeFormat;
  tempUnit: TempUnit;
  volumeUnit: VolumeUnit;
  leftHanded: boolean;
  /** Uur (0-23) waarop de dag voor de tellers/badges "begint". Standaard 00:00. */
  dayStartHour: number;
  /** Ingeschakelde WHEEL_ORDER entry-ids, in gewenste volgorde. null = standaardwiel. */
  wheelConfig: string[] | null;
  nightModeAuto: boolean;
  /** 'system' = volg de taal van het toestel (met NL als terugval). */
  language: LanguageSetting;
  /** Heeft de gebruiker de naam/geboortedatum-onboardingbanner weggetikt? Die banner
   * verschijnt sowieso alleen zolang de naam nog DEFAULT_CHILD_NAME is — dit is puur de
   * "nee, laat maar" van iemand die de placeholdernaam bewust wil houden. */
  onboardingNameDismissed: boolean;
}

function generateChildId() {
  return `child-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Zorgt dat er minstens één kind bestaat — alleen relevant bij een gloednieuwe
 * installatie. Bestaande installaties (van vóór "meerdere kinderen") hadden al precies
 * dit kind-id, dus hun data blijft gewoon gekoppeld zonder migratiestap. */
export async function ensureAtLeastOneChild(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM child`);
  if (row && row.count > 0) return;

  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR IGNORE INTO child (id, name, birth_date, is_active, time_format) VALUES (?, ?, ?, 1, ?)`,
    [DEFAULT_CHILD_ID, deviceDefaultChildName(), now, deviceTimeFormat()]
  );
}

/** 12- of 24-uurs volgens de instelling van het toestel (standaard voor een nieuwe installatie). */
function deviceTimeFormat(): TimeFormat {
  try {
    return getCalendars()[0]?.uses24hourClock === false ? '12h' : '24h';
  } catch {
    return '24h';
  }
}

/** Instellingen die bij het TOESTEL horen, niet bij een kind: taal, tijdnotatie, dagstart,
 * automatische nachtmodus en linkshandig. Ze staan (voor back-up-compatibiliteit) nog wel
 * per kind in de tabel, maar worden altijd bij alle kinderen gelijk gehouden. */
const DEVICE_SETTING_COLUMNS = ['time_format', 'language', 'day_start_hour', 'night_mode_auto', 'left_handed'];

/** Zet de toestel-instellingen van alle kinderen gelijk aan die van `sourceId` (standaard
 * het kind dat nu bekeken wordt). Na een nieuw/gekoppeld kind, een back-up-import en
 * eenmalig bij de migratie. */
export async function alignDeviceSettings(db: SQLiteDatabase, sourceId?: string): Promise<void> {
  const source =
    sourceId ??
    (await db.getFirstAsync<{ value: string }>(`SELECT value FROM app_state WHERE key = ?`, [ACTIVE_CHILD_KEY]))
      ?.value;
  const sourceRow = source
    ? await db.getFirstAsync<{ id: string }>(`SELECT id FROM child WHERE id = ?`, [source])
    : await db.getFirstAsync<{ id: string }>(`SELECT id FROM child ORDER BY is_active DESC, birth_date ASC LIMIT 1`);
  if (!sourceRow) return;
  const assignments = DEVICE_SETTING_COLUMNS.map((column) => `${column} = (SELECT ${column} FROM child WHERE id = ?)`);
  await db.runAsync(
    `UPDATE child SET ${assignments.join(', ')} WHERE id <> ?`,
    [...DEVICE_SETTING_COLUMNS.map(() => sourceRow.id), sourceRow.id]
  );
}

export async function listChildren(db: SQLiteDatabase, includeArchived = false): Promise<Child[]> {
  const rows = await db.getAllAsync<{ id: string; name: string; birth_date: string; is_active: number }>(
    includeArchived
      ? `SELECT id, name, birth_date, is_active FROM child ORDER BY birth_date ASC`
      : `SELECT id, name, birth_date, is_active FROM child WHERE is_active = 1 ORDER BY birth_date ASC`
  );
  return rows.map((row) => ({ id: row.id, name: row.name, birthDate: row.birth_date, isActive: row.is_active === 1 }));
}

export async function createChild(db: SQLiteDatabase, name: string, birthDate?: Date): Promise<string> {
  const id = generateChildId();
  await db.runAsync(`INSERT INTO child (id, name, birth_date, is_active) VALUES (?, ?, ?, 1)`, [
    id,
    name,
    (birthDate ?? new Date()).toISOString(),
  ]);
  await alignDeviceSettings(db);
  return id;
}

export async function renameChild(db: SQLiteDatabase, id: string, name: string): Promise<void> {
  await db.runAsync(`UPDATE child SET name = ? WHERE id = ?`, [name, id]);
}

export async function updateChildBirthDate(db: SQLiteDatabase, id: string, birthDate: Date): Promise<void> {
  await db.runAsync(`UPDATE child SET birth_date = ? WHERE id = ?`, [birthDate.toISOString(), id]);
}

/** "Verwijderen" van een kind is archiveren, niet weggooien — de events blijven gewoon
 * in de database staan (net als bij een event, zie deleted_at), zodat je nooit per
 * ongeluk een geschiedenis kwijtraakt. Ge-archiveerde kinderen kun je terugzetten. */
export async function setChildActive(db: SQLiteDatabase, id: string, isActive: boolean): Promise<void> {
  await db.runAsync(`UPDATE child SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);
}

/** Permanently removes an archived child and everything logged for them — unlike
 * archiving, this can't be undone. Only meant for cleaning up an archived child created
 * by mistake (e.g. a duplicate); the settings UI only offers this for already-archived
 * children, never an active one. Puur lokaal: bij een gedeeld kind wordt alleen DIT toestel
 * losgekoppeld; de gedeelde gegevens op de server (en bij de partner) blijven staan. */
export async function deleteChild(db: SQLiteDatabase, id: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM event WHERE child_id = ?`, [id]);
    await db.runAsync(`DELETE FROM day_log WHERE child_id = ?`, [id]);
    await db.runAsync(`DELETE FROM child WHERE id = ?`, [id]);
  });
}

export async function getChildSyncInfo(db: SQLiteDatabase, id: string): Promise<ChildSyncInfo | null> {
  const row = await db.getFirstAsync<{
    sync_id: string | null;
    sync_key: string | null;
    sync_enabled: number;
    last_synced_at: string | null;
    sync_seq_events: number | null;
    sync_seq_ratings: number | null;
  }>(
    `SELECT sync_id, sync_key, sync_enabled, last_synced_at, sync_seq_events, sync_seq_ratings FROM child WHERE id = ?`,
    [id]
  );
  if (!row) return null;
  return {
    syncId: row.sync_id,
    syncKey: row.sync_key,
    syncEnabled: row.sync_enabled === 1,
    lastSyncedAt: row.last_synced_at,
    seqEvents: row.sync_seq_events ?? 0,
    seqRatings: row.sync_seq_ratings ?? 0,
  };
}

/** Zet delen aan voor een kind. Idempotent: als er al een sync_id/sync_key bestaat
 * (bv. je opent het deelscherm nogmaals om een derde toestel te koppelen), worden die
 * hergebruikt in plaats van overschreven — anders zou eerder gekoppelde apparaten de
 * verbinding kwijtraken. */
export async function enableSync(db: SQLiteDatabase, id: string): Promise<{ syncId: string; syncKey: string }> {
  const existing = await getChildSyncInfo(db, id);
  if (existing?.syncId && existing.syncKey) {
    if (!existing.syncEnabled) {
      await db.runAsync(`UPDATE child SET sync_enabled = 1 WHERE id = ?`, [id]);
    }
    return { syncId: existing.syncId, syncKey: existing.syncKey };
  }

  const syncId = generateSyncId();
  const syncKey = generateSyncKey();
  await db.runAsync(`UPDATE child SET sync_id = ?, sync_key = ?, sync_enabled = 1 WHERE id = ?`, [
    syncId,
    syncKey,
    id,
  ]);
  return { syncId, syncKey };
}

export interface SharedChildPayload {
  name: string;
  birthDate: string;
  syncId: string;
  syncKey: string;
}

/** Maakt op dít toestel een nieuw, lokaal kind-record aan dat gekoppeld is aan een reeds
 * gedeeld kind (via QR gescand). Elk toestel houdt zijn eigen lokale id en instellingen —
 * alleen sync_id/sync_key komen overeen. Geeft het (nieuwe of al bestaande) lokale
 * kind-id terug.
 *
 * Idempotent op sync_id: zonder deze check maakte elke herhaalde scan van dezelfde
 * QR-code (bv. na het per ongeluk opnieuw scannen, of het toestel dat de code nogmaals
 * aanbiedt) een compleet nieuw, leeg lokaal kind aan — met dezelfde naam, wél gedeeld,
 * maar zonder de al gepulde geschiedenis. Dat nieuwe kind werd meteen actief gezet, dus
 * het zag eruit als "al mijn data is weg" terwijl het origineel gewoon nog bestond. */
export async function linkSharedChild(db: SQLiteDatabase, payload: SharedChildPayload): Promise<string> {
  const existing = await db.getFirstAsync<{ id: string }>(`SELECT id FROM child WHERE sync_id = ?`, [payload.syncId]);
  if (existing) return existing.id;

  const id = generateChildId();
  await db.runAsync(
    `INSERT INTO child (id, name, birth_date, is_active, sync_id, sync_key, sync_enabled)
     VALUES (?, ?, ?, 1, ?, ?, 1)`,
    [id, payload.name, payload.birthDate, payload.syncId, payload.syncKey]
  );
  await alignDeviceSettings(db);
  return id;
}

export async function updateLastSyncedAt(db: SQLiteDatabase, id: string, iso: string): Promise<void> {
  await db.runAsync(`UPDATE child SET last_synced_at = ? WHERE id = ?`, [iso, id]);
}

/** Schuift de seq-watermark op (nooit terug). */
export async function updateSyncSeq(
  db: SQLiteDatabase,
  id: string,
  which: 'events' | 'ratings',
  seq: number
): Promise<void> {
  const column = which === 'events' ? 'sync_seq_events' : 'sync_seq_ratings';
  await db.runAsync(`UPDATE child SET ${column} = MAX(${column}, ?) WHERE id = ?`, [seq, id]);
}

/** Ids van alle kinderen met delen aan — gebruikt door de sync-loop, die (in
 * tegenstelling tot de rest van de app) niet uitgaat van het ene op dit toestel bekeken
 * kind: een tweede/derde kind dat ook gedeeld is, moet net zo goed blijven synchroniseren
 * terwijl je een ander kind aan het bekijken bent. */
export async function listSyncedChildIds(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ id: string }>(`SELECT id FROM child WHERE sync_enabled = 1`);
  return rows.map((row) => row.id);
}

/** Welk kind dit toestel nu laat zien — puur lokale UI-staat, gaat niet mee in een
 * export/import en is niet "van" een kind zelf. Valt terug op het eerst aangemaakte
 * (actieve) kind als er nog niets gekozen is, en maakt er zo nodig eerst één aan. */
export async function getActiveChildId(db: SQLiteDatabase): Promise<string> {
  const stored = await db.getFirstAsync<{ value: string }>(`SELECT value FROM app_state WHERE key = ?`, [
    ACTIVE_CHILD_KEY,
  ]);
  if (stored?.value) {
    const stillActive = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM child WHERE id = ? AND is_active = 1`,
      [stored.value]
    );
    if (stillActive) return stored.value;
  }

  await ensureAtLeastOneChild(db);
  const first = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM child WHERE is_active = 1 ORDER BY birth_date ASC LIMIT 1`
  );
  const fallbackId = first?.id ?? DEFAULT_CHILD_ID;
  await setActiveChildId(db, fallbackId);
  return fallbackId;
}

export async function setActiveChildId(db: SQLiteDatabase, childId: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_state (key, value) VALUES (?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    [ACTIVE_CHILD_KEY, childId]
  );
}

function parseWheelConfig(raw: string | null): string[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : null;
  } catch {
    return null;
  }
}

export async function getChildSettings(db: SQLiteDatabase, childId: string): Promise<ChildSettings> {
  const row = await db.getFirstAsync<{
    time_format: TimeFormat;
    temp_unit: TempUnit;
    volume_unit: VolumeUnit;
    left_handed: number;
    day_start_hour: number;
    wheel_config: string | null;
    night_mode_auto: number;
    language: LanguageSetting;
    onboarding_name_dismissed: number;
  }>(
    `SELECT time_format, temp_unit, volume_unit, left_handed, day_start_hour, wheel_config, night_mode_auto, language, onboarding_name_dismissed
     FROM child WHERE id = ?`,
    [childId]
  );

  return {
    timeFormat: row?.time_format ?? '24h',
    tempUnit: row?.temp_unit ?? 'celsius',
    volumeUnit: row?.volume_unit ?? 'ml',
    leftHanded: (row?.left_handed ?? 0) === 1,
    dayStartHour: row?.day_start_hour ?? 0,
    wheelConfig: parseWheelConfig(row?.wheel_config ?? null),
    nightModeAuto: (row?.night_mode_auto ?? 0) === 1,
    language: row?.language ?? 'system',
    onboardingNameDismissed: (row?.onboarding_name_dismissed ?? 0) === 1,
  };
}

export interface ChildSettingsUpdate {
  timeFormat?: TimeFormat;
  tempUnit?: TempUnit;
  volumeUnit?: VolumeUnit;
  leftHanded?: boolean;
  dayStartHour?: number;
  wheelConfig?: string[] | null;
  nightModeAuto?: boolean;
  language?: LanguageSetting;
  onboardingNameDismissed?: boolean;
}

export interface ChildWithSettings extends Child, ChildSettings {}

export async function getChildWithSettings(db: SQLiteDatabase, id: string): Promise<ChildWithSettings | null> {
  const children = await listChildren(db, true);
  const child = children.find((c) => c.id === id);
  if (!child) return null;
  const settings = await getChildSettings(db, id);
  return { ...child, ...settings };
}

/** Zet een volledig kind (structuur + instellingen) terug, met behoud van het originele
 * id — gebruikt bij het importeren van een back-up, net als importEventRow voor events.
 * Een back-up kent geen sync_id/sync_key/sync_enabled/last_synced_at (die horen niet bij
 * het kind zelf, zie ChildSyncInfo) — ON CONFLICT DO UPDATE raakt die kolommen daarom
 * bewust niet aan, in plaats van INSERT OR REPLACE, dat de hele rij eerst zou verwijderen
 * en dus een bestaande partner-koppeling zou slopen bij het herstellen van een back-up. */
export async function importChildRow(db: SQLiteDatabase, child: ChildWithSettings): Promise<void> {
  await db.runAsync(
    `INSERT INTO child
       (id, name, birth_date, is_active, time_format, temp_unit, volume_unit,
        left_handed, day_start_hour, wheel_config, night_mode_auto, language, onboarding_name_dismissed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       name = excluded.name, birth_date = excluded.birth_date, is_active = excluded.is_active,
       time_format = excluded.time_format, temp_unit = excluded.temp_unit, volume_unit = excluded.volume_unit,
       left_handed = excluded.left_handed, day_start_hour = excluded.day_start_hour,
       wheel_config = excluded.wheel_config, night_mode_auto = excluded.night_mode_auto,
       language = excluded.language, onboarding_name_dismissed = excluded.onboarding_name_dismissed`,
    [
      child.id,
      child.name,
      child.birthDate,
      child.isActive ? 1 : 0,
      child.timeFormat,
      child.tempUnit,
      child.volumeUnit,
      child.leftHanded ? 1 : 0,
      child.dayStartHour,
      child.wheelConfig ? JSON.stringify(child.wheelConfig) : null,
      child.nightModeAuto ? 1 : 0,
      child.language,
      child.onboardingNameDismissed ? 1 : 0,
    ]
  );
}

export async function updateChildSettings(
  db: SQLiteDatabase,
  childId: string,
  patch: ChildSettingsUpdate
): Promise<void> {
  const current = await getChildSettings(db, childId);
  // Per-field fallback (not a blind spread): callers may pass a key explicitly set to
  // undefined to mean "leave this one alone" (e.g. an invalid/empty settings field).
  const timeFormat = patch.timeFormat ?? current.timeFormat;
  const tempUnit = patch.tempUnit ?? current.tempUnit;
  const volumeUnit = patch.volumeUnit ?? current.volumeUnit;
  const leftHanded = patch.leftHanded ?? current.leftHanded;
  const dayStartHour = patch.dayStartHour ?? current.dayStartHour;
  const wheelConfig = patch.wheelConfig !== undefined ? patch.wheelConfig : current.wheelConfig;
  const nightModeAuto = patch.nightModeAuto ?? current.nightModeAuto;
  const language = patch.language ?? current.language;
  const onboardingNameDismissed = patch.onboardingNameDismissed ?? current.onboardingNameDismissed;

  await db.runAsync(
    `UPDATE child
     SET time_format = ?, temp_unit = ?, volume_unit = ?,
         left_handed = ?, day_start_hour = ?, wheel_config = ?, night_mode_auto = ?, language = ?,
         onboarding_name_dismissed = ?
     WHERE id = ?`,
    [
      timeFormat,
      tempUnit,
      volumeUnit,
      leftHanded ? 1 : 0,
      dayStartHour,
      wheelConfig ? JSON.stringify(wheelConfig) : null,
      nightModeAuto ? 1 : 0,
      language,
      onboardingNameDismissed ? 1 : 0,
      childId,
    ]
  );
  // Toestel-instellingen gelden voor alle kinderen (zie DEVICE_SETTING_COLUMNS).
  await alignDeviceSettings(db, childId);
}

/** Na het koppelen via QR: bleek de gedeelde geschiedenis al bij één bestaand, niet-gedeeld
 * kind op dit toestel te staan (typisch: back-up teruggezet, daarna de QR van de partner
 * gescand), dan wordt DAT kind gekoppeld en verdwijnt het net aangemaakte, lege kind — anders
 * staat de geschiedenis over twee kinderen verdeeld. Geeft het id van het kind dat overblijft.
 *
 * `foreign` = per lokaal kind hoeveel binnengekomen events daar al stonden (pullChanges). Alleen
 * als dat precies één kind is dat zelf niet gedeeld is; anders verandert er niets. */
export async function adoptRestoredChild(
  db: SQLiteDatabase,
  linkedChildId: string,
  foreign: Map<string, number>
): Promise<string> {
  const candidates = [...foreign.entries()].filter(([, count]) => count > 0);
  if (candidates.length !== 1) return linkedChildId;
  const [targetId] = candidates[0];
  const target = await getChildSyncInfo(db, targetId);
  const linked = await getChildSyncInfo(db, linkedChildId);
  if (!target || target.syncId || !linked?.syncId) return linkedChildId;

  await db.withTransactionAsync(async () => {
    // Eerst het nieuwe kind loskoppelen, dan pas de koppeling op het teruggezette kind zetten.
    await db.runAsync(`UPDATE child SET sync_id = NULL, sync_key = NULL, sync_enabled = 0 WHERE id = ?`, [
      linkedChildId,
    ]);
    await db.runAsync(
      `UPDATE child SET sync_id = ?, sync_key = ?, sync_enabled = 1, last_synced_at = ?,
         sync_seq_events = ?, sync_seq_ratings = ? WHERE id = ?`,
      [linked.syncId, linked.syncKey, linked.lastSyncedAt, linked.seqEvents, linked.seqRatings, targetId]
    );
    // Wat wél bij het nieuwe kind binnenkwam (events die hier nog niet stonden) verhuist mee.
    await db.runAsync(`UPDATE event SET child_id = ? WHERE child_id = ?`, [targetId, linkedChildId]);
    // Dagcijfer op beide kinderen: het nieuwste wint (laatste-schrijver-wint).
    await db.runAsync(
      `DELETE FROM day_log WHERE child_id = ? AND EXISTS (
         SELECT 1 FROM day_log AS other
         WHERE other.child_id = ? AND other.date = day_log.date AND other.updated_at > day_log.updated_at)`,
      [targetId, linkedChildId]
    );
    await db.runAsync(
      `UPDATE day_log SET child_id = ? WHERE child_id = ?
         AND date NOT IN (SELECT date FROM day_log WHERE child_id = ?)`,
      [targetId, linkedChildId, targetId]
    );
    await db.runAsync(`DELETE FROM day_log WHERE child_id = ?`, [linkedChildId]);
    await db.runAsync(`DELETE FROM child WHERE id = ?`, [linkedChildId]);
  });
  return targetId;
}
