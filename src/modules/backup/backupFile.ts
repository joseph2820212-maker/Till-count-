/**
 * backupFile.ts — TillCount encrypted backup / restore (handoff §13). Ported from the
 * TillCalc donor (src/modules/backup/backupFile.ts @ e7ea8ca), which ported Till Note's.
 *
 * Backup  : snapshot every `tillcount:` operational key (collections with their chunks,
 *           documents) under the storage lock, encrypt { data } with the passphrase
 *           (AES-256-GCM + scrypt, backupCrypto), write `TillCount_Backup_YYYYMMDD_HHMM.tcb`
 *           to the cache directory and open the share sheet. The passphrase is never
 *           stored or logged.
 * Restore : pick → inspect header (format, version, plaintext counts) → passphrase →
 *           decrypt + validate EVERY record in memory (nothing on the phone changes) →
 *           preview → explicit confirmation → staged replacement journalled so that an
 *           interruption rolls back to the exact previous data → integrity re-read →
 *           commit. Wrong password, a corrupt or foreign file, or a failed write never
 *           alter current data.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { withStorageKeyLock } from '../../utils/storageSafety';
import { encryptString, decryptString, type EncryptedBlob } from '../../backup/backupCrypto';
import { COUNT_ENTRIES_PREFIX, DEVICE_LOCAL_KEYS, KEYS, SCHEMA_VERSION } from '../../storage/keys';
import { readCollectionFrom, StorageCorruptionError, TX_JOURNAL_KEY } from '../../storage/kv';
import {
  isCategory, isCountEntry, isCountSessionHeader, isFavourite, isOnboarding, isProduct, isSettingsDoc, isSnapshotMap, isStockLocation, isSupplier,
} from '../../storage/schemas';
import { SYMBOL_MAP } from '../../utils/currency';
import { writeExport, shareUri } from '../data/files';

export const BACKUP_FORMAT = 'tillcount-backup';
export const BACKUP_VERSION = 1;
export const BACKUP_EXTENSION = 'tcb';
export const RESTORE_JOURNAL_KEY = DEVICE_LOCAL_KEYS.restoreJournal;
const RESTORE_LOCK = 'tillcount:restore';
const TX_LOCK = 'tillcount:tx';
export const MAX_BACKUP_BYTES = 200 * 1024 * 1024;
export const MIN_PASSPHRASE_LENGTH = 8;

interface BackupFileShape {
  format?: string;
  version?: number;
  createdAt?: string;
  appVersion?: string;
  schemaVersion?: number;
  entityCounts?: Record<string, number>;
  enc?: EncryptedBlob;
}

// ─── What a backup contains ──────────────────────────────────────────────────

/** Operational keys only. Device-local keys (language, logs, journals) never leave the phone. */
export function isBackupKey(k: string): boolean {
  if (!k.startsWith('tillcount:')) return false;
  if (k.startsWith('tillcount:device:')) return false;
  if (k === TX_JOURNAL_KEY) return false;
  if (/:corrupt:\d+/.test(k)) return false;
  return /^tillcount:[A-Za-z0-9_.:-]+$/.test(k) && k.length <= 200;
}

export function getBackupFileName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `TillCount_Backup_${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}_${p(now.getHours())}${p(now.getMinutes())}.${BACKUP_EXTENSION}`;
}

export interface EntityCounts { products: number; categories: number; suppliers: number; locations: number; completedCounts: number; openCounts: number; favourites: number; settings: number }

export class RestoreError extends Error {
  readonly code: RestoreErrorCode;
  constructor(code: RestoreErrorCode, message: string) { super(message); this.code = code; this.name = 'RestoreError'; }
}
export type RestoreErrorCode =
  | 'too-large' | 'unreadable' | 'invalid-json' | 'wrong-format' | 'future-version' | 'unsupported-version'
  | 'passphrase-required' | 'wrong-passphrase' | 'invalid-payload' | 'empty-backup' | 'rolled-back' | 'rollback-failed';

/**
 * Decode and validate a key/value set exactly as the app would read it. Throws RestoreError
 * 'invalid-payload' on anything the app could not open (so it is never written).
 */
