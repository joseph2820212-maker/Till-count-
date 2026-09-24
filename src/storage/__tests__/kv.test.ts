import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  __setTxFailurePoint, chunkItems, readCollection, readDoc, recoverInterruptedTransaction, runTransaction,
  StorageCorruptionError, TX_JOURNAL_KEY,
} from '../kv';
import { FutureSchemaError, runMigrations } from '../migrations';
import { KEYS } from '../keys';

const isNum = (v: unknown): v is number => typeof v === 'number';
const isRec = (v: unknown): v is { id: number; pad: string } => !!v && typeof (v as { id: unknown }).id === 'number';

async function allKeys(): Promise<string[]> { return [...(await AsyncStorage.getAllKeys())].sort(); }

beforeEach(async () => { await AsyncStorage.clear(); __setTxFailurePoint(null); });

describe('collections', () => {
  it('round-trips and chunks large lists under the size target', async () => {
    const items = Array.from({ length: 3000 }, (_, i) => ({ id: i, pad: 'x'.repeat(300) }));
    await runTransaction([{ kind: 'collection', key: 'tillcount:t:v1', items }]);
    const keys = (await allKeys()).filter(k => k.startsWith('tillcount:t:v1:g'));
    expect(keys.length).toBeGreaterThan(1);
    for (const k of keys) expect(((await AsyncStorage.getItem(k)) ?? '').length).toBeLessThan(450_000);
    expect(await readCollection('tillcount:t:v1', isRec)).toEqual(items);
  });
  it('an absent collection is empty; rewriting removes the old generation', async () => {
    expect(await readCollection('tillcount:none:v1', isNum)).toEqual([]);
    await runTransaction([{ kind: 'collection', key: 'tillcount:a:v1', items: [1, 2] }]);
    await runTransaction([{ kind: 'collection', key: 'tillcount:a:v1', items: [3] }]);
    expect(await readCollection('tillcount:a:v1', isNum)).toEqual([3]);
    expect((await allKeys()).filter(k => k.startsWith('tillcount:a:v1:g'))).toHaveLength(1);
    expect(await AsyncStorage.getItem(TX_JOURNAL_KEY)).toBeNull();
  });
  it('fails closed on a corrupt manifest, missing chunk, invalid record or count mismatch', async () => {
    await runTransaction([{ kind: 'collection', key: 'tillcount:a:v1', items: [1, 2] }]);
    const manifest = JSON.parse((await AsyncStorage.getItem('tillcount:a:v1'))!);
    const chunk = `tillcount:a:v1:g${manifest.gen}:c0`;

    await AsyncStorage.setItem(chunk, '[1,"two"]');
    await expect(readCollection('tillcount:a:v1', isNum)).rejects.toBeInstanceOf(StorageCorruptionError);
    await AsyncStorage.setItem(chunk, '[1]');
    await expect(readCollection('tillcount:a:v1', isNum)).rejects.toThrow(/count mismatch/);
    await AsyncStorage.removeItem(chunk);
    await expect(readCollection('tillcount:a:v1', isNum)).rejects.toThrow(/missing chunk/);
    await AsyncStorage.setItem('tillcount:a:v1', '{not json');
    await expect(readCollection('tillcount:a:v1', isNum)).rejects.toBeInstanceOf(StorageCorruptionError);
    // the unreadable value is preserved, never deleted
    expect((await allKeys()).some(k => k.startsWith('tillcount:a:v1:corrupt:'))).toBe(true);
  });
  it('documents fail closed too', async () => {
    await AsyncStorage.setItem('tillcount:d', '"text"');
    await expect(readDoc('tillcount:d', isNum, 0)).rejects.toBeInstanceOf(StorageCorruptionError);
    expect(await readDoc('tillcount:absent', isNum, 7)).toBe(7);
  });
  it('chunkItems never produces an empty chunk', () => {
    expect(chunkItems([])).toEqual([]);
    expect(chunkItems([1, 2, 3], 4)).toEqual(['[1]', '[2]', '[3]']);
  });
});

