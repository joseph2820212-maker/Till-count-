/**
 * kv.ts — crash-safe storage core (handoff §7 "related writes must be crash-safe").
 *
 * Two value kinds live in AsyncStorage:
 *  - documents   : one small JSON value at its key (settings, snapshots, schema version)
 *  - collections : an array split into chunks. The logical key holds a manifest
 *                  { m:1, gen, chunks, count }; chunks live at `${key}:g${gen}:c${i}`.
 *                  Chunking keeps every stored value well below Android's 2 MB
 *                  CursorWindow limit, whatever the catalogue size.
 *
 * Every write goes through runTransaction(), which writes new chunks under a NEW
 * generation first (unreferenced, harmless), journals the previous manifest/document
 * values, flips all logical keys in one multiSet, marks the journal committed and only
 * then deletes the old chunks. recoverInterruptedTransaction() (app start) rolls a
 * prepared journal back and finishes a committed one, so related records are always
 * wholly old or wholly new — never mixed.
 *
 * Reads fail CLOSED: an unreadable manifest / chunk / record throws
 * StorageCorruptionError (the raw value is preserved under `:corrupt:`); nothing is
 * ever silently treated as empty and then overwritten.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { withStorageKeyLock } from '../utils/storageSafety';
import { newId } from '../domain/ids';

export const TX_JOURNAL_KEY = 'tillcount:txJournal';
const TX_LOCK = 'tillcount:tx';
/** Target serialized size per chunk (characters). */
export const CHUNK_TARGET_CHARS = 400_000;

export class StorageCorruptionError extends Error {
  readonly key: string;
  constructor(key: string, detail: string) {
    super(`Stored data at ${key} could not be read (${detail}).`);
    this.name = 'StorageCorruptionError';
    this.key = key;
  }
}

interface Manifest { m: 1; gen: string; chunks: number; count: number }

export function chunkKey(key: string, gen: string, i: number): string {
  return `${key}:g${gen}:c${i}`;
}

function isManifest(v: unknown): v is Manifest {
  const o = v as Manifest;
  return !!o && o.m === 1 && typeof o.gen === 'string' && /^[a-z0-9_]+$/i.test(o.gen)
    && Number.isInteger(o.chunks) && o.chunks >= 0 && o.chunks < 100_000
    && Number.isInteger(o.count) && o.count >= 0;
}

/** Split items into JSON chunks of roughly CHUNK_TARGET_CHARS each. */
export function chunkItems(items: readonly unknown[], target = CHUNK_TARGET_CHARS): string[] {
  const chunks: string[] = [];
  let current: string[] = [];
  let size = 2;
  for (const it of items) {
    const s = JSON.stringify(it);
    if (current.length && size + s.length + 1 > target) {
      chunks.push(`[${current.join(',')}]`);
      current = []; size = 2;
    }
    current.push(s); size += s.length + 1;
  }
  if (current.length) chunks.push(`[${current.join(',')}]`);
  return chunks;
}

async function preserveCorrupt(key: string, raw: string | null): Promise<void> {
  if (raw === null) return;
  try { await AsyncStorage.setItem(`${key}:corrupt:${Date.now()}`, raw); } catch { /* best effort */ }
}

/** Read a document. Absent → fallback. Unparsable / invalid → StorageCorruptionError. */
export async function readDoc<T>(key: string, validate: (v: unknown) => v is T, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return fallback;
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { await preserveCorrupt(key, raw); throw new StorageCorruptionError(key, 'invalid JSON'); }
  if (!validate(parsed)) { await preserveCorrupt(key, raw); throw new StorageCorruptionError(key, 'invalid shape'); }
  return parsed;
}

/**
 * Read a collection from any key/value source (live storage or a decrypted backup map).
 * Throws StorageCorruptionError on a bad manifest, a missing chunk or an invalid record.
 */
