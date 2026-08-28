import type { DailyPoint } from '../db/usageRepo';

export interface SeriesPoint {
  key: string;
  label: string;
  fullLabel: string;
  total: number;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** e.g. "Aug 28" */
function shortDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/**
 * Fills every day in the range so empty days keep their slot on the axis,
 * then buckets by day, week, or month depending on how wide the range is.
 */
export function buildSeries(rows: DailyPoint[], days: number): SeriesPoint[] {
  const byDay = new Map(rows.map(r => [r.day, r.total]));

  const filled: { date: Date; total: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    filled.push({ date: d, total: byDay.get(toKey(d)) ?? 0 });
  }

  // --- Daily buckets: up to a month ---
  if (days <= 31) {
    return filled.map(f => ({
      key: toKey(f.date),
      label: String(f.date.getDate()),
      fullLabel: shortDate(f.date),
      total: f.total,
    }));
  }

  // --- Weekly buckets: up to six months ---
  if (days <= 186) {
    const buckets: SeriesPoint[] = [];
    for (let i = 0; i < filled.length; i += 7) {
      const chunk = filled.slice(i, i + 7);
      const start = chunk[0].date;
      const end = chunk[chunk.length - 1].date;
      buckets.push({
        key: toKey(start),
        label: `${MONTHS[start.getMonth()]} ${start.getDate()}`,
        fullLabel: `${shortDate(start)} – ${shortDate(end)}`,
        total: chunk.reduce((sum, c) => sum + c.total, 0),
      });
    }
    return buckets;
  }

  // --- Monthly buckets: a year ---
  const months = new Map<string, { date: Date; total: number }>();
  for (const f of filled) {
    const key = `${f.date.getFullYear()}-${f.date.getMonth()}`;
    const existing = months.get(key);
    if (existing) {
      existing.total += f.total;
    } else {
      months.set(key, { date: f.date, total: f.total });
    }
  }

  return Array.from(months.entries()).map(([key, v]) => ({
    key,
    label: MONTHS[v.date.getMonth()],
    fullLabel: `${MONTHS[v.date.getMonth()]} ${v.date.getFullYear()}`,
    total: v.total,
  }));
}

/** Shows a label every Nth bar so they don't collide. */
export function labelStride(count: number): number {
  if (count <= 8) return 1;
  if (count <= 14) return 2;
  if (count <= 20) return 3;
  return Math.ceil(count / 7);
}

/** Human-readable span for the whole range, e.g. "May 28 – Aug 28". */
export function rangeCaption(days: number): string {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return `${shortDate(start)} – ${shortDate(end)}`;
}