export async function validateData(data: Record<string, string>): Promise<EntityCounts> {
  const get = async (keys: string[]) => keys.map(k => (k in data ? data[k] : null));
  try {
    const products = await readCollectionFrom(get, KEYS.products, isProduct);
    const categories = await readCollectionFrom(get, KEYS.categories, isCategory);
    const suppliers = await readCollectionFrom(get, KEYS.suppliers, isSupplier);
    const locations = await readCollectionFrom(get, KEYS.locations, isStockLocation);
    const sessions = await readCollectionFrom(get, KEYS.countSessions, isCountSessionHeader);
    const favourites = await readCollectionFrom(get, KEYS.favourites, isFavourite);
    for (const s of sessions) {
      const entries = await readCollectionFrom(get, `${COUNT_ENTRIES_PREFIX}${s.id}:v1`, isCountEntry);
      if (entries.length !== s.entryCount) throw new StorageCorruptionError(s.id, 'entry count mismatch');
    }
    if (data[KEYS.countSnapshots] !== undefined) {
      let snaps: unknown;
      try { snaps = JSON.parse(data[KEYS.countSnapshots]); } catch { throw new StorageCorruptionError(KEYS.countSnapshots, 'invalid JSON'); }
      if (!isSnapshotMap(snaps)) throw new StorageCorruptionError(KEYS.countSnapshots, 'invalid snapshots');
    }
    // Documents the app reads fail-closed at start-up are checked the same way here, so a
    // restore can never leave a store the app refuses to open.
    const doc = (key: string, ok: (v: unknown) => boolean) => {
      if (data[key] === undefined) return;
      let v: unknown;
      try { v = JSON.parse(data[key]); } catch { throw new StorageCorruptionError(key, 'invalid JSON'); }
      if (!ok(v)) throw new StorageCorruptionError(key, 'invalid shape');
    };
    doc(KEYS.onboarding, isOnboarding);
    doc(KEYS.settings, isSettingsDoc);
    if (data[KEYS.currency] !== undefined && !(data[KEYS.currency] in SYMBOL_MAP)) throw new StorageCorruptionError(KEYS.currency, 'unknown currency');
    // Only keys TillCount owns: known documents, their chunks, and entries of listed counts.
    const known = new Set<string>(Object.values(KEYS));
    const entryKeys = new Set(sessions.map(h => `${COUNT_ENTRIES_PREFIX}${h.id}:v1`));
    for (const k of Object.keys(data)) {
      const base = k.replace(/:g[^:]+:c\d+$/, '');
      if (!known.has(base) && !entryKeys.has(base)) throw new StorageCorruptionError(k, 'unexpected key');
    }
    if (data[KEYS.schemaVersion] !== undefined) {
      const v = Number(data[KEYS.schemaVersion]);
      if (!Number.isInteger(v) || v < 1) throw new StorageCorruptionError(KEYS.schemaVersion, 'invalid');
      if (v > SCHEMA_VERSION) throw new RestoreError('future-version', 'This backup was made by a newer TillCount.');
    }
    const ids = new Set(products.map(p => p.id));
    if (ids.size !== products.length) throw new StorageCorruptionError(KEYS.products, 'duplicate ids');
    return {
      products: products.filter(p => p.status === 'active').length,
      categories: categories.filter(c => c.status === 'active').length,
      suppliers: suppliers.filter(c => c.status === 'active').length,
      locations: locations.filter(c => c.status === 'active').length,
      completedCounts: sessions.filter(s => s.status === 'completed').length,
      openCounts: sessions.filter(s => s.status !== 'completed').length,
      favourites: favourites.length,
      settings: data[KEYS.settings] !== undefined ? 1 : 0,
    };
  } catch (e) {
    if (e instanceof RestoreError) throw e;
    throw new RestoreError('invalid-payload', 'The backup content is not valid TillCount data.');
  }
}

export interface BackupSummary { fileName: string; uri: string; createdAt: string; entityCounts: EntityCounts }

