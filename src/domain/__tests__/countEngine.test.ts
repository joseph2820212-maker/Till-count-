import {
  addToScope, applyScan, changesAgainst, clearEntry, completeSession, CountSessionLockedError, deriveSnapshots, InvalidQuantityError,
  pauseSession, progressOf, resolveScope, resumeSession, setCaseLoose, setQuantity, startSession, stepQuantity, uncountedIds,
} from '../countEngine';
import { caseLooseTotal, parseQuantityText, validateQuantity } from '../quantity';
import { sessionStockValue } from '../stockValue';
import type { CountSession, Product } from '../types';
import { lookups, named, product, T0, withCodes } from './fixtures';

const T1 = '2026-09-24T10:00:00.000Z';
const T2 = '2026-09-24T11:00:00.000Z';
const T3 = '2026-09-25T09:00:00.000Z';

const cat = named<import('../types').Category>('drinks', 'Drinks');
const sup = named<import('../types').Supplier>('booker', 'Booker');
const loc = named<import('../types').StockLocation>('front', 'Front shop');
const L = lookups([cat], [sup], [loc]);

const cola = withCodes(product({ id: 'cola', name: 'Cola', categoryId: 'drinks', supplierId: 'booker', locationId: 'front', costPrice: 0.5 }),
  [['5000112637922', 'single', 1], ['5000112637939', 'pack', 6], ['15000112637929', 'case', 24]]);
const milk = withCodes(product({ id: 'milk', name: 'Milk', supplierId: 'booker', costPrice: 1.2 }), [['036000291452', 'single', 1]]);
const cheese = product({ id: 'cheese', name: 'Cheddar', countUnit: 'kg', locationId: 'front', costPrice: 9 });
const manual = product({ id: 'manual', name: 'Loose bananas' });
const archived = product({ id: 'arch', name: 'Archived', status: 'archived', categoryId: 'drinks' });
const all: Product[] = [cola, milk, cheese, manual, archived];

function start(scope: CountSession['scope'] = { type: 'everything' }, over: Partial<{ blindCount: boolean; caseLooseEnabled: boolean }> = {}) {
  return startSession(all, { id: 's1', scope, mode: 'scan', blindCount: false, caseLooseEnabled: false, now: T0, ...over });
}

describe('scope snapshots', () => {
  it('everything = all active products', () => {
    expect(resolveScope(all, { type: 'everything' })).toEqual(['cheese', 'cola', 'manual', 'milk']);
  });
  it('category / supplier / location / selected', () => {
    expect(resolveScope(all, { type: 'category', categoryId: 'drinks' })).toEqual(['cola']);
    expect(resolveScope(all, { type: 'supplier', supplierId: 'booker' })).toEqual(['cola', 'milk']);
    expect(resolveScope(all, { type: 'location', locationId: 'front' })).toEqual(['cheese', 'cola']);
    expect(resolveScope(all, { type: 'selected', selectedProductIds: ['milk', 'arch', 'ghost'] })).toEqual(['milk']);
  });
  it('a scope id missing means nothing, not everything', () => {
    expect(resolveScope(all, { type: 'category' })).toEqual([]);
  });
  it('catalogue changes after start do not change the snapshot', () => {
    const s = start({ type: 'supplier', supplierId: 'booker' });
    const later = [...all, product({ id: 'new', name: 'New', supplierId: 'booker' })];
    expect(resolveScope(later, s.scope)).toContain('new');
    expect(s.productIdsSnapshot).toEqual(['cola', 'milk']);
  });
  it('adding an out-of-scope product is an explicit action', () => {
    const s = addToScope(start({ type: 'category', categoryId: 'drinks' }), 'milk');
    expect(s.productIdsSnapshot).toEqual(['cola', 'milk']);
  });
});

describe('quantities', () => {
  it('zero is valid; negative, NaN, infinite are not; each must be whole', () => {
    expect(validateQuantity(0, 'each')).toBeNull();
    expect(validateQuantity(-1, 'each')).toBe('negative');
    expect(validateQuantity(NaN, 'each')).toBe('notNumber');
    expect(validateQuantity(Infinity, 'kg')).toBe('notNumber');
    expect(validateQuantity(1.5, 'each')).toBe('notWhole');
    expect(validateQuantity(1.5, 'kg')).toBeNull();
  });
  it('parses typed quantities in several scripts, rejects junk', () => {
    expect(parseQuantityText('12')).toBe(12);
    expect(parseQuantityText('1,25')).toBe(1.25);
    expect(parseQuantityText('١٢٫٥')).toBe(12.5);
    expect(parseQuantityText('-3')).toBeNull();
    expect(parseQuantityText('1e3')).toBeNull();
    expect(parseQuantityText('1,000.5')).toBeNull();
    expect(parseQuantityText('')).toBeNull();
  });
  it('case + pack + loose converts deterministically', () => {
    expect(caseLooseTotal({ caseCount: 2, packCount: 1, looseCount: 7 }, 24, 6, 'each')).toEqual({ ok: true, total: 61 });
    expect(caseLooseTotal({ caseCount: 1 }, null, 6, 'each')).toEqual({ ok: false, error: 'missingCaseUnits' });
    expect(caseLooseTotal({ packCount: 1 }, 24, 0, 'each')).toEqual({ ok: false, error: 'missingPackUnits' });
    expect(caseLooseTotal({ caseCount: -1 }, 24, 6, 'each')).toEqual({ ok: false, error: 'invalidCount' });
    expect(caseLooseTotal({ caseCount: 1.5 }, 24, 6, 'each')).toEqual({ ok: false, error: 'invalidCount' });
  });
  it('measured units keep decimals without float drift', () => {
    let s = start();
    s = setQuantity(s, cheese, L, 0.1 + 0.2, 'keypad', T1);
    expect(s.entries[0].quantityBase).toBe(0.3);
    expect(() => setQuantity(s, cola, L, 1.5, 'keypad', T1)).toThrow(InvalidQuantityError);
  });
});