export async function readCollectionFrom<T>(
  get: (keys: string[]) => Promise<(string | null)[]>,
  key: string,
  validate: (v: unknown) => v is T,
): Promise<T[]> {
  const [rawManifest] = await get([key]);
  if (rawManifest === null || rawManifest === undefined) return [];
  let manifest: unknown;
  try { manifest = JSON.parse(rawManifest); } catch { throw new StorageCorruptionError(key, 'invalid manifest JSON'); }
  if (!isManifest(manifest)) throw new StorageCorruptionError(key, 'invalid manifest');
  if (manifest.chunks === 0) {
    if (manifest.count !== 0) throw new StorageCorruptionError(key, 'count mismatch');
    return [];
  }
  const keys = Array.from({ length: manifest.chunks }, (_, i) => chunkKey(key, manifest.gen, i));
  const raws = await get(keys);
  const out: T[] = [];
  for (let i = 0; i < raws.length; i++) {
    const raw = raws[i];
    if (raw === null || raw === undefined) throw new StorageCorruptionError(keys[i], 'missing chunk');
    let arr: unknown;
    try { arr = JSON.parse(raw); } catch { throw new StorageCorruptionError(keys[i], 'invalid chunk JSON'); }
    if (!Array.isArray(arr)) throw new StorageCorruptionError(keys[i], 'chunk is not a list');
    for (const item of arr) {
      if (!validate(item)) throw new StorageCorruptionError(keys[i], 'invalid record');
      out.push(item);
    }
  }
  if (out.length !== manifest.count) throw new StorageCorruptionError(key, 'count mismatch');
  return out;
}

export async function readCollection<T>(key: string, validate: (v: unknown) => v is T): Promise<T[]> {
  try {
    return await readCollectionFrom(async keys => (await AsyncStorage.multiGet(keys)).map(p => p[1]), key, validate);
  } catch (e) {
    if (e instanceof StorageCorruptionError) await preserveCorrupt(e.key, await AsyncStorage.getItem(e.key).catch(() => null));
    throw e;
  }
}

/** All chunk keys a manifest value points at (empty when absent / unparsable). */
export function chunkKeysOf(key: string, rawManifest: string | null): string[] {
  if (!rawManifest) return [];
  try {
    const m = JSON.parse(rawManifest);
    if (!isManifest(m)) return [];
    return Array.from({ length: m.chunks }, (_, i) => chunkKey(key, m.gen, i));
  } catch { return []; }
}

export type TxOp =
  | { kind: 'collection'; key: string; items: readonly unknown[] }
  | { kind: 'doc'; key: string; value: unknown }
  | { kind: 'delete'; key: string }
  | { kind: 'deleteCollection'; key: string };

interface TxJournal {
  v: 1;
  state: 'prepared' | 'committed';
  before: [string, string | null][];
  newChunkKeys: string[];
  oldChunkKeys: string[];
}

function isJournal(v: unknown): v is TxJournal {
  const j = v as TxJournal;
  return !!j && j.v === 1 && (j.state === 'prepared' || j.state === 'committed')
    && Array.isArray(j.before) && Array.isArray(j.newChunkKeys) && Array.isArray(j.oldChunkKeys);
}

/** Test hook: throw at a named step to simulate a crash / storage failure mid-transaction. */
let failAt: null | 'afterChunks' | 'afterJournal' | 'afterFlip' | 'afterCommit' = null;
export function __setTxFailurePoint(p: typeof failAt): void { failAt = p; }
function maybeFail(p: NonNullable<typeof failAt>): void {
  if (failAt === p) { failAt = null; throw new Error(`simulated failure ${p}`); }
}

async function rollBack(j: TxJournal): Promise<void> {
  const toSet = j.before.filter((p): p is [string, string] => p[1] !== null);
  const toRemove = j.before.filter(p => p[1] === null).map(p => p[0]);
  if (toSet.length) await AsyncStorage.multiSet(toSet);
  if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
  if (j.newChunkKeys.length) await AsyncStorage.multiRemove(j.newChunkKeys);
}

