import Apps from '../native/Apps';
import Tracking from '../native/Tracking';
import { upsertDaily, dayKey } from '../db/usageRepo';
import { insertBlockEvents } from '../db/blockRepo';
import { startOfToday, daysAgo } from '../utils/time';

/** Kinukuha ang usage ng bawat araw at isinasave sa SQLite. */
export async function snapshotUsage(backfillDays = 0): Promise<void> {
  try {
    // Ngayong araw
    const today = await Apps.getUsageStats(startOfToday(), Date.now());
    const key = dayKey(Date.now());
    for (const s of today) {
      await upsertDaily(s.packageName, key, s.totalSeconds);
    }

    // Backfill — unang buksan lang
    for (let i = 1; i <= backfillDays; i++) {
      const start = daysAgo(i);
      const end = daysAgo(i - 1);
      const stats = await Apps.getUsageStats(start, end);
      const day = dayKey(start);
      for (const s of stats) {
        await upsertDaily(s.packageName, day, s.totalSeconds);
      }
    }
  } catch (e) {
    console.warn('Nabigo ang snapshot', e);
  }
}

export async function drainBlockEvents(): Promise<void> {
  try {
    const json = await Tracking.drainBlockEvents();
    const raw = JSON.parse(json) as any[];
    if (!raw.length) return;

    await insertBlockEvents(
      raw.map(r => ({
        packageName: r.packageName,
        blockedAt: r.blockedAt,
        unlockAt: r.unlockAt,
        attemptCount: r.attemptCount ?? 0,
      }))
    );
  } catch (e) {
    console.warn('Nabigo ang drain', e);
  }
}

export async function runSync(firstRun = false): Promise<void> {
  await snapshotUsage(firstRun ? 6 : 0);
  await drainBlockEvents();
}