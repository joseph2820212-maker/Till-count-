/**
 * migrations.ts — schema versioning (handoff §7 gate: "migrations idempotent").
 *
 *  - no version and no data   → fresh install: stamp the current version
 *  - no version but data      → pre-versioned v1 data: stamp v1 (no transform needed)
 *  - version == current       → nothing to do (running twice changes nothing)
 *  - version  < current       → run each step in order, stamping after each step
 *  - version  > current       → FutureSchemaError: fail closed, never overwrite data a
 *                               newer TillCount wrote
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS, SCHEMA_VERSION } from './keys';
import { runTransaction } from './kv';

export class FutureSchemaError extends Error {
  readonly found: number;
  constructor(found: number) {
    super(`This data was saved by a newer version of TillCount (schema ${found}). Update the app to open it.`);
    this.name = 'FutureSchemaError';
    this.found = found;
  }
}

/** Steps keyed by the version they upgrade FROM. v1 is the first schema, so none yet. */
export const MIGRATIONS: Record<number, () => Promise<void>> = {};

export async function readSchemaVersion(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(KEYS.schemaVersion);
  if (raw === null) return null;
  const n = Number(JSON.parse(raw));
  if (!Number.isInteger(n) || n < 1) throw new Error('Stored schema version is invalid.');
  return n;
}

export async function runMigrations(target = SCHEMA_VERSION): Promise<{ from: number | null; to: number }> {
  const from = await readSchemaVersion();
  if (from !== null && from > target) throw new FutureSchemaError(from);
  let v = from ?? 1;
  while (v < target) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error(`No migration from schema ${v}.`);
    await step();
    v += 1;
    await runTransaction([{ kind: 'doc', key: KEYS.schemaVersion, value: v }]);
  }
  if (from === null || from !== v) await runTransaction([{ kind: 'doc', key: KEYS.schemaVersion, value: v }]);
  return { from, to: v };
}
