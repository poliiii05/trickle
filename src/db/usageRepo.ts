import { query, run } from './client';

export interface DailyPoint {
  day: string;
  total: number;
}

export interface AppTotal {
  packageName: string;
  appLabel: string;
  total: number;
}

export interface UsageSummary {
  total: number;
  dailyAverage: number;
  peakDay: string | null;
  peakTotal: number;
  trackedDays: number;
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
  appLabel: string,
  day: string,
  totalSeconds: number,
): Promise<void> {
  await run(
    `INSERT INTO usage_daily (package_name, app_label, day, total_seconds)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(package_name, day) DO UPDATE SET
       app_label     = excluded.app_label,
       total_seconds = MAX(usage_daily.total_seconds, excluded.total_seconds)`,
    [packageName, appLabel, day, Math.round(totalSeconds)],
  );
}

export interface SeriesPoint {
  key: string;
  label: string;
  total: number;
}

export async function getDailyInRange(sinceKey: string): Promise<DailyPoint[]> {
  return query<DailyPoint>(
    `SELECT day, SUM(total_seconds) as total
       FROM usage_daily
      WHERE day >= ?
      GROUP BY day
      ORDER BY day ASC`,
    [sinceKey],
  );
}

export async function getTopApps(sinceKey: string, limit = 8): Promise<AppTotal[]> {
  return query<AppTotal>(
    `SELECT package_name as packageName,
            COALESCE(app_label, package_name) as appLabel,
            SUM(total_seconds) as total
       FROM usage_daily
      WHERE day >= ?
      GROUP BY package_name
      ORDER BY total DESC
      LIMIT ?`,
    [sinceKey, limit],
  );
}

export async function getUsageSummary(sinceKey: string): Promise<UsageSummary> {
  const totals = await query<{ total: number; trackedDays: number }>(
    `SELECT COALESCE(SUM(total_seconds), 0) as total,
            COUNT(DISTINCT day) as trackedDays
       FROM usage_daily
      WHERE day >= ?`,
    [sinceKey],
  );

  const peak = await query<{ day: string; total: number }>(
    `SELECT day, SUM(total_seconds) as total
       FROM usage_daily
      WHERE day >= ?
      GROUP BY day
      ORDER BY total DESC
      LIMIT 1`,
    [sinceKey],
  );

  const total = totals[0]?.total ?? 0;
  const trackedDays = totals[0]?.trackedDays ?? 0;

  return {
    total,
    dailyAverage: trackedDays > 0 ? total / trackedDays : 0,
    peakDay: peak[0]?.day ?? null,
    peakTotal: peak[0]?.total ?? 0,
    trackedDays,
  };
}

export async function exportUsageCsv(): Promise<string> {
  const rows = await query<{
    day: string;
    package_name: string;
    app_label: string | null;
    total_seconds: number;
  }>(
    `SELECT day, package_name, app_label, total_seconds
       FROM usage_daily ORDER BY day DESC, total_seconds DESC`,
  );

  const header = 'day,package_name,app_label,total_seconds\n';
  return (
    header +
    rows
      .map(r => {
        const label = (r.app_label ?? '').replace(/"/g, '""');
        return `${r.day},${r.package_name},"${label}",${r.total_seconds}`;
      })
      .join('\n')
  );
}