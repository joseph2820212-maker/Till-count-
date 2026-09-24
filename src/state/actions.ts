/**
 * actions.ts — the operations screens call. Each validates with the domain rules,
 * persists through the store (one atomic transaction) and returns a typed result.
 */
import {
  addToScope, applyScan, clearEntry, completeSession, pauseSession, resumeSession, setCaseLoose, setQuantity,
  startSession, stepQuantity, type ScanOutcome,
} from '../domain/countEngine';
import { findActiveByBarcode } from '../domain/catalogIndex';
import { normalizeBarcode } from '../domain/barcode';
import { reorderStatus } from '../domain/reorderEngine';
import { newId, uuid } from '../domain/ids';
import { validateNamedRecord, validateProduct, type NamedRecordError, type ProductError } from '../domain/productRules';
import type { CaseLooseInput } from '../domain/quantity';
import type {
  AppSettings, Category, CountEntrySource, CountMode, CountScope, CountSession, FavouriteCount, Product, ProductBarcode,
  StockLocation, Supplier,
} from '../domain/types';
import {
  commitCatalog, commitCompletion, commitDiscard, commitFavourites, commitOnboarding, commitSettings, getState, saveOpenSession,
} from './store';

const nowIso = () => new Date().toISOString();

// ─── Products ────────────────────────────────────────────────────────────────

export type ProductDraft = Omit<Product, 'id' | 'familyProductId' | 'createdAt' | 'updatedAt' | 'status'> & { status?: Product['status'] };

export async function createProduct(draft: ProductDraft): Promise<{ ok: true; product: Product } | { ok: false; errors: ProductError[] }> {
  const now = nowIso();
  const product: Product = { ...draft, name: draft.name.trim(), status: draft.status ?? 'active', id: newId('p'), familyProductId: uuid(), createdAt: now, updatedAt: now };
  const { products } = getState();
  const errors = validateProduct(products, product);
  if (errors.length) return { ok: false, errors };
  await commitCatalog({ products: [...products, product] });
  return { ok: true, product };
}

export async function updateProduct(next: Product): Promise<{ ok: true; product: Product } | { ok: false; errors: ProductError[] }> {
  const { products } = getState();
  const prev = products.find(p => p.id === next.id);
  if (!prev) return { ok: false, errors: [{ code: 'nameRequired' }] };
  const product: Product = { ...next, name: next.name.trim(), familyProductId: prev.familyProductId, createdAt: prev.createdAt, updatedAt: nowIso() };
  const errors = validateProduct(products, product, prev);
  if (errors.length) return { ok: false, errors };
  await commitCatalog({ products: products.map(p => (p.id === product.id ? product : p)) });
  return { ok: true, product };
}

export async function archiveProduct(id: string): Promise<void> {
  const { products } = getState();
  await commitCatalog({ products: products.map(p => (p.id === id ? { ...p, status: 'archived', updatedAt: nowIso() } : p)) });
}

/** Bring an archived product back — refused if its SKU / codes now belong to another active product. */
export async function unarchiveProduct(id: string): Promise<{ ok: true } | { ok: false; errors: ProductError[] }> {
  const { products } = getState();
  const p = products.find(x => x.id === id);
  if (!p) return { ok: false, errors: [] };
  const candidate: Product = { ...p, status: 'active', updatedAt: nowIso() };
  const errors = validateProduct(products, candidate, p);
  if (errors.length) return { ok: false, errors };
  await commitCatalog({ products: products.map(x => (x.id === id ? candidate : x)) });
  return { ok: true };
}

/**
 * Delete a product record. Completed count history is NOT touched: entries carry their
 * own copy of the product details. An open count keeps any entry already made.
 */
export async function deleteProduct(id: string): Promise<void> {
  const { products } = getState();
  await commitCatalog({ products: products.filter(p => p.id !== id) });
}

export async function addBarcodeToProduct(productId: string, barcode: ProductBarcode): Promise<{ ok: true } | { ok: false; errors: ProductError[] }> {
  const p = getState().products.find(x => x.id === productId);
  if (!p) return { ok: false, errors: [] };
  return updateProduct({ ...p, barcodes: [...p.barcodes, barcode] });
}

export async function removeBarcodeFromProduct(productId: string, barcodeId: string): Promise<void> {
  const p = getState().products.find(x => x.id === productId);
  if (!p) return;
  await updateProduct({ ...p, barcodes: p.barcodes.filter(b => b.id !== barcodeId) });
}

