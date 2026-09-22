import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  getChildWithSettings,
  importChildRow,
  listChildren,
  type ChildWithSettings,
} from '@/db/child';
import { getAllDayRatings, setDayRating } from '@/db/day-log';
import { getAllEvents, importEventRow, type EventRow } from '@/db/events';
import type { Dictionary } from '@/lib/i18n/translations';
import { dateKey } from '@/lib/time';

const BACKUP_VERSION = 2;

interface BackupChild {
  child: ChildWithSettings;
  events: EventRow[];
  dayRatings: { date: string; rating: number | null }[];
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  children: BackupChild[];
}

const CSV_COLUMNS: (keyof EventRow)[] = [
  'id',
  'kind',
  'start_at',
  'end_at',
  'amount_ml',
  'side',
  'variant',
  'note',
  'temperature_c',
  'created_at',
  'updated_at',
];

function csvEscape(value: string | number | null): string {
  const str = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function buildEventsCsv(events: EventRow[]): string {
  const header = CSV_COLUMNS.join(',');
  const rows = events.map((event) => CSV_COLUMNS.map((column) => csvEscape(event[column])).join(','));
  return [header, ...rows].join('\n');
}

async function shareTextFile(filename: string, content: string, mimeType: string) {
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(content);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: filename });
  }
}

/** CSV blijft bewust beperkt tot het kind dat je nu bekijkt — een plat spreadsheet-
 * bestand met meerdere kinderen door elkaar is minder bruikbaar dan per kind exporteren. */
export async function exportEventsCsv(db: SQLiteDatabase, childId: string): Promise<void> {
  const events = await getAllEvents(db, childId);
  const csv = buildEventsCsv(events);
  await shareTextFile(`vindra-events-${dateKey(new Date())}.csv`, csv, 'text/csv');
}

/** JSON is de volledige back-up: alle kinderen (ook gearchiveerde), inclusief hun eigen
 * instellingen, events en dagcijfers — dit is ook het bestand dat je weer importeert. */
export async function exportBackupJson(db: SQLiteDatabase): Promise<void> {
  const children = await listChildren(db, true);
  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    children: await Promise.all(
      children.map(async (child) => {
        const [full, events, dayRatings] = await Promise.all([
          getChildWithSettings(db, child.id),
          getAllEvents(db, child.id),
          getAllDayRatings(db, child.id),
        ]);
        return { child: full!, events, dayRatings };
      })
    ),
  };
  await shareTextFile(
    `vindra-backup-${dateKey(new Date())}.json`,
    JSON.stringify(payload, null, 2),
    'application/json'
  );
}

export interface ImportResult {
  childCount: number;
  eventCount: number;
  ratingCount: number;
}

/** Ondersteunt ook back-ups van vóór "meerdere kinderen" (versie 1: één plat
 * child/events/dayRatings-object) door ze hier om te zetten naar de huidige vorm. */
function normalizePayload(raw: unknown): BackupChild[] {
  const payload = raw as Partial<BackupPayload> & {
    child?: ChildWithSettings;
    events?: EventRow[];
    dayRatings?: { date: string; rating: number | null }[];
  };

  if (Array.isArray(payload.children)) return payload.children;
  if (payload.child && Array.isArray(payload.events)) {
    // Een echte versie-1-back-up dateert van vóór instellingen als taal/dagstart/wiel-
    // volgorde bestonden — zonder deze standaardwaarden zou importChildRow() `undefined`
    // proberen te binden voor die kolommen, wat SQLite afwijst en de hele import (alle
    // kinderen in het bestand, niet alleen deze) laat mislukken.
    const legacyChild: ChildWithSettings = {
      id: payload.child.id,
      name: payload.child.name,
      birthDate: payload.child.birthDate,
      isActive: payload.child.isActive ?? true,
      timeFormat: payload.child.timeFormat ?? '24h',
      tempUnit: payload.child.tempUnit ?? 'celsius',
      volumeUnit: payload.child.volumeUnit ?? 'ml',
      leftHanded: payload.child.leftHanded ?? false,
      dayStartHour: payload.child.dayStartHour ?? 0,
      wheelConfig: payload.child.wheelConfig ?? null,
      nightModeAuto: payload.child.nightModeAuto ?? false,
      language: payload.child.language ?? 'system',
      onboardingNameDismissed: payload.child.onboardingNameDismissed ?? false,
    };
    return [{ child: legacyChild, events: payload.events, dayRatings: payload.dayRatings ?? [] }];
  }
  throw new Error('missing-data');
}

export async function importBackupFromUri(db: SQLiteDatabase, uri: string, t: Dictionary): Promise<ImportResult> {
  const file = new File(uri);
  const text = await file.text();

  let children: BackupChild[];
  try {
    const parsed = JSON.parse(text);
    children = normalizePayload(parsed);
  } catch (error) {
    if (error instanceof Error && error.message === 'missing-data') {
      throw new Error(t.settings.importMissingData);
    }
    throw new Error(t.settings.importInvalidFile);
  }

  let eventCount = 0;
  let ratingCount = 0;

  await db.withTransactionAsync(async () => {
    for (const entry of children) {
      await importChildRow(db, entry.child);
      for (const event of entry.events) {
        await importEventRow(db, entry.child.id, event);
        eventCount += 1;
      }
      for (const rating of entry.dayRatings) {
        if (rating.rating !== null && rating.rating !== undefined) {
          await setDayRating(db, entry.child.id, rating.date, rating.rating);
          ratingCount += 1;
        }
      }
    }
  });

  return { childCount: children.length, eventCount, ratingCount };
}
