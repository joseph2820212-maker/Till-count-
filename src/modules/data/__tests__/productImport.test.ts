import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  autoMap, classifyRows, isTillCalcCsv, parseCsv, parseNumberCell, planImport, rowsFromTable, summarise, parseUnit,
} from '../productImport';
import { buildTransfer, parseTransfer, TransferParseError } from '../familyTransfer';
import { buildCatalogIndex } from '../../../domain/catalogIndex';
import { makeBarcode } from '../../../domain/productRules';
import type { Product } from '../../../domain/types';
import { commitCatalog, getState, loadStore, resetStoreForTests } from '../../../state/store';
import { __setTxFailurePoint } from '../../../storage/kv';
import { KEYS } from '../../../storage/keys';

const NOW = '2026-09-24T10:00:00.000Z';
const existing: Product = {
  id: 'p1', familyProductId: 'fam-1', name: 'Coca-Cola 500ml', sku: 'CC500', countUnit: 'each', status: 'active',
  barcodes: [makeBarcode('b1', '5000112637922', 'single', 1)], createdAt: NOW, updatedAt: NOW, costPrice: 0.5,
};

describe('CSV parsing', () => {
  it('handles BOM, quotes, escaped quotes, embedded commas and newlines, CRLF', () => {
    const text = '﻿name,barcode,category\r\n"Crisps, cheese","5000000000017","Snacks"\r\n"Say ""hi""","", "Multi\nline"\r\n';
    expect(parseCsv(text)).toEqual([
      ['name', 'barcode', 'category'],
      ['Crisps, cheese', '5000000000017', 'Snacks'],
      ['Say "hi"', '', 'Multi\nline'],
    ]);
  });
  it('accepts semicolon files and Arabic text, drops blank lines and NUL bytes', () => {
    const t = parseCsv('الاسم;السعر\nحليب;1,25\n\n;\n\u0000');
    expect(t).toEqual([['الاسم', 'السعر'], ['حليب', '1,25']]);
  });
  it('an empty / zero-byte file has no rows', () => {
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv('\u0000')).toEqual([]);
  });
  it('reads numbers in several formats and rejects junk', () => {
    expect(parseNumberCell('1.234,56')).toBe(1234.56);
    expect(parseNumberCell('1,234.56')).toBe(1234.56);
    expect(parseNumberCell('1,25')).toBe(1.25);
    expect(parseNumberCell('1,000')).toBe(1000);
    expect(parseNumberCell('£2.49')).toBe(2.49);
    expect(parseNumberCell('12abc')).toBeNull();
    expect(parseNumberCell('')).toBeNull();
  });
  it('maps common headers automatically, each field once', () => {
    expect(autoMap(['Description', 'EAN', 'Department', 'Supplier', 'Case Qty', 'Price', 'Notes'])).toEqual(['name', 'barcode', 'category', 'supplier', 'caseQuantity', 'sellingPrice', 'ignore']);
    expect(autoMap(['name', 'Name'])).toEqual(['name', 'ignore']);
    expect(parseUnit('Kilo')).toBe('kg');
    expect(parseUnit('litres')).toBe('l');
    expect(parseUnit('bag')).toBeNull();
  });
});

describe('row validation and conflict classification', () => {
  const idx = buildCatalogIndex([existing]);
  const table = parseCsv([
    'name,sku,barcode,case_qty,cost,unit',
    'New thing,NT1,5000000000024,12,0.40,each',
    ',X1,,,,',                                    // missing name
    'Cola again,,036000291452,,,',               // new (different code)
    'Cola by barcode,,5000112637922,,,',          // matches p1 by barcode
    'Cola by sku,cc500,,,,',                      // p1 again (by SKU) → second match of one product
    'Ambiguous,CC500,036000291452,,,',            // SKU → p1, barcode → row 4 is not in catalogue; fine... see below
    'Dup in file,,5000000000024,,,',              // duplicate barcode of row 2
    'Bad numbers,,,abc,-1,bag',
  ].join('\n'));
  const rows = rowsFromTable(table, autoMap(table[0]));
  const classes = classifyRows(rows, idx);

  it('flags row-level problems with reasons', () => {
    expect(rows[1].issues).toEqual(['missingName']);
    expect(rows[7].issues.sort()).toEqual(['badNumber', 'badUnit', 'negative'].sort());
  });
  it('classifies new, matched, duplicate-in-file and attention rows', () => {
    expect(classes.map(c => c.kind)).toEqual(['new', 'attention', 'new', 'match', 'attention', 'attention', 'attention', 'attention']);
    const m = classes[3];
    expect(m.kind === 'match' && m.by).toBe('barcode');
    expect(classes[4].row.issues).toContain('duplicateInFile');
    expect(classes[5].row.issues).toContain('duplicateInFile');
    expect(classes[6].row.issues).toContain('duplicateInFile');
    expect(summarise(classes)).toEqual({ newRows: 2, matched: 1, attention: 5 });
  });
  it('an ambiguous row (barcode → one product, SKU → another) always needs attention', () => {
    const other: Product = { ...existing, id: 'p2', familyProductId: 'fam-2', name: 'Milk', sku: 'MILK', barcodes: [makeBarcode('b2', '036000291452', 'single', 1)] };
    const t = parseCsv('name,sku,barcode\nX,CC500,036000291452');
    const c = classifyRows(rowsFromTable(t, autoMap(t[0])), buildCatalogIndex([existing, other]));
    expect(c[0].kind).toBe('attention');
    expect(c[0].row.issues).toContain('ambiguousMatch');
  });
});