// ─── Categories / suppliers / locations ──────────────────────────────────────

type NamedKind = 'categories' | 'suppliers' | 'locations';
type NamedOf<K extends NamedKind> = K extends 'categories' ? Category : K extends 'suppliers' ? Supplier : StockLocation;
const PREFIX: Record<NamedKind, string> = { categories: 'c', suppliers: 's', locations: 'l' };

export async function saveNamed<K extends NamedKind>(
  kind: K, input: { id?: string; name: string; reference?: string },
): Promise<{ ok: true; record: NamedOf<K> } | { ok: false; error: NamedRecordError }> {
  const list = getState()[kind] as NamedOf<K>[];
  const now = nowIso();
  const existing = input.id ? list.find(r => r.id === input.id) : undefined;
  const record = {
    ...(existing ?? { id: newId(PREFIX[kind]), status: 'active', createdAt: now }),
    name: input.name.trim(),
    ...(kind === 'suppliers' ? { reference: input.reference?.trim() || undefined } : {}),
    updatedAt: now,
  } as NamedOf<K>;
  const err = validateNamedRecord(list, record);
  if (err) return { ok: false, error: err };
  const next = existing ? list.map(r => (r.id === record.id ? record : r)) : [...list, record];
  await commitCatalog({ [kind]: next } as Record<NamedKind, NamedOf<K>[]>);
  return { ok: true, record };
}

/** Archive a category / supplier / location. Products keep the link; history is unchanged. */
export async function archiveNamed(kind: NamedKind, id: string): Promise<void> {
  const list = getState()[kind] as NamedOf<NamedKind>[];
  await commitCatalog({ [kind]: list.map(r => (r.id === id ? { ...r, status: 'archived', updatedAt: nowIso() } : r)) } as never);
}

export async function unarchiveNamed(kind: NamedKind, id: string): Promise<{ ok: true } | { ok: false; error: NamedRecordError }> {
  const list = getState()[kind] as NamedOf<NamedKind>[];
  const r = list.find(x => x.id === id);
  if (!r) return { ok: true };
  const candidate = { ...r, status: 'active' as const, updatedAt: nowIso() };
  const err = validateNamedRecord(list, candidate);
  if (err) return { ok: false, error: err };
  await commitCatalog({ [kind]: list.map(x => (x.id === id ? candidate : x)) } as never);
  return { ok: true };
}

/** Set a product's reorder level / target stock (Edit reorder target). */
export async function setReorderTarget(productId: string, reorderLevel: number | undefined, targetStock: number | undefined) {
  const p = getState().products.find(x => x.id === productId);
  if (!p) return { ok: false as const, errors: [] as ProductError[] };
  const next: Product = { ...p };
  if (reorderLevel === undefined) delete next.reorderLevel; else next.reorderLevel = reorderLevel;
  if (targetStock === undefined) delete next.targetStock; else next.targetStock = targetStock;
  return updateProduct(next);
}

// ─── Counting ────────────────────────────────────────────────────────────────

export class OpenCountExistsError extends Error {
  constructor() { super('A count is already in progress.'); this.name = 'OpenCountExistsError'; }
}

export async function startCount(opts: { scope: CountScope; scopeLabel?: string; mode: CountMode; blindCount: boolean; caseLooseEnabled: boolean }): Promise<CountSession> {
  const s = getState();
  if (s.openSession) throw new OpenCountExistsError();
  const session = startSession(s.products, { ...opts, id: newId('cs'), now: nowIso() });
  await saveOpenSession(session);
  return session;
}

function requireOpen(): CountSession {
  const s = getState().openSession;
  if (!s) throw new Error('No count is in progress.');
  return s;
}

function productOrThrow(productId: string): Product {
  const p = getState().index.byId.get(productId);
  if (!p) throw new Error('Product not found.');
  return p;
}

export async function countSetQuantity(productId: string, quantity: number, source: CountEntrySource): Promise<void> {
  await saveOpenSession(setQuantity(requireOpen(), productOrThrow(productId), getState().lookups, quantity, source, nowIso()));
}

export async function countSetCaseLoose(productId: string, parts: CaseLooseInput, source: CountEntrySource): Promise<void> {
  await saveOpenSession(setCaseLoose(requireOpen(), productOrThrow(productId), getState().lookups, parts, source, nowIso()));
}

export async function countStep(productId: string, delta: 1 | -1): Promise<void> {
  await saveOpenSession(stepQuantity(requireOpen(), productOrThrow(productId), getState().lookups, delta, nowIso()));
}