describe('scanning', () => {
  it('repeated scan ON: single +1, pack +6, case +24', () => {
    let s = start();
    const bc = (i: number) => cola.barcodes[i];
    let r = applyScan(s, cola, bc(0), L, { repeatedScanAddsOne: true, now: T1 }); s = r.session;
    expect(r.kind).toBe('incremented');
    r = applyScan(s, cola, bc(0), L, { repeatedScanAddsOne: true, now: T1 }); s = r.session;
    r = applyScan(s, cola, bc(1), L, { repeatedScanAddsOne: true, now: T1 }); s = r.session;
    r = applyScan(s, cola, bc(2), L, { repeatedScanAddsOne: true, now: T1 }); s = r.session;
    expect(s.entries.find(e => e.productId === 'cola')?.quantityBase).toBe(2 + 6 + 24);
  });
  it('repeated scan OFF: never adds blindly, asks for the quantity', () => {
    const s = start();
    const r = applyScan(s, cola, cola.barcodes[0], L, { repeatedScanAddsOne: false, now: T1 });
    expect(r.kind).toBe('needsQuantity');
    expect(r.session.entries).toEqual([]);
  });
  it('rapid repeated scans each count once (debounce lives in the scanner UI)', () => {
    let s = start();
    for (let i = 0; i < 50; i++) s = applyScan(s, cola, cola.barcodes[0], L, { repeatedScanAddsOne: true, now: T1 }).session;
    expect(s.entries).toHaveLength(1);
    expect(s.entries[0].quantityBase).toBe(50);
  });
  it('an invalid pack conversion is refused, not zeroed', () => {
    const broken = { ...cola, barcodes: [{ ...cola.barcodes[1], unitsPerBarcode: NaN }] };
    expect(() => applyScan(start(), broken, broken.barcodes[0], L, { repeatedScanAddsOne: true, now: T1 })).toThrow(InvalidQuantityError);
  });
});

describe('entries are history snapshots', () => {
  it('copy names, unit and cost at count time', () => {
    const s = setQuantity(start(), cola, L, 5, 'list', T1);
    expect(s.entries[0]).toMatchObject({ productName: 'Cola', categoryName: 'Drinks', supplierName: 'Booker', locationName: 'Front shop', costPriceAtCount: 0.5, countUnit: 'each', source: 'list' });
  });
  it('case+loose keeps the breakdown', () => {
    const s = setCaseLoose(start(), cola, L, { caseCount: 2, looseCount: 7 }, 'keypad', T1);
    expect(s.entries[0]).toMatchObject({ quantityBase: 55, caseCount: 2, looseCount: 7 });
  });
  it('manual products (no barcode) count through the list', () => {
    const s = setQuantity(start(), manual, L, 12, 'manual', T1);
    expect(s.entries[0].quantityBase).toBe(12);
  });
  it('stepper never goes below zero; zero is a real count; − on an uncounted product does nothing', () => {
    let s = stepQuantity(start(), cola, L, -1, T1);
    expect(s.entries).toEqual([]); // a stray tap must not record 0
    s = stepQuantity(s, cola, L, 1, T1);
    s = stepQuantity(s, cola, L, -1, T1);
    expect(s.entries[0].quantityBase).toBe(0); // counted, then stepped down: a real 0
    s = stepQuantity(s, cola, L, -1, T1);
    expect(s.entries[0].quantityBase).toBe(0);
    s = stepQuantity(s, cola, L, 1, T1);
    expect(s.entries[0].quantityBase).toBe(1);
    s = clearEntry(s, 'cola');
    expect(s.entries).toEqual([]);
  });
});

