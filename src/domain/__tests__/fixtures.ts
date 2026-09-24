import { makeBarcode } from '../productRules';
import type { Category, CountUnit, Product, StockLocation, Supplier } from '../types';
import type { Lookups } from '../countEngine';

export const T0 = '2026-09-24T09:00:00.000Z';
let seq = 0;

export function product(over: Partial<Product> & { name: string }): Product {
  seq += 1;
  return {
    id: over.id ?? `p${seq}`,
    familyProductId: over.familyProductId ?? `fam-${seq}`,
    barcodes: [],
    countUnit: 'each' as CountUnit,
    status: 'active',
    createdAt: T0,
    updatedAt: T0,
    ...over,
  };
}

export function withCodes(p: Product, codes: [string, 'single' | 'pack' | 'case', number][]): Product {
  return { ...p, barcodes: codes.map(([c, r, u], i) => makeBarcode(`${p.id}-b${i}`, c, r, u)) };
}

export function named<T extends Category | Supplier | StockLocation>(id: string, name: string): T {
  return { id, name, status: 'active', createdAt: T0, updatedAt: T0 } as T;
}

export function lookups(cats: Category[] = [], sups: Supplier[] = [], locs: StockLocation[] = []): Lookups {
  return {
    categories: new Map(cats.map(c => [c.id, c])),
    suppliers: new Map(sups.map(s => [s.id, s])),
    locations: new Map(locs.map(l => [l.id, l])),
  };
}
