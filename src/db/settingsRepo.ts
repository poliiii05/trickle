import { query, run } from './client';

export async function getSetting(key: string): Promise<string | null> {
  const rows = await query<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key],
  );
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await run(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

export async function getFlag(key: string): Promise<boolean> {
  return (await getSetting(key)) === 'true';
}

export async function setFlag(key: string, value: boolean): Promise<void> {
  await setSetting(key, value ? 'true' : 'false');
}