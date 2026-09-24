/**
 * catalogIndex.ts — O(1) lookups over the product catalogue (handoff §23):
 * id → product, normalised barcode → product, SKU → product, plus membership
 * lists and a lower-cased search key per product. Built once per catalogue
 * change, never inside a render loop.
 */
import { normalizeBarcode } from './barcode';
import type { Product } from './types';

export interface CatalogIndex {
  byId: Map<string, Product>;
  /** Normalised barcode → ACTIVE product id. */
  byBarcode: Map<string, string>;
  /** Normalised barcode → ARCHIVED product id (for "belongs to an archived product" messages). */
  archivedByBarcode: Map<string, string>;
  /** Normalised SKU → ACTIVE product id. */
  bySku: Map<string, string>;
  byCategory: Map<string, string[]>;
  bySupplier: Map<string, string[]>;
  byLocation: Map<string, string[]>;
  activeIds: string[];
  searchKeys: Map<string, string>;
}

export function normalizeSku(sku: string | undefined | null): string {
  return String(sku ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function normalizeName(name: string | undefined | null): string {
  return String(name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function push(map: Map<string, string[]>, key: string | undefined, id: string): void {
  if (!key) return;
  const list = map.get(key);
  if (list) list.push(id); else map.set(key, [id]);
}

export function buildCatalogIndex(products: readonly Product[]): CatalogIndex {
  const idx: CatalogIndex = {
    byId: new Map(), byBarcode: new Map(), archivedByBarcode: new Map(), bySku: new Map(),
    byCategory: new Map(), bySupplier: new Map(), byLocation: new Map(), activeIds: [], searchKeys: new Map(),
  };
  const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  for (const p of sorted) {
    idx.byId.set(p.id, p);
    const codes = p.barcodes.map(b => b.normalizedCode || normalizeBarcode(b.code)).filter(Boolean);
    if (p.status !== 'active') {
      for (const c of codes) if (!idx.archivedByBarcode.has(c)) idx.archivedByBarcode.set(c, p.id);
      continue;
    }
    idx.activeIds.push(p.id);
    for (const c of codes) if (!idx.byBarcode.has(c)) idx.byBarcode.set(c, p.id);
    const sku = normalizeSku(p.sku);
    if (sku && !idx.bySku.has(sku)) idx.bySku.set(sku, p.id);
    push(idx.byCategory, p.categoryId, p.id);
    push(idx.bySupplier, p.supplierId, p.id);
    push(idx.byLocation, p.locationId, p.id);
    idx.searchKeys.set(p.id, [normalizeName(p.name), normalizeSku(p.sku), ...codes, ...p.barcodes.map(b => b.code.toLowerCase())].join(' '));
  }
  return idx;
}

export function findActiveByBarcode(idx: CatalogIndex, code: string, symbology?: string): Product | null {
  const id = idx.byBarcode.get(normalizeBarcode(code, symbology));
  return id ? idx.byId.get(id) ?? null : null;
}

export function findActiveBySku(idx: CatalogIndex, sku: string): Product | null {
  const id = idx.bySku.get(normalizeSku(sku));
  return id ? idx.byId.get(id) ?? null : null;
}

export interface ProductFilters {
  categoryId?: string;
  supplierId?: string;
  locationId?: string;
  includeArchived?: boolean;
}

/** Search by name, SKU or barcode (typed or normalised). Active only unless asked. Sorted by name. */
export function searchProducts(idx: CatalogIndex, query: string, filters: ProductFilters = {}): Product[] {
  const q = normalizeName(query);
  const qCode = normalizeBarcode(query);
  let ids: string[];
  if (filters.includeArchived) {
    ids = [...idx.byId.values()].sort((a, b) => a.name.localeCompare(b.name)).map(p => p.id);
  } else if (filters.categoryId) ids = idx.byCategory.get(filters.categoryId) ?? [];
  else if (filters.supplierId) ids = idx.bySupplier.get(filters.supplierId) ?? [];
  else if (filters.locationId) ids = idx.byLocation.get(filters.locationId) ?? [];
  else ids = idx.activeIds;
  const out: Product[] = [];
  for (const id of ids) {
    const p = idx.byId.get(id);
    if (!p) continue;
    if (filters.categoryId && p.categoryId !== filters.categoryId) continue;
    if (filters.supplierId && p.supplierId !== filters.supplierId) continue;
    if (filters.locationId && p.locationId !== filters.locationId) continue;
    if (q) {
      const key = idx.searchKeys.get(id) ?? [normalizeName(p.name), normalizeSku(p.sku), ...p.barcodes.map(b => b.normalizedCode)].join(' ');
      if (!key.includes(q) && !(qCode && key.includes(qCode))) continue;
    }
    out.push(p);
  }
  return out;
}
