/**
 * countEngine.ts — the counting rules (handoff §9), as pure functions.
 *
 *  - Scope is resolved ONCE at start into productIdsSnapshot; later catalogue changes
 *    never silently change it. Only an explicit user action (addToScope) can extend it.
 *  - Entries copy names / cost at count time, so later product edits never rewrite them.
 *  - Completion: only entered products update the latest snapshots; uncounted products
 *    keep their previous snapshot and are never set to zero.
 *  - Completion is idempotent: completing a completed session changes nothing.
 *  - A completed session is immutable: every mutation below refuses it.
 */
import { addQuantity, caseLooseTotal, packUnitsOf, roundForUnit, validateQuantity, type CaseLooseInput } from './quantity';
import type {
  Category, CountEntry, CountEntrySource, CountMode, CountScope, CountSession, Product,
  ProductBarcode, ProductCountSnapshot, StockLocation, Supplier,
} from './types';

export interface Lookups {
  categories: ReadonlyMap<string, Category>;
  suppliers: ReadonlyMap<string, Supplier>;
  locations: ReadonlyMap<string, StockLocation>;
}

export class CountSessionLockedError extends Error {
  constructor() { super('A completed count cannot be changed.'); this.name = 'CountSessionLockedError'; }
}
export class InvalidQuantityError extends Error {
  readonly reason: string;
  constructor(reason: string) { super(`Invalid quantity: ${reason}`); this.name = 'InvalidQuantityError'; this.reason = reason; }
}

function assertOpen(session: CountSession): void {
  if (session.status === 'completed') throw new CountSessionLockedError();
}

/** Supplier-scope id meaning "products with no supplier". */
export const NO_SUPPLIER_ID = 'none';

/** Active products for a scope, in name order. */
export function resolveScope(products: readonly Product[], scope: CountScope): string[] {
  const active = products.filter(p => p.status === 'active');
  let chosen: Product[];
  switch (scope.type) {
    case 'everything': chosen = active; break;
    case 'category': chosen = active.filter(p => !!scope.categoryId && p.categoryId === scope.categoryId); break;
    case 'supplier': chosen = scope.supplierId === NO_SUPPLIER_ID ? active.filter(p => !p.supplierId) : active.filter(p => !!scope.supplierId && p.supplierId === scope.supplierId); break;
    case 'location': chosen = active.filter(p => !!scope.locationId && p.locationId === scope.locationId); break;
    case 'selected': {
      const wanted = new Set(scope.selectedProductIds ?? []);
      chosen = active.filter(p => wanted.has(p.id));
      break;
    }
    default: chosen = [];
  }
  return chosen.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)).map(p => p.id);
}

export interface StartOptions {
  id: string;
  scope: CountScope;
  scopeLabel?: string;
  mode: CountMode;
  blindCount: boolean;
  caseLooseEnabled: boolean;
  now: string;
}

export function startSession(products: readonly Product[], opts: StartOptions): CountSession {
  return {
    id: opts.id,
    status: 'active',
    scope: { ...opts.scope, ...(opts.scope.selectedProductIds ? { selectedProductIds: [...opts.scope.selectedProductIds] } : {}) },
    ...(opts.scopeLabel ? { scopeLabel: opts.scopeLabel } : {}),
    mode: opts.mode,
    blindCount: opts.blindCount,
    caseLooseEnabled: opts.caseLooseEnabled,
    productIdsSnapshot: resolveScope(products, opts.scope),
    startedAt: opts.now,
    entries: [],
  };
}

export function entryFor(session: CountSession, productId: string): CountEntry | undefined {
  return session.entries.find(e => e.productId === productId);
}

export function isInScope(session: CountSession, productId: string): boolean {
  return session.productIdsSnapshot.includes(productId);
}

/** Explicit user action: count a product that was not in the original scope. */
export function addToScope(session: CountSession, productId: string): CountSession {
  assertOpen(session);
  if (isInScope(session, productId)) return session;
  return { ...session, productIdsSnapshot: [...session.productIdsSnapshot, productId] };
}

