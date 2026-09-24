/**
 * reorderEngine.ts — THE reorder formula (handoff §10). Nothing else computes a
 * reorder status or suggested order.
 *
 *   no valid latest count            → 'not-counted'
 *   quantity == 0                     → 'out'
 *   reorderLevel set && qty <= level  → 'low'
 *   otherwise                         → 'ok'
 *
 *   suggestedOrder = targetStock == null || latestCount == null ? null : max(target − latest, 0)
 *
 * No forecasting, no negative orders, no rounding of measured units beyond the
 * 3-decimal storage precision.
 */
import { roundForUnit } from './quantity';
import type { Product, ProductCountSnapshot, Supplier } from './types';

export type ReorderStatus = 'not-counted' | 'out' | 'low' | 'ok';

export interface ReorderLine {
  product: Product;
  status: ReorderStatus;
  latestQuantity: number | null;
  countedAt: string | null;
  suggestedOrder: number | null;
}

function validQty(snapshot: ProductCountSnapshot | undefined): number | null {
  if (!snapshot) return null;
  const q = snapshot.quantityBase;
  return typeof q === 'number' && Number.isFinite(q) && q >= 0 ? q : null;
}

function validLevel(v: number | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
}

export function reorderStatus(latest: number | null, reorderLevel: number | undefined): ReorderStatus {
  if (latest === null) return 'not-counted';
  if (latest === 0) return 'out';
  const level = validLevel(reorderLevel);
  if (level !== null && latest <= level) return 'low';
  return 'ok';
}

export function suggestedOrder(latest: number | null, targetStock: number | undefined, unit: Product['countUnit']): number | null {
  const target = validLevel(targetStock);
  if (target === null || latest === null) return null;
  return roundForUnit(Math.max(target - latest, 0), unit);
}

export function reorderLine(product: Product, snapshot: ProductCountSnapshot | undefined): ReorderLine {
  const latest = validQty(snapshot);
  return {
    product,
    status: reorderStatus(latest, product.reorderLevel),
    latestQuantity: latest,
    countedAt: latest === null ? null : snapshot!.countedAt,
    suggestedOrder: suggestedOrder(latest, product.targetStock, product.countUnit),
  };
}

export function reorderLines(products: readonly Product[], snapshots: Readonly<Record<string, ProductCountSnapshot>>): ReorderLine[] {
  return products.filter(p => p.status === 'active').map(p => reorderLine(p, snapshots[p.id]));
}

/** Lines that need attention: out and low (plus not-counted when the setting asks for it). */
export function needsReorder(line: ReorderLine, includeNotCounted = false): boolean {
  return line.status === 'out' || line.status === 'low' || (includeNotCounted && line.status === 'not-counted');
}

export interface SupplierGroup {
  supplierId: string | null;
  supplierName: string | null;
  lines: ReorderLine[];
}

const STATUS_ORDER: Record<ReorderStatus, number> = { out: 0, low: 1, 'not-counted': 2, ok: 3 };

/** Group by supplier (name order); products with no / unknown supplier go last under "No supplier". */
export function groupBySupplier(lines: readonly ReorderLine[], suppliers: ReadonlyMap<string, Supplier>): SupplierGroup[] {
  const groups = new Map<string, SupplierGroup>();
  const none: SupplierGroup = { supplierId: null, supplierName: null, lines: [] };
  for (const line of lines) {
    const sid = line.product.supplierId;
    const sup = sid ? suppliers.get(sid) : undefined;
    if (!sup) { none.lines.push(line); continue; }
    let g = groups.get(sup.id);
    if (!g) { g = { supplierId: sup.id, supplierName: sup.name, lines: [] }; groups.set(sup.id, g); }
    g.lines.push(line);
  }
  const sortLines = (ls: ReorderLine[]) => ls.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.product.name.localeCompare(b.product.name));
  const out = [...groups.values()].sort((a, b) => (a.supplierName ?? '').localeCompare(b.supplierName ?? ''));
  out.forEach(g => sortLines(g.lines));
  if (none.lines.length) { sortLines(none.lines); out.push(none); }
  return out;
}

export function reorderSummary(lines: readonly ReorderLine[]): { out: number; low: number; notCounted: number; ok: number } {
  const s = { out: 0, low: 0, notCounted: 0, ok: 0 };
  for (const l of lines) {
    if (l.status === 'out') s.out++;
    else if (l.status === 'low') s.low++;
    else if (l.status === 'not-counted') s.notCounted++;
    else s.ok++;
  }
  return s;
}