/** Snapshot, encrypt and write a backup. The passphrase is mandatory and never stored. */
export async function createBackup(passphrase: string, appVersion: string, share = true): Promise<BackupSummary> {
  if (!passphrase || passphrase.length < MIN_PASSPHRASE_LENGTH) throw new Error('A passphrase of at least 8 characters is required.');
  // The transaction lock guarantees a consistent snapshot (no half-written collection).
  const pairs = await withStorageKeyLock([RESTORE_LOCK, TX_LOCK], async () => AsyncStorage.multiGet(((await AsyncStorage.getAllKeys()) as string[]).filter(isBackupKey)));
  const data: Record<string, string> = {};
  for (const [k, v] of pairs) if (v !== null) data[k] = v;
  const entityCounts = await validateData(data); // never write a backup the app could not restore
  const createdAt = new Date().toISOString();
  const enc = encryptString(JSON.stringify({ data }), passphrase);
  const payload = JSON.stringify({ format: BACKUP_FORMAT, version: BACKUP_VERSION, createdAt, appVersion, schemaVersion: SCHEMA_VERSION, entityCounts, enc });
  const fileName = getBackupFileName();
  const uri = await writeExport(fileName, payload, BACKUP_EXTENSION);
  await AsyncStorage.setItem(DEVICE_LOCAL_KEYS.lastBackupAt, createdAt).catch(() => undefined);
  if (share) await shareUri(uri, 'application/octet-stream');
  return { fileName, uri, createdAt, entityCounts };
}

export async function shareBackup(uri: string): Promise<void> {
  await shareUri(uri, 'application/octet-stream');
}

// ─── Restore ─────────────────────────────────────────────────────────────────

export interface BackupInspection { fileName: string; encrypted: true; createdAt?: string; appVersion?: string; entityCounts: Partial<EntityCounts>; raw: BackupFileShape }

async function readFile(fileUri: string): Promise<string> {
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    const size = info.exists ? (info as { size?: number }).size : undefined;
    if (typeof size === 'number' && size > MAX_BACKUP_BYTES) throw new RestoreError('too-large', 'Backup file is too large.');
    const raw = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
    if (typeof raw !== 'string') throw new RestoreError('unreadable', 'Backup file could not be read.');
    return raw;
  } catch (e) {
    if (e instanceof RestoreError) throw e;
    throw new RestoreError('unreadable', 'Backup file could not be read.');
  }
}

/** Parse the plaintext header only; no passphrase needed, nothing changes. */
export function inspectText(raw: string, fileName: string): BackupInspection {
  if (raw.length > MAX_BACKUP_BYTES) throw new RestoreError('too-large', 'Backup file is too large.');
  let parsed: BackupFileShape;
  try { parsed = JSON.parse(raw); } catch { throw new RestoreError('invalid-json', 'This is not a TillCount backup file.'); }
  if (!parsed || typeof parsed !== 'object' || parsed.format !== BACKUP_FORMAT) throw new RestoreError('wrong-format', 'This file is not a TillCount backup.');
  if (typeof parsed.version !== 'number') throw new RestoreError('unsupported-version', 'Unsupported backup version.');
  if (parsed.version > BACKUP_VERSION) throw new RestoreError('future-version', 'This backup was made by a newer TillCount.');
  if (parsed.version < 1) throw new RestoreError('unsupported-version', 'Unsupported backup version.');
  if (!parsed.enc) throw new RestoreError('wrong-format', 'Missing encryption header.');
  const counts = parsed.entityCounts && typeof parsed.entityCounts === 'object' ? parsed.entityCounts : {};
  return { fileName, encrypted: true, createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : undefined, appVersion: parsed.appVersion, entityCounts: counts, raw: parsed };
}

export async function inspectBackup(fileUri: string, fileName: string): Promise<BackupInspection> {
  return inspectText(await readFile(fileUri), fileName);
}

export interface StagedRestore { data: Record<string, string>; entityCounts: EntityCounts; createdAt?: string }

/** Decrypt and validate in memory. Throws 'wrong-passphrase' / 'invalid-payload'; changes nothing. */
export function decryptBackup(inspection: BackupInspection, passphrase: string): Promise<StagedRestore> {
  return (async () => {
    if (!passphrase) throw new RestoreError('passphrase-required', 'This backup is encrypted.');
    let decrypted: string;
    try { decrypted = decryptString(inspection.raw.enc!, passphrase); } catch { throw new RestoreError('wrong-passphrase', 'Incorrect password, or the file was altered.'); }
    let payload: { data?: unknown };
    try { payload = JSON.parse(decrypted); } catch { throw new RestoreError('invalid-payload', 'Decrypted content is malformed.'); }
    if (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) throw new RestoreError('invalid-payload', 'Missing data.');
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(payload.data as Record<string, unknown>)) {
      if (typeof v !== 'string') throw new RestoreError('invalid-payload', 'A value is not text.');
      if (isBackupKey(k)) data[k] = v; // allowlist: anything else is dropped
    }
    if (Object.keys(data).length === 0) throw new RestoreError('empty-backup', 'The backup contains no TillCount data.');
    const entityCounts = await validateData(data);
    return { data, entityCounts, createdAt: inspection.createdAt };
  })();
}

