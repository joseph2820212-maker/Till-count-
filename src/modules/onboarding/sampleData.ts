/**
 * sampleData.ts — the optional review fixture (handoff §30). Every record carries
 * `isSample: true` and a `sample_` id, is never mixed silently with real data (loading
 * is refused when real products exist) and is removed in one transaction by
 * removeSampleData(). Includes barcode and manual products, several categories /
 * suppliers / locations, pack and case codes, low / out / no-target / measured items,
 * one completed count and one favourite.
 */
import { ean13CheckDigit } from '../../domain/barcode';
import { applyCompletedToSnapshots } from '../../domain/countEngine';
import { makeBarcode } from '../../domain/productRules';
import type { Category, CountEntry, CountSession, FavouriteCount, Product, StockLocation, Supplier } from '../../domain/types';
import { KEYS, countEntriesKey } from '../../storage/keys';
import type { TxOp } from '../../storage/kv';
import { commitMany, getState, headerOf } from '../../state/store';

function ean(prefix12: string): string { return prefix12 + ean13CheckDigit(prefix12); }

const at = (daysAgo: number, hour = 10) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(hour, 0, 0, 0); return d.toISOString(); };

type Spec = [name: string, cat: string, sup: string | null, loc: string, unit: Product['countUnit'], cost: number, price: number, level: number | null, target: number | null, counted: number | null, codeSeq: number | null, caseUnits?: number | null, packUnits?: number];

const SPECS: Spec[] = [
  ['Coca-Cola Original 500ml', 'drinks', 'booker', 'front', 'each', 0.62, 1.49, 6, 24, 14, 1, 24, 6],
  ['Coca-Cola Zero 500ml', 'drinks', 'booker', 'front', 'each', 0.6, 1.49, 6, 24, 0, 2, 24],
  ['Pepsi Max 500ml', 'drinks', 'bestway', 'front', 'each', 0.55, 1.39, 6, 24, 8, 3, 24],
  ['Fanta Orange 500ml', 'drinks', 'booker', 'front', 'each', 0.55, 1.39, 6, 18, 4, 4, 24],
  ['Still water 1.5L', 'drinks', 'bestway', 'stock', 'each', 0.3, 0.89, 12, 36, 40, 5, 6],
  ['Red Bull 250ml', 'drinks', 'bestway', 'fridge', 'each', 0.95, 1.85, 8, 24, 11, 6, 24],
  ['Semi-skimmed milk 2L', 'chilled', 'dairy', 'fridge', 'each', 1.1, 1.85, 4, 10, 2, 7],
  ['Whole milk 1L', 'chilled', 'dairy', 'fridge', 'each', 0.7, 1.2, 4, 12, 7, 8],
  ['Mature Cheddar (loose)', 'chilled', 'dairy', 'fridge', 'kg', 7.5, 12.9, 1, 4, 1.25, null],
  ['Butter 250g', 'chilled', 'dairy', 'fridge', 'each', 1.6, 2.49, 3, 10, 0, 9],
  ['Free-range eggs 6', 'chilled', 'dairy', 'fridge', 'each', 1.2, 2.1, 4, 12, 9, 10],
  ['Granulated sugar 1kg', 'grocery', 'booker', 'stock', 'each', 0.85, 1.39, 4, 12, 3, 11, 12],
  ['Plain flour 1.5kg', 'grocery', 'booker', 'stock', 'each', 0.7, 1.19, 3, 10, 6, 12],
  ['Basmati rice 1kg', 'grocery', 'bestway', 'stock', 'each', 1.2, 2.29, 3, 8, 5, 13],
  ['Baked beans 415g', 'grocery', 'booker', 'front', 'each', 0.45, 0.95, 6, 24, 20, 14, 24],
  ['Chopped tomatoes 400g', 'grocery', 'booker', 'front', 'each', 0.4, 0.85, 6, null, 12, 15],
  ['Sunflower oil 1L', 'grocery', 'bestway', 'stock', 'each', 1.3, 2.35, 2, 6, 1, 16],
  ['Loose bananas', 'grocery', null, 'front', 'kg', 0.6, 0.99, null, null, 3.4, null],
  ['Walkers Cheese & Onion', 'snacks', 'booker', 'front', 'each', 0.55, 1.25, 6, 18, 6, 17, 32],
  ['Walkers Ready Salted', 'snacks', 'booker', 'front', 'each', 0.55, 1.25, 6, 18, 0, 18, 32],
  ['Dairy Milk 45g', 'snacks', 'bestway', 'front', 'each', 0.48, 1.05, 12, 48, 30, 19, 48],
  ['Mars bar 51g', 'snacks', 'bestway', 'front', 'each', 0.45, 0.99, 12, 48, 9, 20, 48],
  ['Haribo Starmix 140g', 'snacks', 'bestway', 'front', 'each', 0.75, 1.5, 4, 12, null, 21],
  ['Kitchen roll 2 pack', 'household', 'booker', 'stock', 'each', 1.4, 2.5, 3, 8, 5, 22, null, 2],
  ['Toilet roll 9 pack', 'household', 'booker', 'stock', 'each', 3.2, 5.5, 2, 6, 1, 23],
  ['Washing-up liquid 450ml', 'household', 'bestway', 'stock', 'each', 0.6, 1.2, 3, 10, 7, 24],
  ['Bin bags 20', 'household', null, 'stock', 'each', 0.9, 1.75, 2, null, 4, 25],
  ['AA batteries 4 pack', 'household', 'bestway', 'front', 'each', 1.6, 3.49, 2, 6, 3, 26],
  ['Rolling papers', 'tobacco', 'booker', 'front', 'each', 0.25, 0.75, 10, 40, 24, 27, 50],
  ['Lighter', 'tobacco', 'booker', 'front', 'each', 0.2, 0.99, 10, 30, 12, 28, 50],
  ['White bloomer', 'bakery', 'bakery', 'front', 'each', 0.8, 1.6, 3, 10, 0, null],
  ['Croissant', 'bakery', 'bakery', 'front', 'each', 0.35, 0.9, null, 12, null, null],
];

