export const DATABASE_NAME = 'babytracker.db';

export const DATABASE_VERSION = 15;

export const CREATE_SCHEMA_V1 = `
CREATE TABLE child (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  birth_date  TEXT NOT NULL,
  bottle_ml   INTEGER,
  is_active   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE event (
  id                TEXT PRIMARY KEY,
  child_id          TEXT NOT NULL REFERENCES child(id),
  kind              TEXT NOT NULL,
  start_at          TEXT NOT NULL,
  end_at            TEXT,
  portion           REAL,
  amount_ml         INTEGER,
  amount_estimated  INTEGER NOT NULL DEFAULT 0,
  side              TEXT,
  variant           TEXT,
  note              TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  deleted_at        TEXT
);

CREATE INDEX idx_event_day ON event (child_id, start_at) WHERE deleted_at IS NULL;
`;

export const CREATE_SCHEMA_V2 = `
CREATE TABLE day_log (
  child_id    TEXT NOT NULL REFERENCES child(id),
  date        TEXT NOT NULL,
  rating      INTEGER,
  updated_at  TEXT NOT NULL,
  PRIMARY KEY (child_id, date)
);
`;

export const CREATE_SCHEMA_V3 = `
ALTER TABLE event ADD COLUMN temperature_c REAL;
`;

export const CREATE_SCHEMA_V4 = `
ALTER TABLE child ADD COLUMN time_format TEXT NOT NULL DEFAULT '24h';
ALTER TABLE child ADD COLUMN temp_unit TEXT NOT NULL DEFAULT 'celsius';
ALTER TABLE child ADD COLUMN volume_unit TEXT NOT NULL DEFAULT 'ml';
`;

export const CREATE_SCHEMA_V5 = `
ALTER TABLE event ADD COLUMN offered_ml INTEGER;
`;

export const CREATE_SCHEMA_V6 = `
ALTER TABLE child ADD COLUMN left_handed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE child ADD COLUMN day_start_hour INTEGER NOT NULL DEFAULT 0;
ALTER TABLE child ADD COLUMN wheel_config TEXT;
ALTER TABLE child ADD COLUMN night_mode_auto INTEGER NOT NULL DEFAULT 0;
`;

export const CREATE_SCHEMA_V7 = `
ALTER TABLE child ADD COLUMN language TEXT NOT NULL DEFAULT 'system';
`;

/** Los device-lokaal sleutel/waarde-tabelletje (bv. "welk kind is nu geselecteerd op dit
 * toestel") — hoort niet bij een kind en gaat dus ook niet mee in een export/import. */
export const CREATE_SCHEMA_V8 = `
CREATE TABLE app_state (
  key   TEXT PRIMARY KEY,
  value TEXT
);
`;

/** Partner-sync: sync_id is de niet-geheime routeringscode, sync_key de geheime
 * versleutelingssleutel (verlaat dit toestel nooit via de server). Beide null = niet
 * gedeeld. last_synced_at is het watermark voor incrementeel ophalen. */
export const CREATE_SCHEMA_V9 = `
ALTER TABLE child ADD COLUMN sync_id TEXT;
ALTER TABLE child ADD COLUMN sync_key TEXT;
ALTER TABLE child ADD COLUMN sync_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE child ADD COLUMN last_synced_at TEXT;
`;

/** Fles-voeding trackt alleen nog de werkelijk gedronken hoeveelheid — het aparte
 * "aangeboden"/geschat-concept (en de flesmaat-voorkeur die het prefillede) is
 * geschrapt, dus de kolommen die het droegen gaan er ook uit. */
export const CREATE_SCHEMA_V10 = `
ALTER TABLE event DROP COLUMN offered_ml;
ALTER TABLE event DROP COLUMN amount_estimated;
ALTER TABLE child DROP COLUMN bottle_ml;
`;

/** Tracks whether the "vul de naam/geboortedatum in"-banner on the timeline has been
 * dismissed for this child — shown while the child still has the auto-generated
 * placeholder name (see DEFAULT_CHILD_NAME in db/child.ts), so a fresh install can start
 * logging with zero setup while still nudging toward a real name later. */
export const CREATE_SCHEMA_V11 = `
ALTER TABLE child ADD COLUMN onboarding_name_dismissed INTEGER NOT NULL DEFAULT 0;
`;

/** Vindra-specifiek (2026-09-21, op basis van onderzoek naar wat andere apps/
 * begeleiders van deze doelgroep loggen): een "Gedrag"-event met alleen ernst + vrije
 * notitie kan niet beantwoorden waar ouders een behandelaar eigenlijk mee benaderen
 * ("wat triggert dit, en wat hielp?") — de klassieke ABC-methodiek (antecedent-gedrag-
 * gevolg) voegt drie korte, losse velden toe. Bewust NIET in het snel-log-wiel zelf
 * (moet binnen 30 seconden blijven werken tijdens een moeilijk moment) — worden achteraf
 * ingevuld via het bewerkscherm, zie components/timeline/event-detail-sheet.tsx. */
export const CREATE_SCHEMA_V12 = `
ALTER TABLE event ADD COLUMN antecedent TEXT;
ALTER TABLE event ADD COLUMN location TEXT;
ALTER TABLE event ADD COLUMN what_helped TEXT;
`;

/** Vindra-specifiek (2026-09-21, zelfde onderzoek als V12): optionele uitbreiding van
 * "Prikkel" met Dunn's Sensory Profile-model — twee onafhankelijke assen, niet één
 * veld: hoe snel/veel prikkel nodig was vóór het opviel (`sensory_threshold`:
 * 'laag'/'hoog'), en of de reactie erop actief opzoekend of vermijdend was
 * (`sensory_response`: 'opzoekend'/'vermijdend'). Zelfde reden als V12 om dit niet in
 * het snel-log-wiel te zetten: bewust optioneel, achteraf in te vullen via
 * event-detail-sheet.tsx, alleen zinvol bij kind = 'prikkel'. */
export const CREATE_SCHEMA_V13 = `
ALTER TABLE event ADD COLUMN sensory_threshold TEXT;
ALTER TABLE event ADD COLUMN sensory_response TEXT;
`;

/** Partner-sync v2 (2026-09-26):
 * - `pushed_updated_at`: de updated_at die het laatst naar de server ging. Een rij is
 *   "dirty" (nog te pushen) zolang die leeg is of afwijkt van updated_at — elke lokale
 *   wijziging zet een nieuwe updated_at en maakt de rij dus vanzelf dirty, ook een
 *   verwijdering (deleted_at). Bestaande rijen starten leeg: één keer alles opnieuw pushen.
 * - `sync_seq_events`/`sync_seq_ratings`: watermark = hoogste server-volgnummer (seq) dat
 *   dit toestel al binnenhaalde. Start op 0: één keer alles opnieuw ophalen, wat veilig is
 *   omdat toepassen laatste-schrijver-wint is. last_synced_at (oude watermark) blijft alleen
 *   voor de terugval zolang de server de v2-functies nog niet heeft. */
export const CREATE_SCHEMA_V14 = `
ALTER TABLE event ADD COLUMN pushed_updated_at TEXT;
ALTER TABLE day_log ADD COLUMN pushed_updated_at TEXT;
ALTER TABLE child ADD COLUMN sync_seq_events INTEGER NOT NULL DEFAULT 0;
ALTER TABLE child ADD COLUMN sync_seq_ratings INTEGER NOT NULL DEFAULT 0;
`;
