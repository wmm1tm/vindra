import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import { getChildSyncInfo, listSyncedChildIds, updateLastSyncedAt, type ChildSyncInfo } from '@/db/child';
import { applyRemoteDayRating, getAllDayRatings } from '@/db/day-log';
import { applyRemoteEvent, getAllEvents, type EventRow } from '@/db/events';
import { decryptJson, encryptJson } from '@/lib/crypto';
import { isSyncConfigured, supabase } from '@/lib/supabase';

const PULL_INTERVAL_MS = 30_000;
// pushEvent/pushDayRating are fire-and-forget (see hun eigen comment) — een mislukte
// push (geen internet op dat moment) wordt anders nooit opnieuw geprobeerd. Elke zoveel
// pull-ticks wordt daarom alle lokale data van elk gedeeld kind opnieuw gepusht; de RPC's
// zijn idempotente upserts, dus dit is goedkoop voor de server. Een grovere interval dan
// de pull zelf, want dit stuurt (in tegenstelling tot de pull) de volledige geschiedenis
// opnieuw, niet alleen wat er sinds de vorige keer bijkwam.
const RETRY_PUSH_EVERY_N_TICKS = 10;
// Alles behalve id/child_id (lokaal, niet gedeeld) en updated_at (blijft plaintext op de
// server — nodig om conflicten op te lossen zonder de inhoud te hoeven ontsleutelen).
type EncryptedEventPayload = Omit<EventRow, 'id' | 'child_id' | 'updated_at'>;

function eventToPayload(event: EventRow): EncryptedEventPayload {
  const { id: _id, child_id: _childId, updated_at: _updatedAt, ...rest } = event;
  return rest;
}

/** Stuurt één event versleuteld naar de server. Doet niets als het kind niet gedeeld is
 * of er nog geen Supabase-project gekoppeld is — de rest van de app werkt dan gewoon
 * lokaal door, precies zoals vóór deze functie bestond. `sync` mag vooraf opgehaald
 * worden door de aanroeper (zie pushAllLocal) — scheelt een herhaalde SQLite-lookup van
 * exact dezelfde rij wanneer veel events na elkaar gepusht worden. */
export async function pushEvent(
  db: SQLiteDatabase,
  childId: string,
  event: EventRow,
  sync?: ChildSyncInfo
): Promise<void> {
  if (!supabase) return;
  const info = sync ?? (await getChildSyncInfo(db, childId));
  if (!info?.syncEnabled || !info.syncId || !info.syncKey) return;

  const ciphertext = encryptJson(info.syncKey, eventToPayload(event));
  const { error } = await supabase.rpc('upsert_sync_event', {
    p_sync_id: info.syncId,
    p_event_id: event.id,
    p_updated_at: event.updated_at,
    p_ciphertext: ciphertext,
  });
  // Sync-fouten mogen de app nooit blokkeren — lokaal is en blijft de bron van waarheid.
  // De volgende periodieke pull/push-poging herstelt dit vanzelf.
  if (error) console.warn('[sync] pushEvent failed', error.message);
}

export async function pushDayRating(
  db: SQLiteDatabase,
  childId: string,
  date: string,
  rating: number,
  sync?: ChildSyncInfo
): Promise<void> {
  if (!supabase) return;
  const info = sync ?? (await getChildSyncInfo(db, childId));
  if (!info?.syncEnabled || !info.syncId || !info.syncKey) return;

  const updatedAt = new Date().toISOString();
  const ciphertext = encryptJson(info.syncKey, { rating });
  const { error } = await supabase.rpc('upsert_sync_day_rating', {
    p_sync_id: info.syncId,
    p_date_key: date,
    p_updated_at: updatedAt,
    p_ciphertext: ciphertext,
  });
  if (error) console.warn('[sync] pushDayRating failed', error.message);
}

