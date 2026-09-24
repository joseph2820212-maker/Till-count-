import { barcodesEquivalent, ean13CheckDigit, expandUpcE, isAcceptableBarcode, isValidEan13, normalizeBarcode, symbologyOf } from '../barcode';
import { buildCatalogIndex, findActiveByBarcode, findActiveBySku, searchProducts } from '../catalogIndex';
import { makeBarcode, validateNamedRecord, validateProduct } from '../productRules';
import { product, withCodes } from './fixtures';

describe('barcode normalisation (one authoritative path)', () => {
  it('stores UPC-A as EAN-13 with a leading zero', () => {
    expect(normalizeBarcode('036000291452')).toBe('0036000291452');
    expect(barcodesEquivalent('036000291452', '0036000291452')).toBe(true);
  });
  it('keeps EAN-13 and EAN-8 as scanned', () => {
    expect(normalizeBarcode('5000112637922')).toBe('5000112637922');
    expect(normalizeBarcode('96385074')).toBe('96385074');
  });
  it('expands UPC-E only when the scanner says upc_e', () => {
    const upcA = expandUpcE('04252614');
    expect(upcA).toBe('042100005264');
    expect(normalizeBarcode('04252614', 'upc_e')).toBe('0042100005264');
    expect(normalizeBarcode('04252614')).toBe('04252614');
    expect(barcodesEquivalent('042100005264', normalizeBarcode('04252614', 'upc_e'))).toBe(true);
  });
  it('keeps Code 128 and ITF-14 codes', () => {
    expect(normalizeBarcode('  ABC-123 ')).toBe('ABC-123');
    expect(normalizeBarcode('15000112637929')).toBe('15000112637929');
  });
  it('joins spaced digit groups typed by hand', () => {
    expect(normalizeBarcode('5000 1126 37922')).toBe('5000112637922');
  });
  it('validates EAN-13 check digits', () => {
    expect(ean13CheckDigit('500011263792')).toBe(2);
    expect(isValidEan13('5000112637922')).toBe(true);
    expect(isValidEan13('5000112637923')).toBe(false);
  });
  it('maps scanner types', () => {
    expect(symbologyOf('org.gs1.EAN-13')).toBe('ean13');
    expect(symbologyOf('upc_e')).toBe('upc_e');
    expect(symbologyOf('code128')).toBe('code128');
    expect(symbologyOf('itf14')).toBe('itf14');
    expect(symbologyOf('qr')).toBe('unknown');
  });
  it('rejects empty, oversize and control-character codes', () => {
    expect(isAcceptableBarcode('')).toBe(false);
    expect(isAcceptableBarcode('x'.repeat(65))).toBe(false);
    expect(isAcceptableBarcode('12\u000034')).toBe(false);
    expect(isAcceptableBarcode('5000112637922')).toBe(true);
  });
});

describe('catalogue index and search', () => {
  const cola = withCodes(product({ id: 'cola', name: 'Coca-Cola 500ml', sku: 'CC500', categoryId: 'drinks' }), [['5000112637922', 'single', 1], ['15000112637929', 'case', 24]]);
  const milk = withCodes(product({ id: 'milk', name: 'Milk 2L', sku: ' mk-2 ', supplierId: 'dairy' }), [['036000291452', 'single', 1]]);
  const old = withCodes(product({ id: 'old', name: 'Old crisps', status: 'archived', sku: 'OC' }), [['96385074', 'single', 1]]);
  const idx = buildCatalogIndex([cola, milk, old]);

  it('finds active products by any equivalent code', () => {
    expect(findActiveByBarcode(idx, '0036000291452')?.id).toBe('milk');
    expect(findActiveByBarcode(idx, '036000291452')?.id).toBe('milk');
    expect(findActiveByBarcode(idx, '15000112637929')?.id).toBe('cola');
  });
  it('never returns an archived product for a scan, but remembers its codes', () => {
    expect(findActiveByBarcode(idx, '96385074')).toBeNull();
    expect(idx.archivedByBarcode.get('96385074')).toBe('old');
  });
  it('matches SKU trimmed and case-insensitively', () => {
    expect(findActiveBySku(idx, 'MK-2')?.id).toBe('milk');
    expect(findActiveBySku(idx, 'cc500')?.id).toBe('cola');
    expect(findActiveBySku(idx, 'OC')).toBeNull();
  });
  it('searches by name, SKU and barcode', () => {
    expect(searchProducts(idx, 'cola').map(p => p.id)).toEqual(['cola']);
    expect(searchProducts(idx, 'mk-2').map(p => p.id)).toEqual(['milk']);
    expect(searchProducts(idx, '036000291452').map(p => p.id)).toEqual(['milk']);
    expect(searchProducts(idx, '').map(p => p.id)).toEqual(['cola', 'milk']);
    expect(searchProducts(idx, '', { categoryId: 'drinks' }).map(p => p.id)).toEqual(['cola']);
    expect(searchProducts(idx, 'crisps', { includeArchived: true }).map(p => p.id)).toEqual(['old']);
    expect(searchProducts(idx, 'zzz')).toEqual([]);
  });
});

