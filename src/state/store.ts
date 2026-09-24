/**
 * store.ts — the in-memory app state and the ONLY place that persists operational
 * data (handoff §31: "domain/storage services own persistence", "no raw AsyncStorage
 * in screens"). Screens read with useAppState(selector) and change data through the
 * actions in state/actions.ts, which call the domain engines and then persist here.
 */
import { useSyncExternalStore } from 'react';
import { buildCatalogIndex, type CatalogIndex } from '../domain/catalogIndex';
import type { Lookups } from '../domain/countEngine';
import {
  DEFAULT_SETTINGS,
  type AppSettings, type Category, type CountEntry, type CountSession, type FavouriteCount, type OnboardingState,
  type Product, type ProductCountSnapshot, type StockLocation, type Supplier,
} from '../domain/types';
import { KEYS, countEntriesKey } from '../storage/keys';
import { readCollection, readDoc, recoverInterruptedTransaction, runTransaction, StorageCorruptionError, type TxOp } from '../storage/kv';
import { FutureSchemaError, runMigrations } from '../storage/migrations';
import {
  isCategory, isCountEntry, isCountSessionHeader, isFavourite, isOnboarding, isProduct, isSettingsDoc, isSnapshotMap, normalizeSettings,
  isStockLocation, isSupplier, type CountSessionHeader,
} from '../storage/schemas';

export interface AppState {
  status: 'loading' | 'ready' | 'error';
  error: null | { kind: 'corrupt' | 'future' | 'unknown'; message: string };
  /** Set when saving the open count failed; the screen shows a retry notice. */
  saveError: string | null;
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  locations: StockLocation[];
  /** Every session header, newest first. */
  sessions: CountSessionHeader[];
  /** The one open (active or paused) count, with entries. */
  openSession: CountSession | null;
  snapshots: Record<string, ProductCountSnapshot>;
  favourites: FavouriteCount[];
  settings: AppSettings;
  onboarding: OnboardingState;
  /** Derived; rebuilt when products change. */
  index: CatalogIndex;
  lookups: Lookups;
}

function makeLookups(categories: Category[], suppliers: Supplier[], locations: StockLocation[]): Lookups {
  return {
    categories: new Map(categories.map(c => [c.id, c])),
    suppliers: new Map(suppliers.map(s => [s.id, s])),
    locations: new Map(locations.map(l => [l.id, l])),
  };
}

function initialState(): AppState {
  return {
    status: 'loading', error: null, saveError: null, products: [], categories: [], suppliers: [], locations: [], sessions: [],
    openSession: null, snapshots: {}, favourites: [], settings: DEFAULT_SETTINGS, onboarding: { version: 1 },
    index: buildCatalogIndex([]), lookups: makeLookups([], [], []),
  };
}

let state: AppState = initialState();
const listeners = new Set<() => void>();

export function getState(): AppState { return state; }

function setState(patch: Partial<AppState>): void {
  const next: AppState = { ...state, ...patch };
  if (patch.products) next.index = buildCatalogIndex(patch.products);
  if (patch.categories || patch.suppliers || patch.locations) next.lookups = makeLookups(next.categories, next.suppliers, next.locations);
  state = next;
  listeners.forEach(l => l());
}

export function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

/** Test / restore helper: forget everything in memory. */
export function resetStoreForTests(): void {
  state = initialState();
  openWriteQueue = Promise.resolve();
  pendingOpen = undefined;
}

export function headerOf(session: CountSession): CountSessionHeader {
  const { entries, ...rest } = session;
  return { ...rest, entryCount: entries.length };
}

function sortSessions(list: CountSessionHeader[]): CountSessionHeader[] {
  return [...list].sort((a, b) => ((b.completedAt ?? b.startedAt) > (a.completedAt ?? a.startedAt) ? 1 : -1));
}

/** Load everything from storage (app start, after restore). Fails closed on corruption. */
export async function loadStore(): Promise<void> {
  try {
    await recoverInterruptedTransaction();
    await runMigrations();
    const [products, categories, suppliers, locations, sessions, snapshots, favourites, settings, onboarding] = await Promise.all([
      readCollection(KEYS.products, isProduct),
      readCollection(KEYS.categories, isCategory),
      readCollection(KEYS.suppliers, isSupplier),
      readCollection(KEYS.locations, isStockLocation),
      readCollection(KEYS.countSessions, isCountSessionHeader),
      readDoc(KEYS.countSnapshots, isSnapshotMap, {}),
      readCollection(KEYS.favourites, isFavourite),
      readDoc(KEYS.settings, isSettingsDoc, {} as Record<string, unknown>),
      readDoc(KEYS.onboarding, isOnboarding, { version: 1 } as OnboardingState),
    ]);
    const openHeaders = sessions.filter(s => s.status !== 'completed');
    let openSession: CountSession | null = null;
    if (openHeaders.length) {
      // Only one open count is ever created; if an older build left two, keep the newest open.
      const h = sortSessions(openHeaders)[0];
      const entries = await readCollection(countEntriesKey(h.id), isCountEntry);
      const { entryCount: _n, ...rest } = h;
      openSession = { ...rest, entries };
    }
    setState({
      status: 'ready', error: null, products, categories, suppliers, locations, sessions: sortSessions(sessions),
      openSession, snapshots, favourites, settings: normalizeSettings(settings), onboarding,
    });
  } catch (e) {
    const kind = e instanceof StorageCorruptionError ? 'corrupt' : e instanceof FutureSchemaError ? 'future' : 'unknown';
    setState({ status: 'error', error: { kind, message: e instanceof Error ? e.message : String(e) } });
  }
}

