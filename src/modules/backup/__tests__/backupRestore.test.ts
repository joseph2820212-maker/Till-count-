import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import {
  __failNextRestoreWrite, applyRestore, BACKUP_FORMAT, createBackup, decryptBackup, getBackupFileName, inspectText, isBackupKey,
  recoverInterruptedRestore, RESTORE_JOURNAL_KEY, RestoreError,
} from '../backupFile';
import { encryptString } from '../../../backup/backupCrypto';
import { countSetQuantity, createProduct, finishCount, saveNamed, startCount, updateSettings } from '../../../state/actions';
import { getState, loadStore, resetStoreForTests } from '../../../state/store';
import { makeBarcode } from '../../../domain/productRules';
import { DEVICE_LOCAL_KEYS, KEYS } from '../../../storage/keys';

jest.setTimeout(60000);
const PASS = 'correct horse battery';

async function seed() {
  const cat = await saveNamed('categories', { name: 'Drinks' });
  if (!cat.ok) throw new Error('seed');
  const p = await createProduct({ name: 'Cola', countUnit: 'each', categoryId: cat.record.id, barcodes: [makeBarcode('b', '5000112637922', 'single', 1)], costPrice: 0.5 });
  if (!p.ok) throw new Error('seed');
  await startCount({ scope: { type: 'everything' }, mode: 'list', blindCount: false, caseLooseEnabled: false });
  await countSetQuantity(p.product.id, 7, 'list');
  await finishCount();
  await updateSettings({ blindCount: true });
  await AsyncStorage.setItem(DEVICE_LOCAL_KEYS.language, 'en');
  return p.product;
}

async function snapshotStore(): Promise<Record<string, string>> {
  const keys = (await AsyncStorage.getAllKeys()) as string[];
  return Object.fromEntries(((await AsyncStorage.multiGet(keys)) as [string, string | null][]).filter((p): p is [string, string] => p[1] !== null));
}

async function makeBackupText(): Promise<string> {
  const r = await createBackup(PASS, '1.0.0', false);
  return FileSystem.readAsStringAsync(r.uri);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  resetStoreForTests();
  await loadStore();
});

describe('backup contents', () => {
  it('uses the .tcb name, includes operational keys only, never device keys or the passphrase', async () => {
    await seed();
    expect(getBackupFileName(new Date(2026, 8, 24, 22, 40))).toBe('TillCount_Backup_20260924_2240.tcb');
    const text = await makeBackupText();
    expect(text).not.toContain(PASS);
    const file = JSON.parse(text);
    expect(file).toMatchObject({ format: BACKUP_FORMAT, version: 1, schemaVersion: 1, entityCounts: { products: 1, completedCounts: 1, categories: 1 } });
    expect(file.enc.ciphertext.length).toBeGreaterThan(100);
    expect(text).not.toContain('Cola'); // encrypted, not plaintext
    const staged = await decryptBackup(inspectText(text, 'x.tcb'), PASS);
    expect(Object.keys(staged.data).every(isBackupKey)).toBe(true);
    expect(Object.keys(staged.data)).not.toContain(DEVICE_LOCAL_KEYS.language);
    expect(Object.keys(staged.data)).toContain(KEYS.products);
    expect(isBackupKey('tillcount:device:language')).toBe(false);
    expect(isBackupKey('tillcount:txJournal')).toBe(false);
    expect(isBackupKey('tillcount:products:v1:corrupt:123')).toBe(false);
    expect(isBackupKey('billing:last_verified_entitlement')).toBe(false);
  });
  it('requires a passphrase of at least 8 characters', async () => {
    await expect(createBackup('short', '1.0.0', false)).rejects.toThrow();
  });
});