/** Stuurt alle bestaande lokale events/dagcijfers van een net gedeeld/gekoppeld kind in
 * één keer weg — gebruikt zowel bij het aanzetten van delen (zodat de partner straks bij
 * het scannen meteen de volledige geschiedenis binnenkrijgt) als niet bij het scannen zelf
 * (dat toestel begint immers leeg en heeft alleen iets te pullen, niets te pushen).
 * Haalt de sync-info één keer op i.p.v. dat elke afzonderlijke push-aanroep dezelfde
 * kind-rij nog eens opvraagt — telt op bij honderden events (zie retryPushForChild). */
export async function pushAllLocal(
  db: SQLiteDatabase,
  childId: string,
  events: EventRow[]
): Promise<void> {
  const sync = await getChildSyncInfo(db, childId);
  if (!sync?.syncEnabled || !sync.syncId || !sync.syncKey) return;
  const dayRatings = await getAllDayRatings(db, childId);
  await Promise.all([
    ...events.map((event) => pushEvent(db, childId, event, sync)),
    ...dayRatings
      .filter((entry): entry is { date: string; rating: number } => entry.rating !== null)
      .map((entry) => pushDayRating(db, childId, entry.date, entry.rating, sync)),
  ]);
}

/** Geeft de hoogste `updated_at` terug die daadwerkelijk binnenkwam (of null als er
 * niks was) — dat, en niet de kloktijd van dit moment, hoort het volgende watermark te
 * worden. Zie pullChanges voor waarom. */
async function pullEvents(
  db: SQLiteDatabase,
  childId: string,
  sync: ChildSyncInfo,
  since: string
): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_sync_events', { p_sync_id: sync.syncId, p_since: since });
  if (error) {
    console.warn('[sync] pullEvents failed', error.message);
    return null;
  }
  let maxUpdatedAt: string | null = null;
  for (const row of (data ?? []) as { event_id: string; updated_at: string; ciphertext: string }[]) {
    try {
      const payload = decryptJson<EncryptedEventPayload>(sync.syncKey!, row.ciphertext);
      await applyRemoteEvent(db, childId, { ...payload, id: row.event_id, child_id: childId, updated_at: row.updated_at });
      if (!maxUpdatedAt || row.updated_at > maxUpdatedAt) maxUpdatedAt = row.updated_at;
    } catch (err) {
      // Eén beschadigde/onontsleutelbare rij mag de rest van de sync niet blokkeren.
      console.warn('[sync] could not decrypt event', row.event_id, err);
    }
  }
  return maxUpdatedAt;
}

async function pullDayRatings(
  db: SQLiteDatabase,
  childId: string,
  sync: ChildSyncInfo,
  since: string
): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_sync_day_ratings', { p_sync_id: sync.syncId, p_since: since });
  if (error) {
    console.warn('[sync] pullDayRatings failed', error.message);
    return null;
  }
  let maxUpdatedAt: string | null = null;
  for (const row of (data ?? []) as { date_key: string; updated_at: string; ciphertext: string }[]) {
    try {
      const payload = decryptJson<{ rating: number }>(sync.syncKey!, row.ciphertext);
      await applyRemoteDayRating(db, childId, row.date_key, payload.rating, row.updated_at);
      if (!maxUpdatedAt || row.updated_at > maxUpdatedAt) maxUpdatedAt = row.updated_at;
    } catch (err) {
      console.warn('[sync] could not decrypt day rating', row.date_key, err);
    }
  }
  return maxUpdatedAt;
}

/** Haalt alle wijzigingen op sinds de laatste keer, past ze toe (laatste-schrijver-wint),
 * en werkt het watermark bij. Faalt stil bij geen internet/geen configuratie.
 *
 * Het watermark schuift alleen op tot de hoogste `updated_at` die deze keer daadwerkelijk
 * binnenkwam — niet tot de kloktijd van dit moment. Anders zou een toestel dat elke 30
 * sec. pollt zijn eigen watermark steeds verder voor laten lopen op de klok, en zou een
 * rij die pas laat gepusht wordt (bv. een ander toestel was even offline) met een
 * `updated_at` van vóór dat moment voorgoed gefilterd worden door `get_sync_events`'
 * `updated_at > p_since` — stil en permanent gemist, zonder dat er ooit een fout
 * verschijnt. */