const CATEGORIES: [string, string][] = [['drinks', 'Drinks'], ['chilled', 'Chilled'], ['grocery', 'Grocery'], ['snacks', 'Snacks'], ['household', 'Household'], ['tobacco', 'Tobacco'], ['bakery', 'Bakery']];
const SUPPLIERS: [string, string][] = [['booker', 'Booker'], ['bestway', 'Bestway'], ['dairy', 'Local dairy'], ['bakery', 'Direct bakery']];
const LOCATIONS: [string, string][] = [['front', 'Front shop'], ['stock', 'Stockroom'], ['fridge', 'Fridge'], ['freezer', 'Freezer']];

export function buildSampleData() {
  const created = at(9);
  const categories: Category[] = CATEGORIES.map(([k, name]) => ({ id: `sample_c_${k}`, name, status: 'active', isSample: true, createdAt: created, updatedAt: created }));
  const suppliers: Supplier[] = SUPPLIERS.map(([k, name]) => ({ id: `sample_s_${k}`, name, status: 'active', isSample: true, createdAt: created, updatedAt: created }));
  const locations: StockLocation[] = LOCATIONS.map(([k, name]) => ({ id: `sample_l_${k}`, name, status: 'active', isSample: true, createdAt: created, updatedAt: created }));
  const products: Product[] = SPECS.map((s, i) => {
    const [name, cat, sup, loc, unit, cost, price, level, target, , seq, caseUnits, packUnits] = s;
    const id = `sample_p_${String(i + 1).padStart(2, '0')}`;
    const barcodes = seq === null ? [] : [
      makeBarcode(`${id}_b1`, ean(`500999${String(seq).padStart(6, '0')}`), 'single', 1),
      ...(caseUnits ? [makeBarcode(`${id}_b2`, ean(`150099${String(seq).padStart(6, '0')}`), 'case', caseUnits)] : []),
      ...(packUnits ? [makeBarcode(`${id}_b3`, ean(`250099${String(seq).padStart(6, '0')}`), 'pack', packUnits)] : []),
    ];
    return {
      id, familyProductId: `sample-${id}`, name, barcodes,
      categoryId: `sample_c_${cat}`, ...(sup ? { supplierId: `sample_s_${sup}` } : {}), locationId: `sample_l_${loc}`,
      countUnit: unit, costPrice: cost, sellingPrice: price,
      ...(level !== null ? { reorderLevel: level } : {}), ...(target !== null ? { targetStock: target } : {}),
      ...(i === 0 ? { sku: 'COKE500' } : {}),
      status: 'active', isSample: true, createdAt: created, updatedAt: created,
    };
  });
  const completedAt = at(2, 18);
  const entries: CountEntry[] = SPECS.flatMap((s, i) => {
    const counted = s[9];
    if (counted === null) return [];
    const p = products[i];
    return [{
      productId: p.id, productName: p.name, categoryName: CATEGORIES.find(c => c[0] === s[1])![1],
      ...(s[2] ? { supplierName: SUPPLIERS.find(x => x[0] === s[2])![1] } : {}),
      locationName: LOCATIONS.find(l => l[0] === s[3])![1], countUnit: p.countUnit, costPriceAtCount: p.costPrice,
      quantityBase: counted, countedAt: completedAt, source: p.barcodes.length ? 'scan' : 'list',
    } as CountEntry];
  });
  let out = 0; let low = 0;
  for (const e of entries) {
    const p = products.find(x => x.id === e.productId)!;
    if (e.quantityBase === 0) out++; else if (p.reorderLevel !== undefined && e.quantityBase <= p.reorderLevel) low++;
  }
  const session: CountSession = {
    id: 'sample_cs_1', status: 'completed', scope: { type: 'everything' }, scopeLabel: 'Full shop', mode: 'scan', blindCount: false, caseLooseEnabled: true,
    productIdsSnapshot: products.map(p => p.id).sort(), startedAt: at(2, 16), completedAt, entries, attentionAtCompletion: { out, low }, isSample: true,
  };
  const favourite: FavouriteCount = { id: 'sample_f_1', name: 'Daily fridge', scope: { type: 'location', locationId: 'sample_l_fridge' }, mode: 'scan', blindCount: false, caseLooseEnabled: false, isSample: true, createdAt: created, updatedAt: created };
  return { categories, suppliers, locations, products, session, favourite };
}