/**
 * Restore journal. The pre-restore snapshot can be several MB, and Android cannot read a
 * single AsyncStorage value over ~2 MB, so the snapshot is stored in device-local chunks:
 * `restoreJournal` holds { version: 2, state, chunks, checksum } and the snapshot JSON is
 * split across `restoreJournal:c<i>`. Version 1 (one value) is still read.
 */
interface RestoreJournal { version: 1 | 2; state: 'prepared' | 'committed'; snapshot: [string, string][]; checksum: number }
interface JournalHeader { version: 2; state: 'prepared' | 'committed'; chunks: number; checksum: number }
const JOURNAL_CHUNK_CHARS = 400_000;
const journalChunkKey = (i: number) => `${RESTORE_JOURNAL_KEY}:c${i}`;

/** The journal exists but cannot be read: keep it and stop (never guess, never discard it). */
export class RestoreJournalUnreadableError extends Error {
  constructor() { super('The restore journal could not be read.'); this.name = 'RestoreJournalUnreadableError'; }
}

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) hash = (((hash << 5) + hash) ^ str.charCodeAt(i)) >>> 0;
  return hash;
}

async function writeJournal(snapshot: [string, string][]): Promise<JournalHeader> {
  const json = JSON.stringify(snapshot);
  const parts: [string, string][] = [];
  for (let i = 0, c = 0; i < json.length || c === 0; i += JOURNAL_CHUNK_CHARS, c++) parts.push([journalChunkKey(c), json.slice(i, i + JOURNAL_CHUNK_CHARS)]);
  const header: JournalHeader = { version: 2, state: 'prepared', chunks: parts.length, checksum: djb2(json) };
  await AsyncStorage.multiSet(parts);
  await AsyncStorage.setItem(RESTORE_JOURNAL_KEY, JSON.stringify(header)); // the header makes the journal live
  return header;
}

async function clearJournal(): Promise<void> {
  const keys = ((await AsyncStorage.getAllKeys()) as string[]).filter(k => k === RESTORE_JOURNAL_KEY || k.startsWith(`${RESTORE_JOURNAL_KEY}:c`));
  if (keys.length) await AsyncStorage.multiRemove(keys);
}

/** null = no journal. Throws RestoreJournalUnreadableError when one exists but is damaged. */
async function readJournal(): Promise<RestoreJournal | null> {
  const raw = await AsyncStorage.getItem(RESTORE_JOURNAL_KEY);
  if (!raw) return null;
  try {
    const h = JSON.parse(raw) as { version?: number; state?: 'prepared' | 'committed'; snapshot?: [string, string][]; chunks?: number; checksum?: number };
    if (h.version === 1 && Array.isArray(h.snapshot) && h.checksum === djb2(JSON.stringify(h.snapshot)) && (h.state === 'prepared' || h.state === 'committed')) {
      return { version: 1, state: h.state, snapshot: h.snapshot, checksum: h.checksum as number };
    }
    if (h.version === 2 && Number.isInteger(h.chunks) && (h.chunks as number) > 0 && (h.state === 'prepared' || h.state === 'committed')) {
      const parts = (await AsyncStorage.multiGet(Array.from({ length: h.chunks as number }, (_, i) => journalChunkKey(i)))) as [string, string | null][];
      if (parts.some(p => p[1] === null)) throw new RestoreJournalUnreadableError();
      const json = parts.map(p => p[1]).join('');
      if (djb2(json) !== h.checksum) throw new RestoreJournalUnreadableError();
      const snapshot = JSON.parse(json) as [string, string][];
      if (!Array.isArray(snapshot)) throw new RestoreJournalUnreadableError();
      return { version: 2, state: h.state, snapshot, checksum: h.checksum as number };
    }
  } catch { /* fall through */ }
  throw new RestoreJournalUnreadableError();
}

