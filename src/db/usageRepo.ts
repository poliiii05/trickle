import { query, run } from './client';

export interface DailyUsage {
  packageName: string;
  day: string;
  totalSeconds: number;
}

export function dayKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function upsertDaily(
  packageName: string,
  day: string,
  totalSeconds: number
): Promise<void> {
  await run(
    `INSERT INTO usage_daily (package_name, day, total_seconds)
     VALUES (?, ?, ?)
     ON CONFLICT(package_name, day) DO UPDATE SET
       total_seconds = MAX(usage_daily.total_seconds, excluded.total_seconds)`,
    [packageName, day, Math.round(totalSeconds)]
  );
}

export async function getDailyTotals(days: number): Promise<{ day: string; total: number }[]> {
  const rows = await query<{ day: string; total: number }>(
    `SELECT day, SUM(total_seconds) as total
       FROM usage_daily
      GROUP BY day
      ORDER BY day DESC
      LIMIT ?`,
    [days]
  );
  return rows.reverse();
}

export async function getTopApps(
  days: number
): Promise<{ packageName: string; total: number }[]> {
  const since = dayKey(Date.now() - days * 86400000);
  return query(
    `SELECT package_name as packageName, SUM(total_seconds) as total
       FROM usage_daily
      WHERE day >= ?
      GROUP BY package_name
      ORDER BY total DESC
      LIMIT 10`,
    [since]
  );
}

export async function exportUsageCsv(): Promise<string> {
  const rows = await query<{ day: string; package_name: string; total_seconds: number }>(
    'SELECT day, package_name, total_seconds FROM usage_daily ORDER BY day DESC'
  );
  const header = 'day,package_name,total_seconds\n';
  return header + rows.map(r => `${r.day},${r.package_name},${r.total_seconds}`).join('\n');
}