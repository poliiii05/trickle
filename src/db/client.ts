import { open, type DB } from '@op-engineering/op-sqlite';

let db: DB | null = null;

export function getDb(): DB {
  if (!db) {
    db = open({ name: 'trickle.db' });
  }
  return db;
}

/**
 * Nag-iiba ang result shape ng op-sqlite sa bawat version.
 * Isang lugar lang ang inaayos natin kaysa sa buong codebase.
 */
export function toRows<T>(result: any): T[] {
  if (!result) return [];
  if (Array.isArray(result.rows)) return result.rows as T[];
  if (result.rows?._array) return result.rows._array as T[];
  return [];
}

export async function query<T>(sql: string, params: any[] = []): Promise<T[]> {
  const res = await getDb().execute(sql, params);
  return toRows<T>(res);
}

export async function run(sql: string, params: any[] = []): Promise<void> {
  await getDb().execute(sql, params);
}