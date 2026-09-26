import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  getChildSyncInfo,
  listSyncedChildIds,
  updateLastSyncedAt,
  updateSyncSeq,
  type ChildSyncInfo,
} from '@/db/child';
import {
  applyRemoteDayRating,
  getDirtyDayRatings,
  markDayRatingPushed,
  type DayRatingRow,
} from '@/db/day-log';
import { applyRemoteEvent, getDirtyEvents, markEventPushed, type EventRow } from '@/db/events';
import { decryptJson, encryptJson } from '@/lib/crypto';
import { isSyncConfigured, supabase } from '@/lib/supabase';

/** Partner-sync (versleuteld, via Supabase). Lokaal is en blijft de bron van waarheid; sync
 * mag de app nooit blokkeren.
 *
 * - Push: elke lokale wijziging maakt een rij "dirty" (db: pushed_updated_at ≠ updated_at).
 *   Elke tik pusht alleen die rijen — ook verwijderde — en markeert ze daarna als gepusht.
 * - Pull: de server geeft elke rij een oplopend volgnummer (seq, trigger in
 *   supabase/schema.sql). We halen per kind in pagina's op wat na ons hoogste seq kwam, dus
 *   een rij die laat binnenkomt met een oude updated_at wordt nooit gemist. Zolang de server
 *   de v2-functies nog niet heeft, valt de pull terug op de oude updated_at-watermark.
 * - Toepassen is laatste-schrijver-wint op updated_at (genormaliseerd naar toISOString). */

const PULL_INTERVAL_MS = 30_000;
const PULL_PAGE_SIZE = 500;
/** PostgREST-foutcode als een RPC-functie (nog) niet bestaat op de server. */
const MISSING_FUNCTION_CODE = 'PGRST202';

// Alles behalve id/child_id (lokaal, niet gedeeld) en updated_at (blijft plaintext op de
// server — nodig om conflicten op te lossen zonder de inhoud te hoeven ontsleutelen).
type EncryptedEventPayload = Omit<EventRow, 'id' | 'child_id' | 'updated_at'>;

/** Expliciet de gedeelde velden: nooit lokale boekhouding (pushed_updated_at) meesturen. */
function eventToPayload(event: EventRow): EncryptedEventPayload {
  return {
    kind: event.kind,
    start_at: event.start_at,
    end_at: event.end_at,
    amount_ml: event.amount_ml,
    side: event.side,
    variant: event.variant,
    note: event.note,
    temperature_c: event.temperature_c,
    // Vindra: ABC-velden en prikkelprofiel gaan gewoon mee (versleuteld).
    antecedent: event.antecedent ?? null,
    location: event.location ?? null,
    what_helped: event.what_helped ?? null,
    sensory_threshold: event.sensory_threshold ?? null,
    sensory_response: event.sensory_response ?? null,
    created_at: event.created_at,
    deleted_at: event.deleted_at,
  };
}

/** Postgres geeft "2026-09-26T10:00:00.123+00:00" terug, lokaal staat "…123Z": zonder
 * normaliseren klopt de tekstvergelijking van laatste-schrijver-wint niet. */
function normalizeTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

let syncPaused = false;

/** Sync pauzeert als het abonnement verlopen is (partner-sync is Pro): er wordt niets
 * gepusht of opgehaald, maar alle data blijft lokaal staan en wat intussen gewijzigd werd
 * blijft dirty — bij een nieuw abonnement gaat het alsnog mee. */
export function setSyncPaused(paused: boolean) {
  syncPaused = paused;
}

export function isSyncPaused() {
  return syncPaused;
}

function isActiveSync(info: ChildSyncInfo | null): info is ChildSyncInfo & { syncId: string; syncKey: string } {
  return Boolean(info?.syncEnabled && info.syncId && info.syncKey);
}

async function pushEventRow(db: SQLiteDatabase, sync: { syncId: string; syncKey: string }, event: EventRow) {
  if (!supabase) return false;
  const { error } = await supabase.rpc('upsert_sync_event', {
    p_sync_id: sync.syncId,
    p_event_id: event.id,
    p_updated_at: event.updated_at,
    p_ciphertext: encryptJson(sync.syncKey, eventToPayload(event)),
  });
  if (error) {
    console.warn('[sync] push event failed', error.message);
    return false;
  }
  await markEventPushed(db, event.id, event.updated_at);
  return true;
}

