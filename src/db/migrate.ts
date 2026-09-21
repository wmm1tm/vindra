import type { SQLiteDatabase } from 'expo-sqlite';

import {
  CREATE_SCHEMA_V1,
  CREATE_SCHEMA_V2,
  CREATE_SCHEMA_V3,
  CREATE_SCHEMA_V4,
  CREATE_SCHEMA_V5,
  CREATE_SCHEMA_V6,
  CREATE_SCHEMA_V7,
  CREATE_SCHEMA_V8,
  CREATE_SCHEMA_V9,
  CREATE_SCHEMA_V10,
  CREATE_SCHEMA_V11,
  CREATE_SCHEMA_V12,
  CREATE_SCHEMA_V13,
  DATABASE_VERSION,
} from '@/db/schema';

async function ensureColumn(db: SQLiteDatabase, table: string, column: string, addColumnSql: string) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some((c) => c.name === column)) {
    await db.execAsync(addColumnSql);
  }
}

async function ensureTable(db: SQLiteDatabase, table: string, createSql: string) {
  const row = await db.getFirstAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    [table]
  );
  if (!row) {
    await db.execAsync(createSql);
  }
}

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = row?.user_version ?? 0;

  if (currentVersion < DATABASE_VERSION) {
    if (currentVersion === 0) {
      await db.execAsync(CREATE_SCHEMA_V1);
      currentVersion = 1;
    }

    if (currentVersion === 1) {
      await db.execAsync(CREATE_SCHEMA_V2);
      currentVersion = 2;
    }

    if (currentVersion === 2) {
      await db.execAsync(CREATE_SCHEMA_V3);
      currentVersion = 3;
    }

    if (currentVersion === 3) {
      await db.execAsync(CREATE_SCHEMA_V4);
      currentVersion = 4;
    }

    if (currentVersion === 4) {
      await db.execAsync(CREATE_SCHEMA_V5);
      currentVersion = 5;
    }

    if (currentVersion === 5) {
      await db.execAsync(CREATE_SCHEMA_V6);
      currentVersion = 6;
    }

    if (currentVersion === 6) {
      await db.execAsync(CREATE_SCHEMA_V7);
      currentVersion = 7;
    }

    if (currentVersion === 7) {
      await db.execAsync(CREATE_SCHEMA_V8);
      currentVersion = 8;
    }

    if (currentVersion === 8) {
      await db.execAsync(CREATE_SCHEMA_V9);
      currentVersion = 9;
    }

    if (currentVersion === 9) {
      await db.execAsync(CREATE_SCHEMA_V10);
      currentVersion = 10;
    }

    if (currentVersion === 10) {
      await db.execAsync(CREATE_SCHEMA_V11);
      currentVersion = 11;
    }

    if (currentVersion === 11) {
      await db.execAsync(CREATE_SCHEMA_V12);
      currentVersion = 12;
    }

    if (currentVersion === 12) {
      await db.execAsync(CREATE_SCHEMA_V13);
      currentVersion = 13;
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }

  // Safety net: some phones ended up with user_version ahead of the real table
  // structure (seen during development). This re-checks each column individually
  // instead of trusting the counter, and only adds what's actually missing.
  await ensureColumn(
    db,
    'child',
    'left_handed',
    'ALTER TABLE child ADD COLUMN left_handed INTEGER NOT NULL DEFAULT 0;'
  );
  await ensureColumn(
    db,
    'child',
    'day_start_hour',
    'ALTER TABLE child ADD COLUMN day_start_hour INTEGER NOT NULL DEFAULT 0;'
  );
  await ensureColumn(db, 'child', 'wheel_config', 'ALTER TABLE child ADD COLUMN wheel_config TEXT;');
  await ensureColumn(
    db,
    'child',
    'night_mode_auto',
    'ALTER TABLE child ADD COLUMN night_mode_auto INTEGER NOT NULL DEFAULT 0;'
  );
  await ensureColumn(db, 'child', 'language', `ALTER TABLE child ADD COLUMN language TEXT NOT NULL DEFAULT 'system';`);
  await ensureTable(db, 'app_state', `CREATE TABLE app_state (key TEXT PRIMARY KEY, value TEXT);`);
  await ensureColumn(db, 'child', 'sync_id', 'ALTER TABLE child ADD COLUMN sync_id TEXT;');
  await ensureColumn(db, 'child', 'sync_key', 'ALTER TABLE child ADD COLUMN sync_key TEXT;');
  await ensureColumn(
    db,
    'child',
    'sync_enabled',
    'ALTER TABLE child ADD COLUMN sync_enabled INTEGER NOT NULL DEFAULT 0;'
  );
  await ensureColumn(db, 'child', 'last_synced_at', 'ALTER TABLE child ADD COLUMN last_synced_at TEXT;');
  await ensureColumn(
    db,
    'child',
    'onboarding_name_dismissed',
    'ALTER TABLE child ADD COLUMN onboarding_name_dismissed INTEGER NOT NULL DEFAULT 0;'
  );
  await ensureColumn(db, 'event', 'antecedent', 'ALTER TABLE event ADD COLUMN antecedent TEXT;');
  await ensureColumn(db, 'event', 'location', 'ALTER TABLE event ADD COLUMN location TEXT;');
  await ensureColumn(db, 'event', 'what_helped', 'ALTER TABLE event ADD COLUMN what_helped TEXT;');
  await ensureColumn(db, 'event', 'sensory_threshold', 'ALTER TABLE event ADD COLUMN sensory_threshold TEXT;');
  await ensureColumn(db, 'event', 'sensory_response', 'ALTER TABLE event ADD COLUMN sensory_response TEXT;');
}
