import { groupBySupplier, needsReorder, reorderLine, reorderLines, reorderStatus, reorderSummary, suggestedOrder } from '../reorderEngine';
import type { ProductCountSnapshot, Supplier } from '../types';
import { named, product, T0 } from './fixtures';

const snap = (productId: string, quantityBase: number): ProductCountSnapshot => ({ productId, quantityBase, countedAt: T0, countSessionId: 's' });

describe('reorder status', () => {
  it('follows the authoritative rule', () => {
    expect(reorderStatus(null, 5)).toBe('not-counted');
    expect(reorderStatus(0, 5)).toBe('out');
    expect(reorderStatus(0, undefined)).toBe('out');
    expect(reorderStatus(5, 5)).toBe('low');
    expect(reorderStatus(4, 5)).toBe('low');
    expect(reorderStatus(6, 5)).toBe('ok');
    expect(reorderStatus(3, undefined)).toBe('ok');
    expect(reorderStatus(0.5, 0.5)).toBe('low');
    expect(reorderStatus(1, 0)).toBe('ok');
  });
});

describe('suggested order', () => {
  it('= max(target − latest, 0), never negative, null without target or count', () => {
    expect(suggestedOrder(3, 24, 'each')).toBe(21);
    expect(suggestedOrder(30, 24, 'each')).toBe(0);
    expect(suggestedOrder(null, 24, 'each')).toBeNull();
    expect(suggestedOrder(3, undefined, 'each')).toBeNull();
    expect(suggestedOrder(0, 0, 'each')).toBe(0);
  });
  it('keeps measured decimals without drift or rounding to whole units', () => {
    expect(suggestedOrder(1.2, 5, 'kg')).toBe(3.8);
    expect(suggestedOrder(0.1, 0.3, 'l')).toBe(0.2);
  });
  it('treats invalid snapshots as not counted', () => {
    const p = product({ id: 'x', name: 'X', reorderLevel: 2, targetStock: 10 });
    expect(reorderLine(p, { ...snap('x', NaN) }).status).toBe('not-counted');
    expect(reorderLine(p, { ...snap('x', -1) }).status).toBe('not-counted');
    expect(reorderLine(p, snap('x', 2))).toMatchObject({ status: 'low', latestQuantity: 2, suggestedOrder: 8 });
  });
});

describe('grouping', () => {
  const suppliers = new Map<string, Supplier>([['b', named<Supplier>('b', 'Booker')], ['a', named<Supplier>('a', 'Accent')]]);
  const products = [
    product({ id: 'p1', name: 'Zeta', supplierId: 'b', reorderLevel: 5 }),
    product({ id: 'p2', name: 'Alpha', supplierId: 'b', reorderLevel: 5 }),
    product({ id: 'p3', name: 'Beta', supplierId: 'a' }),
    product({ id: 'p4', name: 'NoSup' }),
    product({ id: 'p5', name: 'Ghost supplier', supplierId: 'deleted' }),
    product({ id: 'p6', name: 'Archived', status: 'archived', supplierId: 'b' }),
  ];
  const snaps = { p1: snap('p1', 0), p2: snap('p2', 3), p3: snap('p3', 0), p4: snap('p4', 1), p6: snap('p6', 0) };
  const lines = reorderLines(products, snaps);

  it('ignores archived products', () => {
    expect(lines.map(l => l.product.id)).not.toContain('p6');
  });
  it('groups by supplier name, no-supplier last, out before low', () => {
    const groups = groupBySupplier(lines, suppliers);
    expect(groups.map(g => g.supplierName)).toEqual(['Accent', 'Booker', null]);
    expect(groups[1].lines.map(l => l.product.id)).toEqual(['p1', 'p2']);
    expect(groups[2].lines.map(l => l.product.id).sort()).toEqual(['p4', 'p5']);
  });
  it('summary and needs-reorder', () => {
    expect(reorderSummary(lines)).toEqual({ out: 2, low: 1, notCounted: 1, ok: 1 });
    expect(lines.filter(l => needsReorder(l)).length).toBe(3);
    expect(lines.filter(l => needsReorder(l, true)).length).toBe(4);
  });
});