async function pushDayRatingRow(
  db: SQLiteDatabase,
  childId: string,
  sync: { syncId: string; syncKey: string },
  row: DayRatingRow
) {
  if (!supabase || row.rating === null) return false;
  // De OPGESLAGEN updated_at, niet "nu": anders overschreef een late retry een nieuwere
  // waarde van de partner.
  const { error } = await supabase.rpc('upsert_sync_day_rating', {
    p_sync_id: sync.syncId,
    p_date_key: row.date,
    p_updated_at: row.updated_at,
    p_ciphertext: encryptJson(sync.syncKey, { rating: row.rating }),
  });
  if (error) {
    console.warn('[sync] push day rating failed', error.message);
    return false;
  }
  await markDayRatingPushed(db, childId, row.date, row.updated_at);
  return true;
}

async function runPushDirty(db: SQLiteDatabase, childId: string): Promise<void> {
  if (!supabase || syncPaused) return;
  const sync = await getChildSyncInfo(db, childId);
  if (!isActiveSync(sync)) return;
  const [events, ratings] = await Promise.all([getDirtyEvents(db, childId), getDirtyDayRatings(db, childId)]);
  for (const event of events) await pushEventRow(db, sync, event);
  for (const row of ratings) await pushDayRatingRow(db, childId, sync, row);
}

const pushInFlight = new Map<string, Promise<void>>();
const pushQueued = new Map<string, Promise<void>>();

/** Pusht alles wat voor dit kind nog dirty is (events incl. verwijderde, dagbeoordelingen).
 * Doet niets als het kind niet gedeeld is, sync gepauzeerd is of Supabase ontbreekt. Per kind
 * loopt er hooguit één push tegelijk, met hooguit één herhaling in de rij — zo gaat een rij
 * niet dubbel de deur uit als je snel achter elkaar logt. */
export function pushDirty(db: SQLiteDatabase, childId: string): Promise<void> {
  const running = pushInFlight.get(childId);
  if (!running) {
    const promise = runPushDirty(db, childId).finally(() => pushInFlight.delete(childId));
    pushInFlight.set(childId, promise);
    return promise;
  }
  const queued = pushQueued.get(childId);
  if (queued) return queued;
  const next = running
    .catch(() => undefined)
    .then(() => {
      pushQueued.delete(childId);
      return pushDirty(db, childId);
    });
  pushQueued.set(childId, next);
  return next;
}

/** Na een lokale wijziging meteen proberen te pushen (fire-and-forget). Pusht alle dirty
 * rijen van het kind, dus ook eerder mislukte; `_event` blijft voor de leesbaarheid van de
 * aanroepers, de database is de bron (een rij die van de server kwam is niet dirty en gaat
 * dus niet onnodig terug). */
export function pushEvent(db: SQLiteDatabase, childId: string, _event?: EventRow): Promise<void> {
  return pushDirty(db, childId).catch((error) => console.warn('[sync] push failed', error));
}

/** Idem na het zetten van een dagbeoordeling. */
export function pushDayRating(db: SQLiteDatabase, childId: string): Promise<void> {
  return pushDirty(db, childId).catch((error) => console.warn('[sync] push failed', error));
}

export interface PullResult {
  /** Of er lokaal echt iets veranderde (voor het verversen van het scherm). */
  changed: boolean;
  /** Foutmelding als de pull mislukte (geen internet, server-fout), anders null. */
  error: string | null;
}

export interface PullOptions {
  /** Telt per ander lokaal kind hoeveel binnengekomen events daar al stonden — gebruikt bij
   * het koppelen om een teruggezet kind te herkennen (zie adoptRestoredChild in db/child.ts). */
  foreign?: Map<string, number>;
}

interface RemoteEventRow {
  event_id: string;
  updated_at: string;
  ciphertext: string;
  seq?: number;
}

interface RemoteRatingRow {
  date_key: string;
  updated_at: string;
  ciphertext: string;
  seq?: number;
}

