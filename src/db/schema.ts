import { getDb, query, run } from './client';

/** Adds a column only if it isn't already there — safe to run repeatedly. */
async function ensureColumn(
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  const cols = await query<{ name: string }>(`PRAGMA table_info(${table})`);
  if (cols.some(c => c.name === column)) return;
  await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

const TARGET_VERSION = 3;

const MIGRATION_1 = `
CREATE TABLE IF NOT EXISTS app_limits (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  package_name      TEXT    NOT NULL UNIQUE,
  app_label         TEXT    NOT NULL,
  allowance_seconds INTEGER NOT NULL CHECK (allowance_seconds > 0),
  lock_seconds      INTEGER NOT NULL CHECK (lock_seconds > 0),
  remaining_seconds INTEGER NOT NULL,
  locked_until      INTEGER,
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_limits_active
  ON app_limits(is_active, package_name);

CREATE TABLE IF NOT EXISTS usage_daily (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  package_name  TEXT    NOT NULL,
  day           TEXT    NOT NULL,
  total_seconds INTEGER NOT NULL DEFAULT 0,
  open_count    INTEGER NOT NULL DEFAULT 0,
  UNIQUE(package_name, day)
);

CREATE INDEX IF NOT EXISTS idx_usage_day ON usage_daily(day);

CREATE TABLE IF NOT EXISTS block_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  package_name  TEXT    NOT NULL,
  blocked_at    INTEGER NOT NULL,
  unlock_at     INTEGER NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_block_time ON block_events(blocked_at);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export async function initDatabase(): Promise<void> {
  const rows = await query<{ user_version: number }>('PRAGMA user_version');
  const current = rows[0]?.user_version ?? 0;

  if (current < 1) {
    await getDb().execute(MIGRATION_1);
  }

  // Idempotent — these run every launch but only act when the column is missing.
  await ensureColumn('app_limits', 'last_active_at', 'INTEGER');
  await ensureColumn('usage_daily', 'app_label', 'TEXT');

  if (current < TARGET_VERSION) {
    await run(`PRAGMA user_version = ${TARGET_VERSION}`);
  }
}