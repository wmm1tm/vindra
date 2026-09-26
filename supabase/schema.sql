-- Vindra partner-sync schema.
-- Eenmalig plakken in het Supabase SQL Editor van het project uit app.json
-- (expo.extra.supabaseUrl). Zie lib/sync.ts en lib/crypto.ts voor hoe de app
-- dit gebruikt (versleuteld, geen accounts, geen directe tabeltoegang — alleen via de
-- onderstaande RPC-functies die een sync_id verplicht stellen). Origineel ontwerp
-- 1-op-1 overgenomen van Nuvo's eigen sync-architectuur.

create table sync_events (
  sync_id uuid not null,
  event_id text not null,
  updated_at timestamptz not null,
  ciphertext text not null,
  primary key (sync_id, event_id)
);

create table sync_day_ratings (
  sync_id uuid not null,
  date_key text not null,
  updated_at timestamptz not null,
  ciphertext text not null,
  primary key (sync_id, date_key)
);

alter table sync_events enable row level security;
alter table sync_day_ratings enable row level security;
-- Bewust geen policies: PostgREST kan deze tabellen dus niet direct lezen/schrijven,
-- alleen via de functies hieronder, die altijd een sync_id verplicht stellen.

create or replace function get_sync_events(p_sync_id uuid, p_since timestamptz)
returns setof sync_events language sql security definer as $$
  select * from sync_events where sync_id = p_sync_id and updated_at > p_since;
$$;

create or replace function upsert_sync_event(p_sync_id uuid, p_event_id text, p_updated_at timestamptz, p_ciphertext text)
returns void language sql security definer as $$
  insert into sync_events (sync_id, event_id, updated_at, ciphertext)
  values (p_sync_id, p_event_id, p_updated_at, p_ciphertext)
  on conflict (sync_id, event_id) do update
    set updated_at = excluded.updated_at, ciphertext = excluded.ciphertext
    where excluded.updated_at >= sync_events.updated_at;
$$;

create or replace function get_sync_day_ratings(p_sync_id uuid, p_since timestamptz)
returns setof sync_day_ratings language sql security definer as $$
  select * from sync_day_ratings where sync_id = p_sync_id and updated_at > p_since;
$$;

create or replace function upsert_sync_day_rating(p_sync_id uuid, p_date_key text, p_updated_at timestamptz, p_ciphertext text)
returns void language sql security definer as $$
  insert into sync_day_ratings (sync_id, date_key, updated_at, ciphertext)
  values (p_sync_id, p_date_key, p_updated_at, p_ciphertext)
  on conflict (sync_id, date_key) do update
    set updated_at = excluded.updated_at, ciphertext = excluded.ciphertext
    where excluded.updated_at >= sync_day_ratings.updated_at;
$$;

-- Geroepen wanneer een gedeeld kind lokaal permanent verwijderd wordt (zie
-- db/child.ts deleteChild / lib/sync.ts unshareChild) — zonder dit zou de server data
-- van dat kind voor altijd blijven staan, onbereikbaar voor wie het verwijderde,
-- terwijl een gekoppeld partnertoestel het nog wel probeert te blijven synchroniseren.
create or replace function unshare_sync_child(p_sync_id uuid)
returns void language sql security definer as $$
  delete from sync_events where sync_id = p_sync_id;
  delete from sync_day_ratings where sync_id = p_sync_id;
$$;

grant execute on function get_sync_events, upsert_sync_event, get_sync_day_ratings, upsert_sync_day_rating, unshare_sync_child to anon;

-- ----------------------------------------------------------------------------
-- Migratie 2026-09-26 (server-volgnummer). Staat ook los in
-- supabase/migration-2026-09-26-seq.sql — dat bestand is wat je plakt als de
-- tabellen hierboven al bestaan. Idempotent.
-- ----------------------------------------------------------------------------

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