async function applyEventRows(
  db: SQLiteDatabase,
  childId: string,
  syncKey: string,
  rows: RemoteEventRow[],
  foreign?: Map<string, number>
): Promise<boolean> {
  let changed = false;
  for (const row of rows) {
    try {
      if (foreign) {
        // Staat dit event hier al bij een ANDER kind (bv. na het terugzetten van een back-up)?
        // Dan blijft het daar (child_id verandert nooit); de koppelstap telt dit mee.
        const owner = await db.getFirstAsync<{ child_id: string }>(`SELECT child_id FROM event WHERE id = ?`, [
          row.event_id,
        ]);
        if (owner && owner.child_id !== childId) foreign.set(owner.child_id, (foreign.get(owner.child_id) ?? 0) + 1);
      }
      const payload = decryptJson<EncryptedEventPayload>(syncKey, row.ciphertext);
      const applied = await applyRemoteEvent(db, childId, {
        ...payload,
        id: row.event_id,
        child_id: childId,
        updated_at: normalizeTimestamp(row.updated_at),
      });
      changed = changed || applied;
    } catch (err) {
      // Eén beschadigde/onontsleutelbare rij mag de rest van de sync niet blokkeren.
      console.warn('[sync] could not decrypt event', row.event_id, err);
    }
  }
  return changed;
}

async function applyRatingRows(
  db: SQLiteDatabase,
  childId: string,
  syncKey: string,
  rows: RemoteRatingRow[]
): Promise<boolean> {
  let changed = false;
  for (const row of rows) {
    try {
      const payload = decryptJson<{ rating: number }>(syncKey, row.ciphertext);
      const applied = await applyRemoteDayRating(
        db,
        childId,
        row.date_key,
        payload.rating,
        normalizeTimestamp(row.updated_at)
      );
      changed = changed || applied;
    } catch (err) {
      console.warn('[sync] could not decrypt day rating', row.date_key, err);
    }
  }
  return changed;
}

type PagedPullOutcome = { changed: boolean; error: string | null; missingFunction: boolean };

/** Haalt pagina voor pagina op wat na `sinceSeq` kwam, tot een korte pagina. De watermark
 * gaat na elke toegepaste pagina omhoog. */
async function pullPaged<Row extends { seq?: number }>(
  fn: 'get_sync_events_v2' | 'get_sync_day_ratings_v2',
  syncId: string,
  sinceSeq: number,
  apply: (rows: Row[]) => Promise<boolean>,
  saveSeq: (seq: number) => Promise<void>
): Promise<PagedPullOutcome> {
  if (!supabase) return { changed: false, error: null, missingFunction: false };
  let since = sinceSeq;
  let changed = false;
  for (;;) {
    const { data, error } = await supabase.rpc(fn, { p_sync_id: syncId, p_since_seq: since, p_limit: PULL_PAGE_SIZE });
    if (error) {
      return { changed, error: error.message, missingFunction: error.code === MISSING_FUNCTION_CODE };
    }
    const rows = (data ?? []) as Row[];
    if (rows.length === 0) break;
    changed = (await apply(rows)) || changed;
    const maxSeq = rows.reduce((max, row) => Math.max(max, Number(row.seq ?? 0)), since);
    if (maxSeq > since) {
      since = maxSeq;
      await saveSeq(since);
    }
    if (rows.length < PULL_PAGE_SIZE) break;
  }
  return { changed, error: null, missingFunction: false };
}

/** Terugval voor een server zonder de v2-functies (SQL nog niet geplakt): de oude pull op
 * updated_at, met de hoogste binnengekomen updated_at als watermark. */
async function pullLegacy(
  db: SQLiteDatabase,
  childId: string,
  sync: ChildSyncInfo & { syncId: string; syncKey: string },
  options: PullOptions
): Promise<PullResult> {
  if (!supabase) return { changed: false, error: null };
  const since = sync.lastSyncedAt ?? '1970-01-01T00:00:00.000Z';
  const [eventsRes, ratingsRes] = await Promise.all([
    supabase.rpc('get_sync_events', { p_sync_id: sync.syncId, p_since: since }),
    supabase.rpc('get_sync_day_ratings', { p_sync_id: sync.syncId, p_since: since }),
  ]);
  const error = eventsRes.error?.message ?? ratingsRes.error?.message ?? null;
  const eventRows = (eventsRes.data ?? []) as RemoteEventRow[];
  const ratingRows = (ratingsRes.data ?? []) as RemoteRatingRow[];
  const changedEvents = await applyEventRows(db, childId, sync.syncKey, eventRows, options.foreign);
  const changedRatings = await applyRatingRows(db, childId, sync.syncKey, ratingRows);
  const newest = [since, ...eventRows.map((r) => r.updated_at), ...ratingRows.map((r) => r.updated_at)]
    .map(normalizeTimestamp)
    .sort()
    .pop()!;
  if (newest !== since) await updateLastSyncedAt(db, childId, newest);
  return { changed: changedEvents || changedRatings, error };
}