function buildEntry(product: Product, lookups: Lookups, quantityBase: number, source: CountEntrySource, now: string, parts?: CaseLooseInput): CountEntry {
  const cat = product.categoryId ? lookups.categories.get(product.categoryId) : undefined;
  const sup = product.supplierId ? lookups.suppliers.get(product.supplierId) : undefined;
  const loc = product.locationId ? lookups.locations.get(product.locationId) : undefined;
  return {
    productId: product.id,
    productName: product.name,
    ...(product.sku ? { sku: product.sku } : {}),
    ...(cat ? { categoryName: cat.name } : {}),
    ...(sup ? { supplierName: sup.name } : {}),
    ...(loc ? { locationName: loc.name } : {}),
    countUnit: product.countUnit,
    ...(typeof product.costPrice === 'number' && Number.isFinite(product.costPrice) && product.costPrice >= 0 ? { costPriceAtCount: product.costPrice } : {}),
    quantityBase,
    ...(parts?.caseCount !== undefined ? { caseCount: parts.caseCount } : {}),
    ...(parts?.packCount !== undefined ? { packCount: parts.packCount } : {}),
    ...(parts?.looseCount !== undefined ? { looseCount: parts.looseCount } : {}),
    countedAt: now,
    source,
  };
}

function upsertEntry(session: CountSession, entry: CountEntry): CountSession {
  const others = session.entries.filter(e => e.productId !== entry.productId);
  const productIdsSnapshot = isInScope(session, entry.productId) ? session.productIdsSnapshot : [...session.productIdsSnapshot, entry.productId];
  return { ...session, productIdsSnapshot, entries: [...others, entry] };
}

/** Set an absolute quantity (keypad, list row, quick quantity, manual edit). Zero is valid. */
export function setQuantity(session: CountSession, product: Product, lookups: Lookups, quantity: number, source: CountEntrySource, now: string): CountSession {
  assertOpen(session);
  const q = roundForUnit(quantity, product.countUnit);
  const err = validateQuantity(quantity, product.countUnit);
  if (err) throw new InvalidQuantityError(err);
  return upsertEntry(session, buildEntry(product, lookups, q, source, now));
}

/** Set via case + pack + loose (handoff §9 case+loose). */
export function setCaseLoose(session: CountSession, product: Product, lookups: Lookups, parts: CaseLooseInput, source: CountEntrySource, now: string): CountSession {
  assertOpen(session);
  const res = caseLooseTotal(parts, packUnitsOf(product, 'case'), packUnitsOf(product, 'pack'), product.countUnit);
  if (!res.ok) throw new InvalidQuantityError(res.error);
  return upsertEntry(session, buildEntry(product, lookups, res.total, source, now, parts));
}

export type ScanOutcome =
  | { kind: 'incremented'; session: CountSession; quantity: number; delta: number }
  | { kind: 'needsQuantity'; session: CountSession; current?: number };

/**
 * A known barcode was scanned.
 *  repeated scan ON  → add unitsPerBarcode (single +1, pack +pack units, case +case units)
 *  repeated scan OFF → nothing is added; the caller opens the quantity entry for this product
 * A product outside the scope is only added when `allowOutOfScope` (the user confirmed).
 */
export function applyScan(
  session: CountSession, product: Product, barcode: ProductBarcode, lookups: Lookups,
  opts: { repeatedScanAddsOne: boolean; now: string },
): ScanOutcome {
  assertOpen(session);
  const existing = entryFor(session, product.id);
  if (!opts.repeatedScanAddsOne) return { kind: 'needsQuantity', session, current: existing?.quantityBase };
  const delta = barcode.role === 'single' ? 1 : barcode.unitsPerBarcode;
  if (!(Number.isFinite(delta) && delta > 0)) throw new InvalidQuantityError('invalidCount');
  const quantity = addQuantity(existing?.quantityBase ?? 0, delta, product.countUnit);
  const err = validateQuantity(quantity, product.countUnit);
  if (err) throw new InvalidQuantityError(err);
  // A repeated scan replaces any case/loose breakdown with a plain total.
  return { kind: 'incremented', session: upsertEntry(session, buildEntry(product, lookups, quantity, 'scan', opts.now)), quantity, delta };
}

/** Step the current quantity by ±1 base unit (never below zero). */
export function stepQuantity(session: CountSession, product: Product, lookups: Lookups, delta: 1 | -1, now: string): CountSession {
  assertOpen(session);
  const existing = entryFor(session, product.id);
  // "−" on a product not counted yet does nothing (one stray tap must not record a 0).
  if (!existing && delta < 0) return session;
  const current = existing?.quantityBase ?? 0;
  const next = Math.max(0, addQuantity(current, delta, product.countUnit));
  return upsertEntry(session, buildEntry(product, lookups, next, 'keypad', now));
}