export class RealDataPresentError extends Error { constructor() { super('Sample data can only be added to an empty TillCount.'); this.name = 'RealDataPresentError'; } }

export function hasSampleData(): boolean {
  return getState().products.some(p => p.isSample);
}

/** Load the sample fixture into an EMPTY app (never mixed into real data). */
export async function loadSampleData(): Promise<void> {
  const st = getState();
  if (st.products.some(p => !p.isSample) || st.sessions.some(s => !s.isSample)) throw new RealDataPresentError();
  if (hasSampleData()) return;
  const d = buildSampleData();
  const snapshots = applyCompletedToSnapshots(st.snapshots, d.session);
  const sessions = [headerOf(d.session), ...st.sessions];
  const ops: TxOp[] = [
    { kind: 'collection', key: KEYS.products, items: [...st.products, ...d.products] },
    { kind: 'collection', key: KEYS.categories, items: [...st.categories, ...d.categories] },
    { kind: 'collection', key: KEYS.suppliers, items: [...st.suppliers, ...d.suppliers] },
    { kind: 'collection', key: KEYS.locations, items: [...st.locations, ...d.locations] },
    { kind: 'collection', key: countEntriesKey(d.session.id), items: d.session.entries },
    { kind: 'collection', key: KEYS.countSessions, items: sessions },
    { kind: 'collection', key: KEYS.favourites, items: [...st.favourites, d.favourite] },
    { kind: 'doc', key: KEYS.countSnapshots, value: snapshots },
  ];
  await commitMany(ops, {
    products: [...st.products, ...d.products], categories: [...st.categories, ...d.categories], suppliers: [...st.suppliers, ...d.suppliers],
    locations: [...st.locations, ...d.locations], sessions, favourites: [...st.favourites, d.favourite], snapshots,
  });
}

/** Remove every sample record in one transaction. Real records (and anything they reference) stay. */
export async function removeSampleData(): Promise<void> {
  const st = getState();
  // An open count that includes sample products must be finished or discarded first
  // (it would otherwise keep ids of products that no longer exist).
  const sampleProductIds = new Set(st.products.filter(p => p.isSample).map(p => p.id));
  if (st.openSession && (st.openSession.isSample || st.openSession.productIdsSnapshot.some(id => sampleProductIds.has(id)))) {
    throw new Error('Finish or discard the open count first.');
  }
  const products = st.products.filter(p => !p.isSample);
  const used = (key: 'categoryId' | 'supplierId' | 'locationId', id: string) => products.some(p => p[key] === id);
  const categories = st.categories.filter(c => !c.isSample || used('categoryId', c.id));
  const suppliers = st.suppliers.filter(c => !c.isSample || used('supplierId', c.id));
  const locations = st.locations.filter(c => !c.isSample || used('locationId', c.id));
  const removedSessions = st.sessions.filter(s => s.isSample);
  const sessions = st.sessions.filter(s => !s.isSample);
  const favourites = st.favourites.filter(f => !f.isSample);
  const sampleIds = new Set(st.products.filter(p => p.isSample).map(p => p.id));
  const snapshots = Object.fromEntries(Object.entries(st.snapshots).filter(([id, s]) => !sampleIds.has(id) && !removedSessions.some(r => r.id === s.countSessionId)));
  await commitMany([
    { kind: 'collection', key: KEYS.products, items: products },
    { kind: 'collection', key: KEYS.categories, items: categories },
    { kind: 'collection', key: KEYS.suppliers, items: suppliers },
    { kind: 'collection', key: KEYS.locations, items: locations },
    { kind: 'collection', key: KEYS.countSessions, items: sessions },
    { kind: 'collection', key: KEYS.favourites, items: favourites },
    { kind: 'doc', key: KEYS.countSnapshots, value: snapshots },
    ...removedSessions.map(s => ({ kind: 'deleteCollection' as const, key: countEntriesKey(s.id) })),
  ], { products, categories, suppliers, locations, sessions, favourites, snapshots });
}