async function markCommitted(): Promise<void> {
  const raw = await AsyncStorage.getItem(RESTORE_JOURNAL_KEY);
  if (!raw) return;
  const h = JSON.parse(raw) as JournalHeader;
  await AsyncStorage.setItem(RESTORE_JOURNAL_KEY, JSON.stringify({ ...h, state: 'committed' }));
}

/** Put back exactly the operational keys that existed before (device keys untouched). */
async function rollbackFromJournal(j: RestoreJournal): Promise<void> {
  const current = ((await AsyncStorage.getAllKeys()) as string[]).filter(isBackupKey);
  if (current.length) await AsyncStorage.multiRemove(current);
  if (j.snapshot.length) await AsyncStorage.multiSet(j.snapshot);
}

async function recoverInner(): Promise<'none' | 'rolledBack' | 'completed'> {
  const j = await readJournal(); // throws (and keeps the journal) when it is damaged
  if (!j) return 'none';
  if (j.state === 'committed') { await clearJournal(); return 'completed'; }
  await rollbackFromJournal(j);
  await clearJournal();
  return 'rolledBack';
}

/** App start: a restore interrupted before commit is rolled back to the snapshot. */
export function recoverInterruptedRestore(): Promise<'none' | 'rolledBack' | 'completed'> {
  return withStorageKeyLock([RESTORE_LOCK, TX_LOCK], recoverInner);
}

/** Test hook: write a prepared journal exactly as a restore does (simulates a crash right after). */
export const __writeRestoreJournal = writeJournal;

/** Test hook: fail the staged write after N steps. */
let failAfterWrite = false;
export function __failNextRestoreWrite(): void { failAfterWrite = true; }

/** Replace current operational data with a validated staged restore. */
export function applyRestore(staged: StagedRestore): Promise<EntityCounts> {
  return withStorageKeyLock([RESTORE_LOCK, TX_LOCK], async () => {
    await recoverInner();
    const existing = ((await AsyncStorage.getAllKeys()) as string[]).filter(isBackupKey);
    const snapshot = ((await AsyncStorage.multiGet(existing)) as [string, string | null][]).filter((p): p is [string, string] => p[1] !== null);
    const header = await writeJournal(snapshot);
    const journal: RestoreJournal = { version: 2, state: 'prepared', snapshot, checksum: header.checksum };
    const pairs = Object.entries(staged.data) as [string, string][];
    const incoming = new Set(pairs.map(p => p[0]));
    const stale = existing.filter(k => !incoming.has(k));
    try {
      if (stale.length) await AsyncStorage.multiRemove(stale);
      await AsyncStorage.multiSet(pairs);
      if (failAfterWrite) { failAfterWrite = false; throw new Error('simulated restore write failure'); }
      // Integrity: what is now stored must decode to the same counts before we commit.
      const now = ((await AsyncStorage.getAllKeys()) as string[]).filter(isBackupKey);
      const stored = Object.fromEntries(((await AsyncStorage.multiGet(now)) as [string, string | null][]).filter((p): p is [string, string] => p[1] !== null));
      const check = await validateData(stored);
      if (JSON.stringify(check) !== JSON.stringify(staged.entityCounts)) throw new Error('integrity check failed');
      await markCommitted();
    } catch {
      try {
        await rollbackFromJournal(journal);
        await clearJournal();
      } catch {
        throw new RestoreError('rollback-failed', 'Restore failed and the automatic rollback could not finish. Restart TillCount to finish recovery.');
      }
      throw new RestoreError('rolled-back', 'Restore failed. Your previous data is unchanged.');
    }
    // Everything was replaced: a half-finished transaction journal from before the restore
    // must not be replayed over the restored data at the next load.
    await AsyncStorage.removeItem(TX_JOURNAL_KEY).catch(() => undefined);
    await clearJournal().catch(() => undefined);
    return staged.entityCounts;
  });
}

export async function loadLastBackupAt(): Promise<string | null> {
  try { return await AsyncStorage.getItem(DEVICE_LOCAL_KEYS.lastBackupAt); } catch { return null; }
}