export async function pullChanges(db: SQLiteDatabase, childId: string): Promise<void> {
  if (!supabase) return;
  const sync = await getChildSyncInfo(db, childId);
  if (!sync?.syncEnabled || !sync.syncId || !sync.syncKey) return;

  const since = sync.lastSyncedAt ?? '1970-01-01T00:00:00.000Z';
  const [eventsMax, ratingsMax] = await Promise.all([
    pullEvents(db, childId, sync, since),
    pullDayRatings(db, childId, sync, since),
  ]);
  const newWatermark = [since, eventsMax, ratingsMax]
    .filter((value): value is string => value !== null)
    .sort()
    .pop()!;
  if (newWatermark !== since) {
    await updateLastSyncedAt(db, childId, newWatermark);
  }
}

/** Ruimt de server-side sync-data van een kind op — hoort bij het (onomkeerbare) hard
 * verwijderen van een kind (db/child.ts deleteChild), niet bij archiveren: archiveren is
 * omkeerbaar en de sync-koppeling moet daarna gewoon nog werken. Zonder dit zou een
 * verwijderd kind's data eeuwig op de server blijven staan, en zou een gekoppeld
 * partnertoestel het nog wel proberen te blijven synchroniseren. Faalt stil, net als de
 * rest van de sync-functies — een mislukte opruiming mag het lokale verwijderen nooit
 * blokkeren. */
export async function unshareChild(db: SQLiteDatabase, childId: string): Promise<void> {
  if (!supabase) return;
  const sync = await getChildSyncInfo(db, childId);
  if (!sync?.syncId) return;
  const { error } = await supabase.rpc('unshare_sync_child', { p_sync_id: sync.syncId });
  if (error) console.warn('[sync] unshareChild failed', error.message);
}

async function retryPushForChild(db: SQLiteDatabase, childId: string): Promise<void> {
  const events = await getAllEvents(db, childId);
  await pushAllLocal(db, childId, events);
}

/** Pullt bij het openen van de app en daarna elke 30 sec. zolang de app op de voorgrond
 * is, voor ELK gedeeld kind — niet alleen het kind dat op dit moment bekeken wordt, want
 * een tweede gedeeld kind moet net zo goed blijven synchroniseren terwijl het scherm een
 * ander kind toont. Elke RETRY_PUSH_EVERY_N_TICKS pusht dit ook alle lokale data nog eens
 * opnieuw, als vangnet voor een eerdere pushEvent/pushDayRating die zonder internet
 * mislukte en anders nooit opnieuw geprobeerd zou worden. Geen effect als sync niet
 * geconfigureerd is of geen enkel kind gedeeld is. */
/** `onChanged` fires after every tick that actually pulled for at least one shared
 * child — nothing else tells a mounted screen that a background sync just wrote new
 * rows into SQLite (applyRemoteEvent goes straight to the DB, bypassing the normal
 * setEvents/badgeRefreshToken flow local edits use), so without this a partner's
 * events silently sit in the local DB, invisible until the viewer happens to trigger
 * their own refetch (switching day/child, reopening the app). Read via a ref so
 * passing a fresh inline callback each render doesn't restart the interval. */
export function useSyncLoop(db: SQLiteDatabase, onChanged?: () => void) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(0);
  const onChangedRef = useRef(onChanged);
  useEffect(() => {
    onChangedRef.current = onChanged;
  });

  useEffect(() => {
    if (!isSyncConfigured) return;

    const runTick = async () => {
      const childIds = await listSyncedChildIds(db);
      if (childIds.length === 0) return;
      await Promise.all(childIds.map((id) => pullChanges(db, id)));
      onChangedRef.current?.();
      tickRef.current += 1;
      if (tickRef.current % RETRY_PUSH_EVERY_N_TICKS === 0) {
        await Promise.all(childIds.map((id) => retryPushForChild(db, id)));
      }
    };

    runTick();
    intervalRef.current = setInterval(runTick, PULL_INTERVAL_MS);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') runTick();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription.remove();
    };
  }, [db]);
}
