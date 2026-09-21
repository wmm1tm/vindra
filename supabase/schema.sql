-- BabyTracker partner-sync schema.
-- Eenmalig plakken in het Supabase SQL Editor van het project uit app.json
-- (expo.extra.supabaseUrl). Zie lib/sync.ts en lib/crypto.ts voor hoe de app
-- dit gebruikt, en het gesprek van 2026-09-03 voor het volledige ontwerp
-- (versleuteld, geen accounts, geen directe tabeltoegang — alleen via de
-- onderstaande RPC-functies die een sync_id verplicht stellen).

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