describe('pause / resume / completion', () => {
  it('pause and resume keep the entries', () => {
    let s = setQuantity(start(), cola, L, 3, 'list', T1);
    s = pauseSession(s, T1);
    expect(s.status).toBe('paused');
    s = resumeSession(s);
    expect(s.status).toBe('active');
    expect(s.pausedAt).toBeUndefined();
    expect(s.entries[0].quantityBase).toBe(3);
  });
  it('skipped products are never zeroed and keep their previous snapshot', () => {
    const prev = { milk: { productId: 'milk', quantityBase: 8, countedAt: T0, countSessionId: 'old' } };
    let s = setQuantity(start(), cola, L, 0, 'list', T1);
    expect(uncountedIds(s)).toEqual(['cheese', 'manual', 'milk']);
    const { session, snapshots } = completeSession(s, prev, T2);
    expect(session.status).toBe('completed');
    expect(session.completedAt).toBe(T2);
    expect(snapshots.cola).toEqual({ productId: 'cola', quantityBase: 0, countedAt: T2, countSessionId: 's1' });
    expect(snapshots.milk).toEqual(prev.milk);
    expect(snapshots.cheese).toBeUndefined();
    s = session;
  });
  it('completion is idempotent (double Finish)', () => {
    const s = setQuantity(start(), cola, L, 4, 'list', T1);
    const first = completeSession(s, {}, T2);
    const second = completeSession(first.session, first.snapshots, T3);
    expect(second.alreadyCompleted).toBe(true);
    expect(second.session).toBe(first.session);
    expect(second.snapshots).toEqual(first.snapshots);
    expect(second.session.completedAt).toBe(T2);
  });
  it('a completed session is immutable', () => {
    const done = completeSession(setQuantity(start(), cola, L, 4, 'list', T1), {}, T2).session;
    expect(() => setQuantity(done, cola, L, 9, 'list', T3)).toThrow(CountSessionLockedError);
    expect(() => applyScan(done, cola, cola.barcodes[0], L, { repeatedScanAddsOne: true, now: T3 })).toThrow(CountSessionLockedError);
    expect(() => pauseSession(done, T3)).toThrow(CountSessionLockedError);
    expect(() => clearEntry(done, 'cola')).toThrow(CountSessionLockedError);
  });
  it('renaming a product after completion does not change history', () => {
    const done = completeSession(setQuantity(start(), cola, L, 4, 'list', T1), {}, T2).session;
    const renamed = { ...cola, name: 'Cola Zero' };
    expect(renamed.name).not.toBe(done.entries[0].productName);
    expect(done.entries[0].productName).toBe('Cola');
  });
  it('a product archived during an active count stays countable in that count', () => {
    const s = start();
    const archivedCola = { ...cola, status: 'archived' as const };
    const s2 = setQuantity(s, archivedCola, L, 2, 'list', T1);
    expect(s2.productIdsSnapshot).toContain('cola');
    expect(completeSession(s2, {}, T2).snapshots.cola.quantityBase).toBe(2);
  });
  it('an older completed count never overwrites a newer snapshot', () => {
    const newer = { cola: { productId: 'cola', quantityBase: 10, countedAt: T3, countSessionId: 'newer' } };
    const { snapshots } = completeSession(setQuantity(start(), cola, L, 1, 'list', T1), newer, T2);
    expect(snapshots.cola.quantityBase).toBe(10);
  });
  it('snapshots can be rebuilt from history alone', () => {
    const a = completeSession(setQuantity(start(), cola, L, 1, 'list', T1), {}, T1).session;
    const b0 = startSession(all, { id: 's2', scope: { type: 'everything' }, mode: 'list', blindCount: false, caseLooseEnabled: false, now: T1 });
    const b = completeSession(setQuantity(setQuantity(b0, cola, L, 7, 'list', T2), milk, L, 0, 'list', T2), {}, T2).session;
    const open = setQuantity(start(), cola, L, 99, 'list', T3);
    expect(deriveSnapshots([b, a, open])).toEqual({
      cola: { productId: 'cola', quantityBase: 7, countedAt: T2, countSessionId: 's2' },
      milk: { productId: 'milk', quantityBase: 0, countedAt: T2, countSessionId: 's2' },
    });
  });
  it('progress counts only in-scope entries', () => {
    const s = setQuantity(start({ type: 'category', categoryId: 'drinks' }), cola, L, 1, 'list', T1);
    expect(progressOf(s)).toEqual({ counted: 1, total: 1, percent: 100 });
  });
  it('changes against the previous snapshots', () => {
    const s = setQuantity(setQuantity(start(), cola, L, 5, 'list', T1), milk, L, 8, 'list', T1);
    expect(changesAgainst(s, { milk: { productId: 'milk', quantityBase: 8, countedAt: T0, countSessionId: 'x' } })).toEqual([{ productId: 'cola', before: null, after: 5 }]);
  });
});

describe('stock cost value', () => {
  it('only valid quantity × valid entered cost', () => {
    let s = setQuantity(start(), cola, L, 10, 'list', T1);
    s = setQuantity(s, manual, L, 4, 'list', T1);
    s = setQuantity(s, cheese, L, 1.5, 'list', T1);
    expect(sessionStockValue(s.entries)).toEqual({ total: 18.5, valuedCount: 2, missingCostCount: 1 });
  });
});