describe('planImport never overwrites silently', () => {
  const state = { products: [existing], categories: [], suppliers: [], locations: [] };
  const t = parseCsv('name,barcode,category,supplier,cost\nCola NEW NAME,5000112637922,Drinks,Booker,0.99\nFresh,5000000000031,Drinks,Booker,1.10');
  const classes = classifyRows(rowsFromTable(t, autoMap(t[0])), buildCatalogIndex([existing]));

  it('default: matched products are left exactly as they were', () => {
    const r = planImport(classes, state, { updateMatched: false, allowance: Infinity, now: NOW });
    expect(r.added).toBe(1);
    expect(r.updated).toBe(0);
    expect(r.skipped).toBe(1);
    expect(r.next.products.find(p => p.id === 'p1')).toEqual(existing);
    expect(r.next.categories.map(c => c.name)).toEqual(['Drinks']);
    expect(r.next.suppliers.map(c => c.name)).toEqual(['Booker']);
  });
  it('opt-in update fills provided fields but never changes identity', () => {
    const r = planImport(classes, state, { updateMatched: true, allowance: Infinity, now: NOW });
    const p = r.next.products.find(x => x.id === 'p1')!;
    expect(p.name).toBe('Cola NEW NAME');
    expect(p.costPrice).toBe(0.99);
    expect(p.familyProductId).toBe('fam-1');
    expect(r.updated).toBe(1);
  });
  it('Free allowance limits creates, never updates', () => {
    const r = planImport(classes, state, { updateMatched: true, allowance: 0, now: NOW });
    expect(r.added).toBe(0);
    expect(r.skippedForLimit).toBe(1);
    expect(r.updated).toBe(1);
  });
  it('TillCalc CSV: unit cost from pack cost ÷ pack qty; tax columns ignored', () => {
    const tc = parseCsv('name,sku,barcode,category,supplier,pack_qty,pack_cost,tax_basis,selling_price,sales_tax_rate,selling_unit\nCadbury Dairy Milk 45g,CDM45,5000159407236,Confectionery,Bestway,48,24.96,ex,0.85,20,single');
    expect(isTillCalcCsv(tc[0])).toBe(true);
    const rows = rowsFromTable(tc, autoMap(tc[0]), { tillCalc: true });
    expect(rows[0]).toMatchObject({ name: 'Cadbury Dairy Milk 45g', sku: 'CDM45', caseQuantity: 48, cost: 0.52, sellingPrice: 0.85, category: 'Confectionery', supplier: 'Bestway', issues: [] });
  });
  it('2,000-row file parses, classifies and plans quickly', () => {
    const lines = ['name,barcode,category,supplier,cost,target'];
    for (let i = 0; i < 2000; i++) lines.push(`Item ${i},${String(4000000000000 + i)},Cat ${i % 20},Sup ${i % 5},${(i % 50) / 10},${i % 30}`);
    const started = Date.now();
    const tt = parseCsv(lines.join('\n'));
    const cl = classifyRows(rowsFromTable(tt, autoMap(tt[0])), buildCatalogIndex([existing]));
    const r = planImport(cl, state, { updateMatched: false, allowance: Infinity, now: NOW });
    expect(r.added).toBe(2000);
    expect(r.next.categories).toHaveLength(20);
    expect(Date.now() - started).toBeLessThan(3000);
  });
});

