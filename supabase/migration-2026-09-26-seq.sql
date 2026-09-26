-- ============================================================================
-- Vindra partner-sync: server-volgnummer (seq) — migratie van 2026-09-26
-- ============================================================================
-- PLAKKEN IN: Supabase → SQL Editor van het Vindra-project (app.json
-- expo.extra.supabaseUrl) → "Run". Mag vaker gedraaid worden (idempotent).
--
-- Wat het doet:
--   * Elke rij in sync_events en sync_day_ratings krijgt een oplopend
--     volgnummer `seq`, gezet door de SERVER (trigger, nextval) bij elke insert
--     of update. Ook oude app-versies, die gewoon upsert_sync_event blijven
--     aanroepen, krijgen zo automatisch een seq — er verandert voor hen niets.
--   * Bestaande rijen krijgen eenmalig een seq (backfill).
--   * Nieuwe functies get_sync_events_v2 / get_sync_day_ratings_v2 geven rijen
--     terug met seq > p_since_seq, op volgorde, in pagina's van p_limit. De app
--     onthoudt per kind het hoogste seq dat hij zag. Anders dan de oude
--     updated_at-watermark mist dit nooit een rij die laat binnenkomt met een
--     oude updated_at (bv. een partner die even offline was).
--   * De oude functies (get_sync_events, upsert_sync_event, ...) blijven
--     ongewijzigd bestaan, zodat een partner met een oudere app-versie gewoon
--     blijft synchroniseren.
-- ============================================================================

create sequence if not exists sync_seq;

alter table sync_events add column if not exists seq bigint;
alter table sync_day_ratings add column if not exists seq bigint;
-- Wanneer de seq werd uitgedeeld. De v2-functies geven een rij pas terug als die
-- minstens 2 seconden oud is: een schrijfactie die seq 10 kreeg maar pas ná seq 11
-- vastlegt, zou anders gemist worden door een app die seq 11 al zag.
alter table sync_events add column if not exists seq_at timestamptz;
alter table sync_day_ratings add column if not exists seq_at timestamptz;

create or replace function set_sync_seq()
returns trigger language plpgsql as $$
begin
  new.seq := nextval('sync_seq');
  new.seq_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists sync_events_set_seq on sync_events;
create trigger sync_events_set_seq
  before insert or update on sync_events
  for each row execute function set_sync_seq();

drop trigger if exists sync_day_ratings_set_seq on sync_day_ratings;
create trigger sync_day_ratings_set_seq
  before insert or update on sync_day_ratings
  for each row execute function set_sync_seq();

-- Backfill: de trigger vult seq bij deze update vanzelf in.
update sync_events set seq = null where seq is null or seq_at is null;
update sync_day_ratings set seq = null where seq is null or seq_at is null;

create index if not exists sync_events_sync_id_seq_idx on sync_events (sync_id, seq);
create index if not exists sync_day_ratings_sync_id_seq_idx on sync_day_ratings (sync_id, seq);

create or replace function get_sync_events_v2(p_sync_id uuid, p_since_seq bigint, p_limit int)
returns table (event_id text, updated_at timestamptz, ciphertext text, seq bigint)
language sql security definer set search_path = public as $$
  select e.event_id, e.updated_at, e.ciphertext, e.seq
  from sync_events e
  where e.sync_id = p_sync_id and e.seq > p_since_seq
    and e.seq_at < clock_timestamp() - interval '2 seconds'
  order by e.seq
  limit least(greatest(p_limit, 1), 1000);
$$;

create or replace function get_sync_day_ratings_v2(p_sync_id uuid, p_since_seq bigint, p_limit int)
returns table (date_key text, updated_at timestamptz, ciphertext text, seq bigint)
language sql security definer set search_path = public as $$
  select r.date_key, r.updated_at, r.ciphertext, r.seq
  from sync_day_ratings r
  where r.sync_id = p_sync_id and r.seq > p_since_seq
    and r.seq_at < clock_timestamp() - interval '2 seconds'
  order by r.seq
  limit least(greatest(p_limit, 1), 1000);
$$;

grant execute on function get_sync_events_v2(uuid, bigint, int), get_sync_day_ratings_v2(uuid, bigint, int) to anon;
