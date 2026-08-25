import { query, run } from './client';

export interface BlockEventInput {
  packageName: string;
  blockedAt: number;
  unlockAt: number;
  attemptCount: number;
}

export async function insertBlockEvents(events: BlockEventInput[]): Promise<void> {
  for (const e of events) {
    await run(
      `INSERT INTO block_events (package_name, blocked_at, unlock_at, attempt_count)
       VALUES (?, ?, ?, ?)`,
      [e.packageName, e.blockedAt, e.unlockAt, e.attemptCount]
    );
  }
}

export async function getBlockStats(days: number): Promise<{
  totalBlocks: number;
  totalAttempts: number;
  byApp: { packageName: string; blocks: number; attempts: number }[];
}> {
  const since = Date.now() - days * 86400000;

  const totals = await query<{ blocks: number; attempts: number }>(
    `SELECT COUNT(*) as blocks, COALESCE(SUM(attempt_count), 0) as attempts
       FROM block_events WHERE blocked_at >= ?`,
    [since]
  );

  const byApp = await query<{ packageName: string; blocks: number; attempts: number }>(
    `SELECT package_name as packageName,
            COUNT(*) as blocks,
            COALESCE(SUM(attempt_count), 0) as attempts
       FROM block_events
      WHERE blocked_at >= ?
      GROUP BY package_name
      ORDER BY blocks DESC`,
    [since]
  );

  return {
    totalBlocks: totals[0]?.blocks ?? 0,
    totalAttempts: totals[0]?.attempts ?? 0,
    byApp,
  };
}