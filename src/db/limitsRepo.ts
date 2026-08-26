import { query, run } from './client';

export interface AppLimitRow {
  id: number;
  package_name: string;
  app_label: string;
  allowance_seconds: number;
  lock_seconds: number;
  remaining_seconds: number;
  locked_until: number | null;
  is_active: number;
  created_at: number;
  updated_at: number;
  last_active_at: number | null; 
}

export interface AppLimit {
  id: number;
  packageName: string;
  appLabel: string;
  allowanceSeconds: number;
  lockSeconds: number;
  remainingSeconds: number;
  lockedUntil: number | null;
  isActive: boolean;
  lastActiveAt: number | null; 
}

function fromRow(r: AppLimitRow): AppLimit {
  return {
    id: r.id,
    packageName: r.package_name,
    appLabel: r.app_label,
    allowanceSeconds: r.allowance_seconds,
    lockSeconds: r.lock_seconds,
    remainingSeconds: r.remaining_seconds,
    lockedUntil: r.locked_until,
    isActive: r.is_active === 1,
    lastActiveAt: r.last_active_at,
  };
}

export async function getAllLimits(): Promise<AppLimit[]> {
  const rows = await query<AppLimitRow>(
    'SELECT * FROM app_limits ORDER BY app_label COLLATE NOCASE'
  );
  return rows.map(fromRow);
}

export async function getLimit(packageName: string): Promise<AppLimit | null> {
  const rows = await query<AppLimitRow>(
    'SELECT * FROM app_limits WHERE package_name = ?',
    [packageName]
  );
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function upsertLimit(input: {
  packageName: string;
  appLabel: string;
  allowanceSeconds: number;
  lockSeconds: number;
}): Promise<void> {
  const now = Date.now();
  await run(
    `INSERT INTO app_limits
       (package_name, app_label, allowance_seconds, lock_seconds,
        remaining_seconds, locked_until, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NULL, 1, ?, ?)
     ON CONFLICT(package_name) DO UPDATE SET
       app_label         = excluded.app_label,
       allowance_seconds = excluded.allowance_seconds,
       lock_seconds      = excluded.lock_seconds,
       remaining_seconds = excluded.allowance_seconds,
       updated_at        = excluded.updated_at`,
    [
      input.packageName,
      input.appLabel,
      input.allowanceSeconds,
      input.lockSeconds,
      input.allowanceSeconds,
      now,
      now,
    ]
  );
}

export async function setActive(packageName: string, active: boolean): Promise<void> {
  const now = Date.now();
  if (active) {
    await run(
      'UPDATE app_limits SET is_active = 1, updated_at = ? WHERE package_name = ?',
      [now, packageName],
    );
  } else {
    await run(
      'UPDATE app_limits SET is_active = 0, last_active_at = ?, updated_at = ? WHERE package_name = ?',
      [now, now, packageName],
    );
  }
}

export async function deleteLimit(packageName: string): Promise<void> {
  await run('DELETE FROM app_limits WHERE package_name = ?', [packageName]);
}

/** Naka-lock ba ngayon? Frozen ang settings kapag oo. */
export function isLocked(limit: AppLimit): boolean {
  return limit.lockedUntil !== null && limit.lockedUntil > Date.now();
}