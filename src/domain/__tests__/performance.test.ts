/**
 * Performance (handoff §23): a 2,000-product shop is the target, 5,000 the stress case.
 * Budgets are deliberately loose (CI machines vary); they catch accidental O(n²) work,
 * which at these sizes costs seconds, not milliseconds.
 */
import { buildCatalogIndex, findActiveByBarcode, searchProducts } from '../catalogIndex';
import { completeSession, setQuantity, startSession, uncountedIds } from '../countEngine';
import { groupBySupplier, reorderLines, reorderSummary } from '../reorderEngine';
import type { Product, ProductCountSnapshot } from '../types';
import { lookups, named, product, T0, withCodes } from './fixtures';

function ean13(n: number): string {
  const body = String(5000000000000 + n * 7).slice(0, 12);
  const sum = body.split('').reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0);
  return body + ((10 - (sum % 10)) % 10);
}

function catalogue(size: number): Product[] {
  return Array.from({ length: size }, (_, i) => withCodes(
    product({ name: `Product ${i} ${['cola', 'crisps', 'milk', 'bread'][i % 4]}`, supplierId: `s${i % 12}`, categoryId: `c${i % 20}`, reorderLevel: 5, targetStock: 20 }),
    [[ean13(i), 'single', 1]],
  ));
}

function ms(fn: () => void): number {
  const t = performance.now();
  fn();
  return performance.now() - t;
}

describe.each([2000, 5000])('%i products', size => {
  const products = catalogue(size);
  const lk = lookups([], Array.from({ length: 12 }, (_, i) => named(`s${i}`, `Supplier ${i}`)));

  it('index, barcode lookup and search stay fast', () => {
    let idx = buildCatalogIndex(products);
    expect(ms(() => { idx = buildCatalogIndex(products); })).toBeLessThan(size <= 2000 ? 250 : 600);
    expect(ms(() => { for (let i = 0; i < 500; i++) expect(findActiveByBarcode(idx, ean13(i * 3))).not.toBeNull(); })).toBeLessThan(150);
    let hits: Product[] = [];
    expect(ms(() => { hits = searchProducts(idx, 'milk'); })).toBeLessThan(150);
    expect(hits.length).toBe(size / 4);
  });

  it('a full count of every product (entry by entry) and its completion stay fast', () => {
    let session = startSession(products, { id: 'perf', scope: { type: 'everything' }, mode: 'list', blindCount: false, caseLooseEnabled: false, now: T0 });
    const took = ms(() => { for (const p of products) session = setQuantity(session, p, lk, 3, 'manual', T0); });
    expect(took).toBeLessThan(size <= 2000 ? 3000 : 12000);
    expect(uncountedIds(session)).toEqual([]);
    let snaps: Record<string, ProductCountSnapshot> = {};
    expect(ms(() => { snaps = completeSession(session, {}, T0).snapshots; })).toBeLessThan(500);
    expect(Object.keys(snaps)).toHaveLength(size);
  });

  it('reorder list, summary and supplier groups stay fast', () => {
    const snaps: Record<string, ProductCountSnapshot> = Object.fromEntries(products.map((p, i) => [p.id, { productId: p.id, quantityBase: i % 30, countedAt: T0, countSessionId: 'perf' }]));
    expect(ms(() => {
      const lines = reorderLines(products, snaps);
      reorderSummary(lines);
      groupBySupplier(lines, lk.suppliers);
    })).toBeLessThan(size <= 2000 ? 300 : 800);
  });
});