/** Undo one entry (the product becomes "not counted" again in this session). */
export function clearEntry(session: CountSession, productId: string): CountSession {
  assertOpen(session);
  return { ...session, entries: session.entries.filter(e => e.productId !== productId) };
}

export function pauseSession(session: CountSession, now: string): CountSession {
  assertOpen(session);
  return session.status === 'paused' ? session : { ...session, status: 'paused', pausedAt: now };
}

export function resumeSession(session: CountSession): CountSession {
  assertOpen(session);
  if (session.status === 'active') return session;
  const { pausedAt: _p, ...rest } = session;
  return { ...rest, status: 'active' };
}

export function countedIds(session: CountSession): Set<string> {
  return new Set(session.entries.map(e => e.productId));
}

/** Products in scope that have no entry. */
export function uncountedIds(session: CountSession): string[] {
  const counted = countedIds(session);
  return session.productIdsSnapshot.filter(id => !counted.has(id));
}

/** Units = the sum of "each" quantities (measured quantities are not units). */
export function unitsOf(entries: CountSession['entries']): number {
  return entries.reduce((n, e) => (e.countUnit === 'each' ? n + e.quantityBase : n), 0);
}

export function progressOf(session: CountSession): { counted: number; total: number; percent: number } {
  const counted = countedIds(session);
  const inScope = session.productIdsSnapshot.filter(id => counted.has(id)).length;
  const total = session.productIdsSnapshot.length;
  return { counted: inScope, total, percent: total > 0 ? Math.round((inScope / total) * 100) : 0 };
}

/**
 * Complete a session. Idempotent: an already-completed session is returned unchanged,
 * together with the snapshots it would produce (so a double tap cannot change history).
 */
export function completeSession(
  session: CountSession,
  previousSnapshots: Readonly<Record<string, ProductCountSnapshot>>,
  now: string,
): { session: CountSession; snapshots: Record<string, ProductCountSnapshot>; alreadyCompleted: boolean } {
  if (session.status === 'completed') {
    return { session, snapshots: { ...previousSnapshots }, alreadyCompleted: true };
  }
  const completedAt = now;
  const { pausedAt: _p, ...rest } = session;
  const completed: CountSession = { ...rest, status: 'completed', completedAt, entries: session.entries.map(e => ({ ...e })) };
  const snapshots = applyCompletedToSnapshots(previousSnapshots, completed);
  return { session: completed, snapshots, alreadyCompleted: false };
}

/** Newer-wins merge of one completed session into the snapshot map. */
export function applyCompletedToSnapshots(
  previous: Readonly<Record<string, ProductCountSnapshot>>,
  session: CountSession,
): Record<string, ProductCountSnapshot> {
  const out: Record<string, ProductCountSnapshot> = { ...previous };
  if (session.status !== 'completed' || !session.completedAt) return out;
  for (const e of session.entries) {
    const prev = out[e.productId];
    if (prev && prev.countedAt > session.completedAt) continue;
    out[e.productId] = { productId: e.productId, quantityBase: e.quantityBase, countedAt: session.completedAt, countSessionId: session.id };
  }
  return out;
}

/**
 * Rebuild the latest-count snapshots from completed history alone. The stored snapshot
 * map is a cache of this; the app re-derives it at start-up so a crash between writes
 * can never leave it disagreeing with history.
 */
export function deriveSnapshots(sessions: readonly CountSession[]): Record<string, ProductCountSnapshot> {
  const completed = sessions
    .filter(s => s.status === 'completed' && !!s.completedAt)
    .sort((a, b) => (a.completedAt! < b.completedAt! ? -1 : a.completedAt! > b.completedAt! ? 1 : a.id.localeCompare(b.id)));
  let snaps: Record<string, ProductCountSnapshot> = {};
  for (const s of completed) snaps = applyCompletedToSnapshots(snaps, s);
  return snaps;
}

/** Quantities that differ from the previous completed count (Results "changes"). */
export function changesAgainst(
  session: CountSession,
  previous: Readonly<Record<string, ProductCountSnapshot>>,
): { productId: string; before: number | null; after: number }[] {
  return session.entries.map(e => ({ productId: e.productId, before: previous[e.productId]?.quantityBase ?? null, after: e.quantityBase }))
    .filter(c => c.before === null || c.before !== c.after);
}