describe('import writes are all-or-nothing', () => {
  beforeEach(async () => { await AsyncStorage.clear(); resetStoreForTests(); await loadStore(); });
  it('a storage failure mid-write leaves the previous catalogue', async () => {
    await commitCatalog({ products: [existing] });
    const before = await AsyncStorage.getItem(KEYS.products);
    const t = parseCsv('name,category\nA,Cat\nB,Cat');
    const plan = planImport(classifyRows(rowsFromTable(t, autoMap(t[0])), getState().index), getState(), { updateMatched: false, allowance: Infinity, now: NOW });
    __setTxFailurePoint('afterFlip');
    await expect(commitCatalog(plan.next)).rejects.toThrow();
    expect(await AsyncStorage.getItem(KEYS.products)).toBe(before);
    expect(getState().products).toHaveLength(1);
    resetStoreForTests(); await loadStore();
    expect(getState().products.map(p => p.id)).toEqual(['p1']);
    expect(getState().categories).toEqual([]);
  });
});

describe('Till-family transfer', () => {
  it('round-trips identity, barcodes, category, supplier, case size and prices — never history or settings', () => {
    const lookups = { categories: new Map([['c', { id: 'c', name: 'Drinks', status: 'active' as const, createdAt: NOW, updatedAt: NOW }]]), suppliers: new Map(), locations: new Map() };
    const p: Product = { ...existing, categoryId: 'c', caseQuantity: 24, sellingPrice: 1.49, barcodes: [...existing.barcodes, makeBarcode('b9', '15000112637929', 'case', 24)] };
    const file = buildTransfer([p, { ...existing, id: 'arch', status: 'archived' }], lookups, new Date(NOW));
    expect(file).toMatchObject({ schema: 'till.product-transfer', version: 1, exportedBy: 'TillCount' });
    expect(file.products).toHaveLength(1);
    expect(JSON.stringify(file)).not.toMatch(/session|snapshot|settings|passphrase|billing|quantityBase|countedAt/i);
    const rows = parseTransfer(JSON.stringify(file));
    expect(rows[0]).toMatchObject({ familyProductId: 'fam-1', name: 'Coca-Cola 500ml', sku: 'CC500', category: 'Drinks', caseQuantity: 24, cost: 0.5, sellingPrice: 1.49, issues: [] });
    expect(rows[0].barcodes).toEqual([{ code: '5000112637922', role: 'single', units: 1 }, { code: '15000112637929', role: 'case', units: 24 }]);
    // re-import matches by barcode first, then familyProductId
    const c = classifyRows(rows, buildCatalogIndex([existing]));
    expect(c[0].kind).toBe('match');
  });
  it('a single SKU match is classified by SKU', () => {
    const t = parseCsv('name,sku\nCola by sku,cc500');
    const c = classifyRows(rowsFromTable(t, autoMap(t[0])), buildCatalogIndex([existing]));
    expect(c[0].kind === 'match' && c[0].by).toBe('sku');
  });
  it('matches by familyProductId when codes and SKU differ', () => {
    const rows = parseTransfer(JSON.stringify({ schema: 'till.product-transfer', version: 1, exportedBy: 'TillCalc', createdAt: NOW, products: [{ familyProductId: 'fam-1', name: 'Renamed', barcodes: [] }] }));
    const c = classifyRows(rows, buildCatalogIndex([existing]));
    expect(c[0].kind === 'match' && c[0].by).toBe('family');
  });
  it('rejects foreign, future and malformed files', () => {
    const code = (s: string) => { try { parseTransfer(s); return 'ok'; } catch (e) { return (e as TransferParseError).code; } };
    expect(code('not json')).toBe('invalidJson');
    expect(code('{"schema":"other","version":1,"products":[]}')).toBe('wrongSchema');
    expect(code('{"schema":"till.product-transfer","version":9,"products":[]}')).toBe('futureVersion');
    expect(code('{"schema":"till.product-transfer","version":1,"products":{}}')).toBe('invalidProducts');
  });
  it('bad records become attention rows, not crashes', () => {
    const rows = parseTransfer(JSON.stringify({ schema: 'till.product-transfer', version: 1, products: [{ name: '', barcodes: [{ code: '\u0001bad', role: 'single' }], costPrice: -3, countUnit: 'bag' }] }));
    expect(rows[0].issues.sort()).toEqual(['badBarcode', 'badNumber', 'badUnit', 'missingName'].sort());
  });
});