/** Haalt alle wijzigingen van de partner op en past ze toe (laatste-schrijver-wint). Faalt
 * nooit hard: een fout komt terug in `error` (bv. om bij het koppelen te tonen). */
export async function pullChanges(db: SQLiteDatabase, childId: string, options: PullOptions = {}): Promise<PullResult> {
  if (!supabase || syncPaused) return { changed: false, error: null };
  const sync = await getChildSyncInfo(db, childId);
  if (!isActiveSync(sync)) return { changed: false, error: null };

  try {
    const events = await pullPaged<RemoteEventRow>(
      'get_sync_events_v2',
      sync.syncId,
      sync.seqEvents,
      (rows) => applyEventRows(db, childId, sync.syncKey, rows, options.foreign),
      (seq) => updateSyncSeq(db, childId, 'events', seq)
    );
    if (events.missingFunction) return await pullLegacy(db, childId, sync, options);
    const ratings = await pullPaged<RemoteRatingRow>(
      'get_sync_day_ratings_v2',
      sync.syncId,
      sync.seqRatings,
      (rows) => applyRatingRows(db, childId, sync.syncKey, rows),
      (seq) => updateSyncSeq(db, childId, 'ratings', seq)
    );
    return { changed: events.changed || ratings.changed, error: events.error ?? ratings.error };
  } catch (err) {
    return { changed: false, error: err instanceof Error ? err.message : String(err) };
  }
}

const PULL_BEFORE_ACTION_TIMEOUT_MS = 3000;

/** Vóór het starten van een slaap op een gedeeld kind: even ophalen wat de partner deed,
 * met een time-out — zonder internet gaat de actie gewoon lokaal door. Doet niets bij een
 * niet-gedeeld kind. Gooit nooit. */
export async function pullBeforeAction(db: SQLiteDatabase, childId: string): Promise<void> {
  if (!supabase || syncPaused) return;
  try {
    const sync = await getChildSyncInfo(db, childId);
    if (!isActiveSync(sync)) return;
    await Promise.race([
      pullChanges(db, childId),
      new Promise((resolve) => setTimeout(resolve, PULL_BEFORE_ACTION_TIMEOUT_MS)),
    ]);
  } catch (error) {
    console.warn('[sync] pull before action failed', error);
  }
}

/** Pullt bij het openen van de app, bij terugkomen naar de voorgrond en daarna elke 30 sec.,
 * voor ELK gedeeld kind (niet alleen het bekeken kind), en pusht daarna wat nog dirty is —
 * zo komt een eerder mislukte push (geen internet) alsnog aan, ook een verwijdering.
 *
 * `onChanged` vuurt alleen als een pull lokaal echt iets veranderde: een pull schrijft
 * rechtstreeks in SQLite (applyRemoteEvent), dus zonder dit signaal zou het scherm de events
 * van de partner pas tonen bij de volgende eigen refetch. Via een ref, zodat een nieuwe
 * inline-callback per render het interval niet herstart. */
export function useSyncLoop(db: SQLiteDatabase, onChanged?: () => void) {
  const onChangedRef = useRef(onChanged);
  useEffect(() => {
    onChangedRef.current = onChanged;
  });

  useEffect(() => {
    if (!isSyncConfigured) return;
    let running = false;

    const runTick = async () => {
      if (running || syncPaused) return;
      running = true;
      try {
        const childIds = await listSyncedChildIds(db);
        if (childIds.length === 0) return;
        const results = await Promise.all(childIds.map((id) => pullChanges(db, id)));
        if (results.some((result) => result.changed)) onChangedRef.current?.();
        await Promise.all(childIds.map((id) => pushDirty(db, id)));
      } catch (error) {
        console.warn('[sync] tick failed', error);
      } finally {
        running = false;
      }
    };

    runTick();
    const interval = setInterval(runTick, PULL_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') runTick();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [db]);
}