// ─── Persistence (every write is one atomic transaction) ─────────────────────────

export interface CatalogPatch { products?: Product[]; categories?: Category[]; suppliers?: Supplier[]; locations?: StockLocation[] }

function catalogOps(p: CatalogPatch): TxOp[] {
  const ops: TxOp[] = [];
  if (p.products) ops.push({ kind: 'collection', key: KEYS.products, items: p.products });
  if (p.categories) ops.push({ kind: 'collection', key: KEYS.categories, items: p.categories });
  if (p.suppliers) ops.push({ kind: 'collection', key: KEYS.suppliers, items: p.suppliers });
  if (p.locations) ops.push({ kind: 'collection', key: KEYS.locations, items: p.locations });
  return ops;
}

/** Persist catalogue changes atomically, then publish them. */
export async function commitCatalog(patch: CatalogPatch, extra: TxOp[] = []): Promise<void> {
  await runTransaction([...catalogOps(patch), ...extra]);
  setState(patch);
}

// The open count is written on every change. Writes are serialised and coalesced:
// if several changes arrive while a write is running, only the latest is written next.
let openWriteQueue: Promise<void> = Promise.resolve();
let pendingOpen: CountSession | null | undefined;

function writeOpenSession(session: CountSession): Promise<void> {
  const headers = sortSessions([headerOf(session), ...state.sessions.filter(h => h.id !== session.id)]);
  return runTransaction([
    { kind: 'collection', key: countEntriesKey(session.id), items: session.entries },
    { kind: 'collection', key: KEYS.countSessions, items: headers },
  ]);
}

/** Publish an open-session change immediately and persist it (coalesced). */
export function saveOpenSession(session: CountSession): Promise<void> {
  if (session.status === 'completed') throw new Error('Use commitCompletion for a completed session.');
  setState({ openSession: session, sessions: sortSessions([headerOf(session), ...state.sessions.filter(h => h.id !== session.id)]) });
  pendingOpen = session;
  openWriteQueue = openWriteQueue.then(async () => {
    const next = pendingOpen;
    pendingOpen = undefined;
    if (!next) return;
    try {
      await writeOpenSession(next);
      if (state.saveError) setState({ saveError: null });
    } catch (e) {
      setState({ saveError: e instanceof Error ? e.message : String(e) });
      throw e;
    }
  }).catch(() => undefined);
  return openWriteQueue;
}

/** Wait for queued open-session writes (tests, before navigation-critical steps). */
export function flushOpenSession(): Promise<void> {
  return openWriteQueue;
}

/** Completion: header, entries and snapshots in ONE transaction. */
export async function commitCompletion(session: CountSession, snapshots: Record<string, ProductCountSnapshot>): Promise<void> {
  await flushOpenSession().catch(() => undefined);
  pendingOpen = undefined;
  const headers = sortSessions([headerOf(session), ...state.sessions.filter(h => h.id !== session.id)]);
  await runTransaction([
    { kind: 'collection', key: countEntriesKey(session.id), items: session.entries },
    { kind: 'collection', key: KEYS.countSessions, items: headers },
    { kind: 'doc', key: KEYS.countSnapshots, value: snapshots },
  ]);
  setState({ sessions: headers, snapshots, openSession: state.openSession?.id === session.id ? null : state.openSession });
}

/** Discard the open count: removes only the unfinished session. */
export async function commitDiscard(sessionId: string): Promise<void> {
  await flushOpenSession().catch(() => undefined);
  pendingOpen = undefined;
  const target = state.sessions.find(h => h.id === sessionId);
  if (target && target.status === 'completed') throw new Error('A completed count cannot be discarded.');
  const headers = state.sessions.filter(h => h.id !== sessionId);
  await runTransaction([
    { kind: 'deleteCollection', key: countEntriesKey(sessionId) },
    { kind: 'collection', key: KEYS.countSessions, items: headers },
  ]);
  setState({ sessions: headers, openSession: state.openSession?.id === sessionId ? null : state.openSession });
}

export async function loadSessionEntries(sessionId: string): Promise<CountEntry[]> {
  if (state.openSession?.id === sessionId) return state.openSession.entries;
  return readCollection(countEntriesKey(sessionId), isCountEntry);
}

export async function loadFullSession(sessionId: string): Promise<CountSession | null> {
  const h = state.sessions.find(s => s.id === sessionId);
  if (!h) return null;
  const entries = await loadSessionEntries(sessionId);
  const { entryCount: _n, ...rest } = h;
  return { ...rest, entries };
}

export async function commitFavourites(favourites: FavouriteCount[]): Promise<void> {
  await runTransaction([{ kind: 'collection', key: KEYS.favourites, items: favourites }]);
  setState({ favourites });
}

export async function commitSettings(settings: AppSettings): Promise<void> {
  await runTransaction([{ kind: 'doc', key: KEYS.settings, value: settings }]);
  setState({ settings });
}

export async function commitOnboarding(onboarding: OnboardingState): Promise<void> {
  await runTransaction([{ kind: 'doc', key: KEYS.onboarding, value: onboarding }]);
  setState({ onboarding });
}

/** Raw transaction for multi-entity writes that span catalogue + history (sample data). */
export async function commitMany(ops: TxOp[], patch: Partial<AppState>): Promise<void> {
  await runTransaction(ops);
  setState(patch);
}
