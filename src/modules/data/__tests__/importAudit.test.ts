/**
 * Import edge cases found in the pre-release audit: every problem becomes an attention
 * row (never a silent drop), and nothing half-applied reaches the catalogue.
 */
import { autoMap, classifyRows, CsvFormatError, parseCsv, planImport, rowsFromTable, type ImportRow } from '../productImport';
import { buildCatalogIndex, findActiveByBarcode } from '../../../domain/catalogIndex';
import { makeBarcode } from '../../../domain/productRules';
import type { Product } from '../../../domain/types';

const T = '2026-09-24T09:00:00.000Z';
const rows = (csv: string) => { const t = parseCsv(csv); return rowsFromTable(t, autoMap(t[0])); };
const product = (over: Partial<Product> & { id: string; name: string }): Product => ({
  familyProductId: `fam-${over.id}`, barcodes: [], countUnit: 'each', status: 'active', createdAt: T, updatedAt: T, ...over,
});

describe('import audit fixes', () => {
  it('bad or negative price, reorder level and target make the row need attention', () => {
    const [r] = rows('name,selling_price,reorder_level,target\nA,abc,-3,xyz');
    expect(r.issues).toEqual(expect.arrayContaining(['badNumber', 'negative']));
    expect(classifyRows([r], buildCatalogIndex([]))[0].kind).toBe('attention');
  });

  it('an unclosed quote is an unreadable file, not one giant product', () => {
    expect(() => parseCsv('name,barcode\n"Milk,5000\nBread,5001')).toThrow(CsvFormatError);
  });

  it('delimiter is detected outside quotes, and old Mac (CR-only) files split into rows', () => {
    expect(parseCsv('"Name, product";barcode\nA;1')[0]).toEqual(['Name, product', 'barcode']);
    expect(parseCsv('name,barcode\rA,1\rB,2')).toHaveLength(3);
  });

  it('Excel scientific-notation barcodes are refused', () => {
    const [r] = rows('name,barcode\nMilk,5.01235E+12');
    expect(r.barcodes).toEqual([]);
    expect(r.issues).toContain('badBarcode');
  });

  it("our own export's formula guard (') is undone on re-import", () => {
    const [r] = rows("name,sku\nWidget,'-123");
    expect(r.sku).toBe('-123');
  });

  it('a row refused while planning creates no category / supplier and is reported', () => {
    const owner = product({ id: 'p1', name: 'Owner', barcodes: [makeBarcode('b1', '5000112637922', 'single', 1)] });
    const row: ImportRow = { line: 2, name: 'Clash', barcodes: [{ code: '5000112637922', role: 'single', units: 1 }], issues: [], category: 'Ghost', supplier: 'GhostSup' };
    // Classified as new against an empty index, then the code turns out to be owned at plan time.
    const plan = planImport([{ kind: 'new', row }], { products: [owner], categories: [], suppliers: [], locations: [] }, { updateMatched: false, allowance: 100, now: T });
    expect(plan.added).toBe(0);
    expect(plan.refusedRows.map(r => r.name)).toEqual(['Clash']);
    expect(plan.next.categories).toEqual([]);
    expect(plan.next.suppliers).toEqual([]);
  });

  it('a family id already used (even by an archived product) is never given to a second product', () => {
    const archived = product({ id: 'p1', name: 'Old', status: 'archived', familyProductId: 'fam-1' });
    const row: ImportRow = { line: 2, name: 'New', barcodes: [], issues: [], familyProductId: 'fam-1' };
    const plan = planImport([{ kind: 'new', row }], { products: [archived], categories: [], suppliers: [], locations: [] }, { updateMatched: false, allowance: 100, now: T });
    const created = plan.next.products.find(p => p.name === 'New')!;
    expect(created.familyProductId).not.toBe('fam-1');
  });

  it('a UPC-E code typed as 8 digits and the camera expansion are the same product', () => {
    const p = product({ id: 'p1', name: 'Gum', barcodes: [makeBarcode('b1', '04252614', 'single', 1)] });
    const idx = buildCatalogIndex([p]);
    expect(findActiveByBarcode(idx, '04252614', 'upc_e')?.id).toBe('p1');
  });
});
