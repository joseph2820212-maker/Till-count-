/**
 * productRules.ts — product / barcode / SKU / named-record validation (handoff §7, §25).
 *
 *  - name required (trimmed, ≤ 120 chars)
 *  - SKU optional; unique among ACTIVE products, compared trimmed + case-insensitive
 *  - barcode optional; a normalised code maps to at most one ACTIVE product, and a
 *    product never lists two equivalent codes
 *  - pack / case unitsPerBarcode > 0; a single is always 1
 *  - money / reorder numbers are ≥ 0 and finite when present
 *  - familyProductId is immutable
 * Archived products keep their codes; an archived product can only be brought back
 * when none of its codes / SKU now belong to another active product (DECISIONS D-04).
 */
import { buildCatalogIndex, normalizeName, normalizeSku } from './catalogIndex';
import { isAcceptableBarcode, normalizeBarcode } from './barcode';
import { isValidQuantity } from './quantity';
import type { Product, ProductBarcode } from './types';
import { COUNT_UNITS } from './types';

export const MAX_NAME_LENGTH = 120;

export type ProductError =
  | { code: 'nameRequired' }
  | { code: 'nameTooLong' }
  | { code: 'badUnit' }
  | { code: 'duplicateSku'; otherProductId: string }
  | { code: 'duplicateBarcode'; barcode: string; otherProductId: string }
  | { code: 'duplicateBarcodeInProduct'; barcode: string }
  | { code: 'badBarcode'; barcode: string }
  | { code: 'badUnitsPerBarcode'; barcode: string }
  | { code: 'badCost' }
  | { code: 'badPrice' }
  | { code: 'badReorderLevel' }
  | { code: 'badTarget' }
  | { code: 'badPackQuantity' }
  | { code: 'familyIdChanged' };

function badMoney(v: number | undefined): boolean {
  return v !== undefined && !(typeof v === 'number' && Number.isFinite(v) && v >= 0);
}

export function validateBarcodeEntry(b: Pick<ProductBarcode, 'code' | 'role' | 'unitsPerBarcode'>): ProductError | null {
  if (!isAcceptableBarcode(b.code)) return { code: 'badBarcode', barcode: b.code };
  if (b.role === 'single' && b.unitsPerBarcode !== 1) return { code: 'badUnitsPerBarcode', barcode: b.code };
  if (!(Number.isFinite(b.unitsPerBarcode) && b.unitsPerBarcode > 0)) return { code: 'badUnitsPerBarcode', barcode: b.code };
  return null;
}

/** Validate a candidate against the rest of the catalogue. `previous` is the stored version when editing. */
export function validateProduct(all: readonly Product[], candidate: Product, previous?: Product): ProductError[] {
  const errors: ProductError[] = [];
  const name = candidate.name.trim();
  if (!name) errors.push({ code: 'nameRequired' });
  else if (name.length > MAX_NAME_LENGTH) errors.push({ code: 'nameTooLong' });
  if (!COUNT_UNITS.includes(candidate.countUnit)) errors.push({ code: 'badUnit' });
  if (previous && previous.familyProductId !== candidate.familyProductId) errors.push({ code: 'familyIdChanged' });
  if (badMoney(candidate.costPrice)) errors.push({ code: 'badCost' });
  if (badMoney(candidate.sellingPrice)) errors.push({ code: 'badPrice' });
  if (candidate.reorderLevel !== undefined && !isValidQuantity(candidate.reorderLevel, 'kg')) errors.push({ code: 'badReorderLevel' });
  if (candidate.targetStock !== undefined && !isValidQuantity(candidate.targetStock, 'kg')) errors.push({ code: 'badTarget' });
  for (const q of [candidate.caseQuantity, candidate.packQuantity]) {
    if (q !== undefined && !(Number.isInteger(q) && q > 0)) { errors.push({ code: 'badPackQuantity' }); break; }
  }

  // Only an ACTIVE product claims its SKU / codes.
  if (candidate.status === 'active') {
    const others = buildCatalogIndex(all.filter(p => p.id !== candidate.id));
    const sku = normalizeSku(candidate.sku);
    if (sku) {
      const other = others.bySku.get(sku);
      if (other) errors.push({ code: 'duplicateSku', otherProductId: other });
    }
    const seen = new Set<string>();
    for (const b of candidate.barcodes) {
      const bad = validateBarcodeEntry(b);
      if (bad) { errors.push(bad); continue; }
      const norm = normalizeBarcode(b.code, b.symbology);
      if (seen.has(norm)) { errors.push({ code: 'duplicateBarcodeInProduct', barcode: b.code }); continue; }
      seen.add(norm);
      const other = others.byBarcode.get(norm);
      if (other) errors.push({ code: 'duplicateBarcode', barcode: b.code, otherProductId: other });
    }
  } else {
    for (const b of candidate.barcodes) {
      const bad = validateBarcodeEntry(b);
      if (bad) errors.push(bad);
    }
  }
  return errors;
}

/** Named records (category / supplier / location): non-empty, unique case-insensitively among active ones. */
export type NamedRecordError = 'nameRequired' | 'nameTooLong' | 'duplicateName';

export function validateNamedRecord(
  all: readonly { id: string; name: string; status: string }[],
  candidate: { id: string; name: string; status: string },
): NamedRecordError | null {
  const name = candidate.name.trim();
  if (!name) return 'nameRequired';
  if (name.length > MAX_NAME_LENGTH) return 'nameTooLong';
  if (candidate.status !== 'active') return null;
  const key = normalizeName(name);
  if (all.some(r => r.id !== candidate.id && r.status === 'active' && normalizeName(r.name) === key)) return 'duplicateName';
  return null;
}

export function makeBarcode(id: string, code: string, role: ProductBarcode['role'], unitsPerBarcode: number, symbology?: string): ProductBarcode {
  const trimmed = code.trim();
  return {
    id,
    code: trimmed,
    normalizedCode: normalizeBarcode(trimmed, symbology),
    ...(symbology && symbology !== 'unknown' ? { symbology } : {}),
    role,
    unitsPerBarcode: role === 'single' ? 1 : unitsPerBarcode,
  };
}