describe('restore', () => {
  it('full round trip: wipe, restore, identical data; device-local keys kept', async () => {
    const product = await seed();
    const text = await makeBackupText();
    const before = await snapshotStore();
    // Change everything after the backup.
    await AsyncStorage.clear();
    await AsyncStorage.setItem(DEVICE_LOCAL_KEYS.language, 'de');
    resetStoreForTests(); await loadStore();
    await createProduct({ name: 'Other', countUnit: 'each', barcodes: [] });

    const staged = await decryptBackup(inspectText(text, 'b.tcb'), PASS);
    expect(staged.entityCounts).toMatchObject({ products: 1, completedCounts: 1 });
    await applyRestore(staged);
    const after = await snapshotStore();
    for (const [k, v] of Object.entries(before)) if (isBackupKey(k)) expect(after[k]).toBe(v);
    expect(after[DEVICE_LOCAL_KEYS.language]).toBe('de');
    expect(after[RESTORE_JOURNAL_KEY]).toBeUndefined();
    resetStoreForTests(); await loadStore();
    expect(getState().status).toBe('ready');
    expect(getState().products.map(p => p.name)).toEqual(['Cola']);
    expect(getState().snapshots[product.id].quantityBase).toBe(7);
    expect(getState().settings.blindCount).toBe(true);
  });

  it('wrong password: typed error, current data untouched', async () => {
    await seed();
    const text = await makeBackupText();
    const before = await snapshotStore();
    await expect(decryptBackup(inspectText(text, 'b.tcb'), 'wrong password!')).rejects.toMatchObject({ code: 'wrong-passphrase' });
    expect(await snapshotStore()).toEqual(before);
  });

  it('corrupt, foreign, future and truncated files are refused before anything changes', async () => {
    await seed();
    const text = await makeBackupText();
    const before = await snapshotStore();
    const code = async (fn: () => unknown) => { try { await fn(); return 'ok'; } catch (e) { return (e as RestoreError).code; } };
    expect(await code(() => inspectText('not json', 'x'))).toBe('invalid-json');
    expect(await code(() => inspectText(JSON.stringify({ format: 'tillcalc', version: 2, enc: {} }), 'x'))).toBe('wrong-format');
    expect(await code(() => inspectText(JSON.stringify({ format: BACKUP_FORMAT, version: 99, enc: {} }), 'x'))).toBe('future-version');
    expect(await code(() => inspectText(text.slice(0, text.length / 2), 'x'))).toBe('invalid-json');
    // Invalid ciphertext (tampered): GCM authentication fails.
    const tampered = JSON.parse(text);
    tampered.enc.ciphertext = tampered.enc.ciphertext.slice(0, -8) + 'AAAAAAAA';
    expect(await code(() => decryptBackup(inspectText(JSON.stringify(tampered), 'x'), PASS))).toBe('wrong-passphrase');
    expect(await snapshotStore()).toEqual(before);
  });

  it('valid decryption with an invalid payload is refused (never written)', async () => {
    const bad = { format: BACKUP_FORMAT, version: 1, enc: encryptString(JSON.stringify({ data: { [KEYS.products]: '{"m":1,"gen":"x","chunks":1,"count":1}', 'tillcount:products:v1:gx:c0': '[{"id":1}]' } }), PASS) };
    await expect(decryptBackup(inspectText(JSON.stringify(bad), 'x'), PASS)).rejects.toMatchObject({ code: 'invalid-payload' });
    const empty = { format: BACKUP_FORMAT, version: 1, enc: encryptString(JSON.stringify({ data: { 'evil:key': 'x' } }), PASS) };
    await expect(decryptBackup(inspectText(JSON.stringify(empty), 'x'), PASS)).rejects.toMatchObject({ code: 'empty-backup' });
    const future = { format: BACKUP_FORMAT, version: 1, enc: encryptString(JSON.stringify({ data: { [KEYS.schemaVersion]: '9' } }), PASS) };
    await expect(decryptBackup(inspectText(JSON.stringify(future), 'x'), PASS)).rejects.toMatchObject({ code: 'future-version' });
  });

  it('storage failure mid-restore rolls back to the exact previous data', async () => {
    await seed();
    const text = await makeBackupText();
    await createProduct({ name: 'After backup', countUnit: 'each', barcodes: [] });
    const before = await snapshotStore();
    const staged = await decryptBackup(inspectText(text, 'b.tcb'), PASS);
    __failNextRestoreWrite();
    await expect(applyRestore(staged)).rejects.toMatchObject({ code: 'rolled-back' });
    expect(await snapshotStore()).toEqual(before);
  });

  it('process death with a prepared restore journal: next start restores the pre-restore state', async () => {
    await seed();
    const before = await snapshotStore();
    const operational = Object.entries(before).filter(([k]) => isBackupKey(k)) as [string, string][];
    // What a process killed mid-restore leaves behind: prepared journal + half-written keys.
    const djb2 = (str: string) => { let h = 5381; for (let i = 0; i < str.length; i++) h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0; return h; };
    await AsyncStorage.setItem(RESTORE_JOURNAL_KEY, JSON.stringify({ version: 1, state: 'prepared', snapshot: operational, checksum: djb2(JSON.stringify(operational)) }));
    await AsyncStorage.multiRemove([KEYS.products]);
    await AsyncStorage.setItem('tillcount:products:v1:ghalf:c0', '[]');
    expect(await recoverInterruptedRestore()).toBe('rolledBack');
    expect(await snapshotStore()).toEqual(before);
    resetStoreForTests(); await loadStore();
    expect(getState().status).toBe('ready');
    expect(getState().products).toHaveLength(1);
  });

  it('a damaged journal is discarded without touching data', async () => {
    await seed();
    const before = await snapshotStore();
    await AsyncStorage.setItem(RESTORE_JOURNAL_KEY, '{"version":1,"state":"prepared","snapshot":[],"checksum":1}');
    expect(await recoverInterruptedRestore()).toBe('none');
    const after = await snapshotStore();
    delete before[RESTORE_JOURNAL_KEY];
    expect(after).toEqual(before);
  });

  it('a committed journal is simply cleared at start', async () => {
    await seed();
    const djb2 = (str: string) => { let h = 5381; for (let i = 0; i < str.length; i++) h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0; return h; };
    await AsyncStorage.setItem(RESTORE_JOURNAL_KEY, JSON.stringify({ version: 1, state: 'committed', snapshot: [], checksum: djb2('[]') }));
    expect(await recoverInterruptedRestore()).toBe('completed');
    expect(await AsyncStorage.getItem(RESTORE_JOURNAL_KEY)).toBeNull();
  });
});