async function recoverInner(): Promise<'none' | 'rolledBack' | 'completed'> {
  const raw = await AsyncStorage.getItem(TX_JOURNAL_KEY);
  if (!raw) return 'none';
  let j: unknown;
  try { j = JSON.parse(raw); } catch { j = null; }
  if (!isJournal(j)) { await AsyncStorage.removeItem(TX_JOURNAL_KEY); return 'none'; }
  if (j.state === 'committed') {
    if (j.oldChunkKeys.length) await AsyncStorage.multiRemove(j.oldChunkKeys);
    await AsyncStorage.removeItem(TX_JOURNAL_KEY);
    return 'completed';
  }
  await rollBack(j);
  await AsyncStorage.removeItem(TX_JOURNAL_KEY);
  return 'rolledBack';
}

/** App start: finish or roll back a transaction interrupted by a crash / process death. */
export function recoverInterruptedTransaction(): Promise<'none' | 'rolledBack' | 'completed'> {
  return withStorageKeyLock(TX_LOCK, recoverInner);
}

/** Apply every op atomically (see file header). */
export function runTransaction(ops: readonly TxOp[]): Promise<void> {
  return withStorageKeyLock(TX_LOCK, async () => {
    await recoverInner();
    const logical = [...new Set(ops.map(o => o.key))];
    const beforePairs = await AsyncStorage.multiGet(logical) as [string, string | null][];
    const before = new Map(beforePairs);
    const newChunkPairs: [string, string][] = [];
    const flipSet: [string, string][] = [];
    const flipRemove: string[] = [];
    const oldChunkKeys: string[] = [];

    for (const op of ops) {
      if (op.kind === 'collection' || op.kind === 'deleteCollection') oldChunkKeys.push(...chunkKeysOf(op.key, before.get(op.key) ?? null));
      if (op.kind === 'collection') {
        const gen = newId('g').slice(2);
        const chunks = chunkItems(op.items);
        chunks.forEach((c, i) => newChunkPairs.push([chunkKey(op.key, gen, i), c]));
        flipSet.push([op.key, JSON.stringify({ m: 1, gen, chunks: chunks.length, count: op.items.length } satisfies Manifest)]);
      } else if (op.kind === 'doc') {
        flipSet.push([op.key, JSON.stringify(op.value)]);
      } else {
        flipRemove.push(op.key);
      }
    }

    const journal: TxJournal = { v: 1, state: 'prepared', before: beforePairs, newChunkKeys: newChunkPairs.map(p => p[0]), oldChunkKeys };
    try {
      if (newChunkPairs.length) await AsyncStorage.multiSet(newChunkPairs);
      maybeFail('afterChunks');
      await AsyncStorage.setItem(TX_JOURNAL_KEY, JSON.stringify(journal));
      maybeFail('afterJournal');
      if (flipSet.length) await AsyncStorage.multiSet(flipSet);
      if (flipRemove.length) await AsyncStorage.multiRemove(flipRemove);
      maybeFail('afterFlip');
      await AsyncStorage.setItem(TX_JOURNAL_KEY, JSON.stringify({ ...journal, state: 'committed' }));
    } catch (e) {
      // Put everything back as it was; the journal (if written) makes this repeatable at next start.
      try {
        await rollBack(journal);
        await AsyncStorage.removeItem(TX_JOURNAL_KEY);
      } catch { /* the journal stays; recoverInterruptedTransaction finishes the rollback */ }
      throw e;
    }
    maybeFail('afterCommit');
    try {
      if (oldChunkKeys.length) await AsyncStorage.multiRemove(oldChunkKeys);
      await AsyncStorage.removeItem(TX_JOURNAL_KEY);
    } catch { /* committed: cleanup is finished by recovery at next start */ }
  });
}