describe('product rules', () => {
  const cola = withCodes(product({ id: 'cola', name: 'Cola', sku: 'SKU1' }), [['036000291452', 'single', 1]]);
  const archived = withCodes(product({ id: 'arch', name: 'Archived', sku: 'SKU9', status: 'archived' }), [['5000112637922', 'single', 1]]);

  it('requires a name', () => {
    expect(validateProduct([], product({ name: '  ' })).map(e => e.code)).toContain('nameRequired');
  });
  it('blocks an equivalent UPC/EAN duplicate on another active product', () => {
    const c = withCodes(product({ id: 'new', name: 'New' }), [['0036000291452', 'single', 1]]);
    expect(validateProduct([cola], c).map(e => e.code)).toEqual(['duplicateBarcode']);
  });
  it('blocks two equivalent codes on one product', () => {
    const c = withCodes(product({ id: 'new', name: 'New' }), [['036000291452', 'single', 1], ['0036000291452', 'pack', 6]]);
    expect(validateProduct([], c).map(e => e.code)).toEqual(['duplicateBarcodeInProduct']);
  });
  it('treats SKU case and surrounding whitespace as the same SKU', () => {
    expect(validateProduct([cola], product({ id: 'n', name: 'N', sku: '  sku1 ' })).map(e => e.code)).toEqual(['duplicateSku']);
  });
  it('lets an active product reuse an archived product\'s code and SKU', () => {
    const c = withCodes(product({ id: 'n', name: 'N', sku: 'sku9' }), [['5000112637922', 'single', 1]]);
    expect(validateProduct([archived], c)).toEqual([]);
  });
  it('refuses to bring back an archived product whose code moved to another product', () => {
    const moved = withCodes(product({ id: 'n', name: 'N' }), [['5000112637922', 'single', 1]]);
    const back = { ...archived, status: 'active' as const };
    expect(validateProduct([moved, archived], back, archived).map(e => e.code)).toEqual(['duplicateBarcode']);
  });
  it('allows moving a code: remove from one product, add to another', () => {
    const colaWithout = { ...cola, barcodes: [] };
    const other = withCodes(product({ id: 'o', name: 'Other' }), [['036000291452', 'single', 1]]);
    expect(validateProduct([colaWithout], other)).toEqual([]);
  });
  it('requires pack / case units > 0 and forces singles to 1', () => {
    expect(makeBarcode('b', '123', 'single', 12).unitsPerBarcode).toBe(1);
    const bad = { ...product({ id: 'x', name: 'X' }), barcodes: [{ ...makeBarcode('b', '123456', 'case', 0) }] };
    expect(validateProduct([], bad).map(e => e.code)).toEqual(['badUnitsPerBarcode']);
    const neg = { ...product({ id: 'y', name: 'Y' }), barcodes: [{ ...makeBarcode('b', '1234567', 'pack', -6) }] };
    expect(validateProduct([], neg).map(e => e.code)).toEqual(['badUnitsPerBarcode']);
  });
  it('rejects negative / NaN money and reorder values', () => {
    const p = product({ name: 'P', costPrice: -1, sellingPrice: NaN, reorderLevel: -2, targetStock: Infinity });
    expect(validateProduct([], p).map(e => e.code).sort()).toEqual(['badCost', 'badPrice', 'badReorderLevel', 'badTarget']);
  });
  it('never lets familyProductId change on edit', () => {
    expect(validateProduct([cola], { ...cola, familyProductId: 'other' }, cola).map(e => e.code)).toContain('familyIdChanged');
  });
  it('named records: required, unique case-insensitive among active', () => {
    const list = [{ id: 'a', name: 'Drinks', status: 'active' }, { id: 'b', name: 'Old', status: 'archived' }];
    expect(validateNamedRecord(list, { id: 'c', name: ' ', status: 'active' })).toBe('nameRequired');
    expect(validateNamedRecord(list, { id: 'c', name: 'drinks ', status: 'active' })).toBe('duplicateName');
    expect(validateNamedRecord(list, { id: 'c', name: 'OLD', status: 'active' })).toBeNull();
    expect(validateNamedRecord(list, { id: 'a', name: 'Drinks', status: 'active' })).toBeNull();
  });
});
