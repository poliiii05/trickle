import type { DailyPoint } from '../db/usageRepo';

export type RangeId = '1w' | '1m' | '3m' | '6m' | '1y';

export interface RangeOption {
  id: RangeId;
  label: string;
}

export const RANGE_OPTIONS: RangeOption[] = [
  { id: '1w', label: '1 week' },
  { id: '1m', label: '1 month' },
  { id: '3m', label: '3 months' },
  { id: '6m', label: '6 months' },
  { id: '1y', label: '1 year' },
];

export interface SeriesPoint {
  key: string;
  label: string;
  total: number;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dayKeyOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function shortDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** First day the range covers. Month ranges snap to calendar month starts. */
export function rangeStart(id: RangeId): Date {
  const today = startOfDay();

  switch (id) {
    case '1w': {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return d;
    }
    case '1m': {
      const d = new Date(today);
      d.setDate(d.getDate() - 27); // exactly four weeks
      return d;
    }
    case '3m':
      return new Date(today.getFullYear(), today.getMonth() - 2, 1);
    case '6m':
      return new Date(today.getFullYear(), today.getMonth() - 5, 1);
    case '1y':
      return new Date(today.getFullYear(), today.getMonth() - 11, 1);
  }
}

export function rangeSinceKey(id: RangeId): string {
  return dayKeyOf(rangeStart(id));
}

/** "May 1 – Aug 28" */
export function rangeCaption(id: RangeId): string {
  return `${shortDate(rangeStart(id))} – ${shortDate(startOfDay())}`;
}
export function bucketNoun(id: RangeId): string {
  if (id === '1w') return 'per day';
  if (id === '1m') return 'per week';
  if (id === '1y') return 'per quarter';
  return 'per month';
}

/**
 * Buckets daily rows into a small, always-labelable series.
 * Empty periods keep their slot so gaps stay visible.
 */
export function buildSeries(rows: DailyPoint[], id: RangeId): SeriesPoint[] {
  const byDay = new Map(rows.map(r => [r.day, r.total]));
  const today = startOfDay();
  const start = rangeStart(id);

  // --- Daily: one bar per day ---
  if (id === '1w') {
    const out: SeriesPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      out.push({
        key: dayKeyOf(d),
        label: WEEKDAYS[d.getDay()],
        total: byDay.get(dayKeyOf(d)) ?? 0,
      });
    }
    return out;
  }

   // --- Weekly: four bars, the last one ending today ---
  if (id === '1m') {
    const out: SeriesPoint[] = [];
    for (let w = 0; w < 4; w++) {
      const chunkStart = new Date(start);
      chunkStart.setDate(chunkStart.getDate() + w * 7);

      let total = 0;
      for (let d = 0; d < 7; d++) {
        const day = new Date(chunkStart);
        day.setDate(day.getDate() + d);
        total += byDay.get(dayKeyOf(day)) ?? 0;
      }

      out.push({
        key: dayKeyOf(chunkStart),
        label: w === 3 ? 'This wk' : `Wk ${w + 1}`,
        total,
      });
    }
    return out;
  }

    // --- Quarterly: a year in four readable bars ---
  if (id === '1y') {
    const out: SeriesPoint[] = [];
    for (let q = 3; q >= 0; q--) {
      const qStart = new Date(today.getFullYear(), today.getMonth() - (q * 3 + 2), 1);
      const qEnd = new Date(today.getFullYear(), today.getMonth() - q * 3 + 1, 1);

      let total = 0;
      const cursor = new Date(qStart);
      while (cursor < qEnd && cursor <= today) {
        total += byDay.get(dayKeyOf(cursor)) ?? 0;
        cursor.setDate(cursor.getDate() + 1);
      }

      const lastMonth = new Date(today.getFullYear(), today.getMonth() - q * 3, 1);
      out.push({
        key: `${qStart.getFullYear()}-q${q}`,
        label: `${MONTHS[qStart.getMonth()]}–${MONTHS[lastMonth.getMonth()]}`,
        total,
      });
    }
    return out;
  }

  // --- Monthly: 3m and 6m ---
  const count = id === '3m' ? 3 : 6;
  const out: SeriesPoint[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);

    let total = 0;
    const cursor = new Date(monthStart);
    while (cursor < nextMonth && cursor <= today) {
      total += byDay.get(dayKeyOf(cursor)) ?? 0;
      cursor.setDate(cursor.getDate() + 1);
    }

    out.push({
      key: `${monthStart.getFullYear()}-${monthStart.getMonth()}`,
      label: MONTHS[monthStart.getMonth()],
      total,
    });
  }

  return out;
}