export async function countClear(productId: string): Promise<void> {
  await saveOpenSession(clearEntry(requireOpen(), productId));
}

export async function countAddToScope(productId: string): Promise<void> {
  await saveOpenSession(addToScope(requireOpen(), productId));
}

export type ScanResult =
  | { kind: 'unknown'; code: string; archivedProductId?: string }
  | { kind: 'outOfScope'; product: Product; barcode: ProductBarcode }
  | { kind: 'counted'; product: Product; outcome: ScanOutcome };

/** Look up a scanned / typed code and apply it to the open count. */
export async function countScan(code: string, symbology: string | undefined, opts: { allowOutOfScope?: boolean } = {}): Promise<ScanResult> {
  const st = getState();
  const session = requireOpen();
  const norm = normalizeBarcode(code, symbology);
  const product = findActiveByBarcode(st.index, code, symbology);
  if (!product) {
    const archivedId = st.index.archivedByBarcode.get(norm);
    return { kind: 'unknown', code: norm || code, ...(archivedId ? { archivedProductId: archivedId } : {}) };
  }
  const barcode = product.barcodes.find(b => b.normalizedCode === norm) ?? product.barcodes[0];
  if (!session.productIdsSnapshot.includes(product.id) && !opts.allowOutOfScope) return { kind: 'outOfScope', product, barcode };
  const base = session.productIdsSnapshot.includes(product.id) ? session : addToScope(session, product.id);
  const outcome = applyScan(base, product, barcode, st.lookups, { repeatedScanAddsOne: st.settings.repeatedScanAddsOne, now: nowIso() });
  await saveOpenSession(outcome.session);
  return { kind: 'counted', product, outcome };
}

export async function pauseCount(): Promise<void> {
  await saveOpenSession(pauseSession(requireOpen(), nowIso()));
}

export async function resumeCount(): Promise<void> {
  await saveOpenSession(resumeSession(requireOpen()));
}

let completing: Promise<CountSession> | null = null;

/** Finish the open count. Double taps share one completion; a second call after it finished is a no-op. */
export function finishCount(): Promise<CountSession> {
  if (completing) return completing;
  const run = (async () => {
    const st = getState();
    const session = requireOpen();
    const { session: completed, snapshots, alreadyCompleted } = completeSession(session, st.snapshots, nowIso());
    if (alreadyCompleted) return completed;
    // Freeze the out / low picture of the counted products at completion (History detail).
    const attention = { out: 0, low: 0 };
    for (const e of completed.entries) {
      const p = st.index.byId.get(e.productId);
      const status = reorderStatus(e.quantityBase, p?.reorderLevel);
      if (status === 'out') attention.out++; else if (status === 'low') attention.low++;
    }
    const done: CountSession = { ...completed, attentionAtCompletion: attention };
    await commitCompletion(done, snapshots);
    return done;
  })();
  completing = run;
  run.then(() => { completing = null; }, () => { completing = null; });
  return run;
}

export async function discardCount(): Promise<void> {
  const s = getState().openSession;
  if (s) await commitDiscard(s.id);
}

// ─── Favourites ──────────────────────────────────────────────────────────────

export async function saveFavourite(input: Omit<FavouriteCount, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<{ ok: true; favourite: FavouriteCount } | { ok: false; error: 'nameRequired' }> {
  if (!input.name.trim()) return { ok: false, error: 'nameRequired' };
  const list = getState().favourites;
  const now = nowIso();
  const existing = input.id ? list.find(f => f.id === input.id) : undefined;
  const favourite: FavouriteCount = { ...input, name: input.name.trim(), id: existing?.id ?? newId('f'), createdAt: existing?.createdAt ?? now, updatedAt: now };
  await commitFavourites(existing ? list.map(f => (f.id === favourite.id ? favourite : f)) : [...list, favourite]);
  return { ok: true, favourite };
}

export async function deleteFavourite(id: string): Promise<void> {
  await commitFavourites(getState().favourites.filter(f => f.id !== id));
}

// ─── Settings / onboarding ───────────────────────────────────────────────────

export async function updateSettings(patch: Partial<AppSettings>): Promise<void> {
  await commitSettings({ ...getState().settings, ...patch, version: 1 });
}

export async function completeOnboarding(): Promise<void> {
  await commitOnboarding({ ...getState().onboarding, completedAt: nowIso() });
}

export async function markCameraExplained(): Promise<void> {
  await commitOnboarding({ ...getState().onboarding, cameraExplainedAt: nowIso() });
}