describe('transactions are all-or-nothing', () => {
  async function seed() {
    await runTransaction([
      { kind: 'collection', key: 'tillcount:a:v1', items: [1, 2] },
      { kind: 'doc', key: 'tillcount:d', value: 1 },
    ]);
  }
  async function state() {
    return { a: await readCollection('tillcount:a:v1', isNum), b: await readCollection('tillcount:b:v1', isNum), d: await readDoc('tillcount:d', isNum, -1) };
  }
  const ops = [
    { kind: 'collection' as const, key: 'tillcount:a:v1', items: [9] },
    { kind: 'collection' as const, key: 'tillcount:b:v1', items: [8, 8] },
    { kind: 'doc' as const, key: 'tillcount:d', value: 2 },
  ];

  for (const point of ['afterChunks', 'afterJournal', 'afterFlip'] as const) {
    it(`storage failure ${point}: previous state kept, no leftovers`, async () => {
      await seed();
      const before = await allKeys();
      __setTxFailurePoint(point);
      await expect(runTransaction(ops)).rejects.toThrow(/simulated/);
      expect(await state()).toEqual({ a: [1, 2], b: [], d: 1 });
      expect(await allKeys()).toEqual(before);
    });
  }

  it('a prepared journal left by a dead process is rolled back at start', async () => {
    await seed();
    const beforeA = await AsyncStorage.getItem('tillcount:a:v1');
    // New generation chunks + a flipped manifest + a prepared journal: exactly what a death mid-flip leaves.
    await AsyncStorage.multiSet([['tillcount:a:v1:gdead:c0', '[9]']]);
    await AsyncStorage.setItem(TX_JOURNAL_KEY, JSON.stringify({ v: 1, state: 'prepared', before: [['tillcount:a:v1', beforeA], ['tillcount:d', '1']], newChunkKeys: ['tillcount:a:v1:gdead:c0'], oldChunkKeys: [] }));
    await AsyncStorage.setItem('tillcount:a:v1', JSON.stringify({ m: 1, gen: 'dead', chunks: 1, count: 1 }));
    await AsyncStorage.setItem('tillcount:d', '2');
    expect(await recoverInterruptedTransaction()).toBe('rolledBack');
    expect(await state()).toEqual({ a: [1, 2], b: [], d: 1 });
    expect((await allKeys()).includes('tillcount:a:v1:gdead:c0')).toBe(false);
    expect(await AsyncStorage.getItem(TX_JOURNAL_KEY)).toBeNull();
  });

  it('a committed journal is finished at start (old generation removed)', async () => {
    await seed();
    __setTxFailurePoint('afterCommit');
    await expect(runTransaction(ops)).rejects.toThrow(/simulated/);
    expect(await AsyncStorage.getItem(TX_JOURNAL_KEY)).not.toBeNull();
    expect(await recoverInterruptedTransaction()).toBe('completed');
    expect(await state()).toEqual({ a: [9], b: [8, 8], d: 2 });
    expect((await allKeys()).filter(k => k.startsWith('tillcount:a:v1:g'))).toHaveLength(1);
  });

  it('delete ops remove keys and their chunks', async () => {
    await seed();
    await runTransaction([{ kind: 'deleteCollection', key: 'tillcount:a:v1' }, { kind: 'delete', key: 'tillcount:d' }]);
    expect(await allKeys()).toEqual([]);
  });
});

describe('schema migrations', () => {
  it('stamps a fresh install and is idempotent', async () => {
    expect(await runMigrations()).toEqual({ from: null, to: 1 });
    expect(await runMigrations()).toEqual({ from: 1, to: 1 });
    expect(await AsyncStorage.getItem(KEYS.schemaVersion)).toBe('1');
  });
  it('refuses data from a newer app version and changes nothing', async () => {
    await AsyncStorage.setItem(KEYS.schemaVersion, '7');
    await expect(runMigrations()).rejects.toBeInstanceOf(FutureSchemaError);
    expect(await AsyncStorage.getItem(KEYS.schemaVersion)).toBe('7');
  });
});
