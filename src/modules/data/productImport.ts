/**
 * productImport.ts — the CSV / TillCalc / Till-family import pipeline (handoff §12):
 * parse → map fields → validate → classify conflicts → review → confirm → one
 * transactional write → summary. Pure functions except `applyImport`.
 *
 * Nothing is ever overwritten silently: a row that matches an existing product (by
 * normalised barcode, then unique SKU, then familyProductId) is kept unchanged unless
 * the user explicitly turns on "Update matching products". Ambiguous rows (barcode points
 * at one product, SKU at another) and duplicates inside the file always need attention.
 */
import { barcodeAliases, normalizeBarcode, isAcceptableBarcode } from '../../domain/barcode';
import { normalizeName, normalizeSku, type CatalogIndex } from '../../domain/catalogIndex';
import { newId, uuid } from '../../domain/ids';
import { makeBarcode, validateProduct } from '../../domain/productRules';
import { COUNT_UNITS, type BarcodeRole, type Category, type CountUnit, type Product, type StockLocation, type Supplier } from '../../domain/types';

// ─── CSV parsing (donor TillCalc csvImport.parseCsv, hardened) ────────────────

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 20_000;

/** A quote that is never closed would swallow the rest of the file into one cell. */
export class CsvFormatError extends Error { constructor() { super('Unterminated quoted field'); this.name = 'CsvFormatError'; } }

/** Delimiter of the header line, counting only characters outside quotes. */
function detectDelimiter(firstLine: string): string {
  let inQ = false; const n = { ',': 0, ';': 0, '\t': 0 } as Record<string, number>;
  for (const ch of firstLine) { if (ch === '"') inQ = !inQ; else if (!inQ && ch in n) n[ch]++; }
  if (n[','] === 0 && n[';'] > 0) return ';';
  if (n[','] === 0 && n['\t'] > 0) return '\t';
  return ',';
}

/**
 * RFC-4180 parser: quotes, escaped quotes, embedded commas / newlines, CRLF, lone CR (old Mac
 * files), BOM. Also accepts ';' and tab files. Throws CsvFormatError on an unclosed quote.
 */
export function parseCsv(text: string): string[][] {
  const src = String(text ?? '').replace(/^\uFEFF/, '').replace(/\u0000/g, '').replace(/\r\n?/g, '\n');
  const delimiter = detectDelimiter(src.split('\n', 1)[0] ?? '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; } else inQuotes = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"' && cell.trim() === '') { cell = ''; inQuotes = true; continue; }
    if (ch === delimiter) { row.push(cell); cell = ''; continue; }
    if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; continue; }
    cell += ch;
  }
  if (inQuotes) throw new CsvFormatError();
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

export function normaliseHeader(h: string): string {
  return String(h ?? '').trim().toLowerCase().replace(/[\s\-/]+/g, '_').replace(/[^a-z0-9_]/g, '');
}

/** "1.234,56" → 1234.56 ; "1,25" → 1.25 ; "1,234.56" → 1234.56 ; junk → null. */
export function parseNumberCell(v: string): number | null {
  const s = String(v ?? '').trim().replace(/\s/g, '').replace(/^[£€$₺]/, '');
  if (!s) return null;
  let n: string;
  if (s.includes(',') && s.includes('.')) n = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (s.includes(',')) n = /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
  else n = s;
  if (!/^-?(\d+(\.\d*)?|\.\d+)$/.test(n)) return null;
  const num = Number(n);
  return Number.isFinite(num) ? num : null;
}

// ─── Field mapping ───────────────────────────────────────────────────────────

export const IMPORT_FIELDS = ['name', 'sku', 'barcode', 'category', 'supplier', 'caseQuantity', 'countUnit', 'cost', 'sellingPrice', 'reorderLevel', 'target', 'location'] as const;
export type ImportField = typeof IMPORT_FIELDS[number];
export type Mapping = (ImportField | 'ignore')[];

const SYNONYMS: Record<ImportField, string[]> = {
  name: ['name', 'product', 'product_name', 'description', 'item', 'item_name', 'title'],
  sku: ['sku', 'code', 'product_code', 'item_code', 'ref', 'reference', 'plu'],
  barcode: ['barcode', 'ean', 'ean13', 'upc', 'gtin', 'bar_code', 'barcode_single'],
  category: ['category', 'department', 'dept', 'group', 'section'],
  supplier: ['supplier', 'vendor', 'wholesaler', 'supplier_name'],
  caseQuantity: ['case_qty', 'case_quantity', 'units_per_case', 'pack_qty', 'case_size', 'outer', 'case_units'],
  countUnit: ['unit', 'count_unit', 'uom', 'unit_of_measure'],
  cost: ['cost', 'cost_price', 'unit_cost', 'buy_price'],
  sellingPrice: ['selling_price', 'price', 'retail_price', 'rrp', 'sell_price'],
  reorderLevel: ['reorder_level', 'low_stock_level', 'min', 'minimum', 'reorder_point'],
  target: ['target', 'target_stock', 'max', 'maximum', 'par', 'par_level'],
  location: ['location', 'area', 'shelf', 'bay'],
};

/** Best-effort automatic mapping; every field is used at most once. */
export function autoMap(headers: string[]): Mapping {
  const used = new Set<ImportField>();
  return headers.map(h => {
    const n = normaliseHeader(h);
    for (const f of IMPORT_FIELDS) {
      if (!used.has(f) && SYNONYMS[f].includes(n)) { used.add(f); return f; }
    }
    return 'ignore';
  });
}

/** TillCalc CSV (donor template): pack_qty + pack_cost describe the purchase case. */
export function isTillCalcCsv(headers: string[]): boolean {
  const n = headers.map(normaliseHeader);
  return n.includes('pack_qty') && n.includes('pack_cost') && n.includes('selling_price');
}

// ─── Rows ────────────────────────────────────────────────────────────────────

export type RowIssue =
  | 'missingName' | 'badBarcode' | 'badNumber' | 'negative' | 'badCaseQuantity' | 'badUnit'
  | 'duplicateInFile' | 'ambiguousMatch';

export interface ImportRow {
  line: number;
  name: string;
  sku?: string;
  barcodes: { code: string; role: BarcodeRole; units: number }[];
  category?: string;
  supplier?: string;
  location?: string;
  caseQuantity?: number;
  countUnit?: CountUnit;
  cost?: number;
  sellingPrice?: number;
  reorderLevel?: number;
  target?: number;
  familyProductId?: string;
  issues: RowIssue[];
}

const UNIT_SYNONYMS: Record<string, CountUnit> = {
  each: 'each', ea: 'each', unit: 'each', units: 'each', pcs: 'each', pc: 'each', single: 'each', item: 'each',
  kg: 'kg', kilo: 'kg', kilogram: 'kg', kilograms: 'kg', g: 'g', gram: 'g', grams: 'g',
  l: 'l', ltr: 'l', litre: 'l', liter: 'l', litres: 'l', liters: 'l', ml: 'ml', millilitre: 'ml', milliliter: 'ml',
};

export function parseUnit(v: string): CountUnit | null {
  const k = String(v ?? '').trim().toLowerCase().replace(/\.$/, '');
  if (!k) return null;
  return UNIT_SYNONYMS[k] ?? null;
}

/** Our own CSV export prefixes '=', '+', '-', '@' cells with ' (formula-injection guard); undo it. */
function unguard(v: string): string {
  return /^'[=+\-@\t\r]/.test(v) ? v.slice(1) : v;
}

/** Excel turns long codes into "5.01235E+12"; that is not a barcode any more. */
const SCIENTIFIC = /^[+-]?\d+([.,]\d+)?e[+-]?\d+$/i;

function cleanText(v: string | undefined, max = 120): string | undefined {
  const s = unguard(String(v ?? '')).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  return s ? s.slice(0, max) : undefined;
}

/** Turn a CSV table + mapping into validated rows. */
export function rowsFromTable(table: string[][], mapping: Mapping, opts: { tillCalc?: boolean } = {}): ImportRow[] {
  const headers = table[0] ?? [];
  const norm = headers.map(normaliseHeader);
  const packCostIdx = opts.tillCalc ? norm.indexOf('pack_cost') : -1;
  const packQtyIdx = opts.tillCalc ? norm.indexOf('pack_qty') : -1;
  const out: ImportRow[] = [];
  for (let i = 1; i < table.length && out.length < MAX_IMPORT_ROWS; i++) {
    const r = table[i];
    const get = (f: ImportField): string => { const idx = mapping.indexOf(f); return idx >= 0 ? String(r[idx] ?? '').trim() : ''; };
    const issues: RowIssue[] = [];
    const num = (f: ImportField): number | undefined => {
      const raw = get(f);
      if (!raw) return undefined;
      const n = parseNumberCell(raw);
      if (n === null) { issues.push('badNumber'); return undefined; }
      if (n < 0) { issues.push('negative'); return undefined; }
      return n;
    };
    const name = cleanText(get('name')) ?? '';
    if (!name) issues.push('missingName');
    const code = unguard(get('barcode'));
    const barcodes: ImportRow['barcodes'] = [];
    if (code) { if (isAcceptableBarcode(code) && !SCIENTIFIC.test(code)) barcodes.push({ code, role: 'single', units: 1 }); else issues.push('badBarcode'); }
    let caseQuantity = num('caseQuantity');
    if (caseQuantity !== undefined && !(Number.isInteger(caseQuantity) && caseQuantity > 0)) { issues.push('badCaseQuantity'); caseQuantity = undefined; }
    let cost = num('cost');
    // TillCalc: unit cost = pack_cost / pack_qty (tax / margin fields are ignored).
    if (opts.tillCalc && cost === undefined && packCostIdx >= 0 && packQtyIdx >= 0) {
      const pc = parseNumberCell(r[packCostIdx] ?? ''); const pq = parseNumberCell(r[packQtyIdx] ?? '');
      if (pc !== null && pq !== null && pc >= 0 && pq > 0) cost = Math.round((pc / pq) * 10000) / 10000;
    }
    const unitRaw = get('countUnit');
    const countUnit = unitRaw ? parseUnit(unitRaw) : undefined;
    if (unitRaw && !countUnit) issues.push('badUnit');
    // Every number is read before the row is built, so its problems reach `issues`.
    const sellingPrice = num('sellingPrice');
    const reorderLevel = num('reorderLevel');
    const target = num('target');
    out.push({
      line: i + 1, name, barcodes, issues: [...new Set(issues)],
      ...(cleanText(get('sku'), 64) ? { sku: cleanText(get('sku'), 64) } : {}),
      ...(cleanText(get('category')) ? { category: cleanText(get('category')) } : {}),
      ...(cleanText(get('supplier')) ? { supplier: cleanText(get('supplier')) } : {}),
      ...(cleanText(get('location')) ? { location: cleanText(get('location')) } : {}),
      ...(caseQuantity !== undefined ? { caseQuantity } : {}),
      ...(countUnit ? { countUnit } : {}),
      ...(cost !== undefined ? { cost } : {}),
      ...(sellingPrice !== undefined ? { sellingPrice } : {}),
      ...(reorderLevel !== undefined ? { reorderLevel } : {}),
      ...(target !== undefined ? { target } : {}),
    });
  }
  return out;
}

// ─── Classification ──────────────────────────────────────────────────────────

export type RowClass =
  | { kind: 'new'; row: ImportRow }
  | { kind: 'match'; row: ImportRow; productId: string; by: 'barcode' | 'sku' | 'family' }
  | { kind: 'attention'; row: ImportRow };

export function classifyRows(rows: ImportRow[], index: CatalogIndex): RowClass[] {
  const seenCode = new Set<string>(); const seenSku = new Set<string>(); const seenFam = new Set<string>();
  const matchedProducts = new Set<string>();
  const byFamily = new Map<string, string>();
  for (const p of index.byId.values()) if (p.status === 'active') byFamily.set(p.familyProductId, p.id);
  return rows.map(row => {
    const issues = [...row.issues];
    const codes = row.barcodes.map(b => normalizeBarcode(b.code)).filter(Boolean);
    if (new Set(codes).size !== codes.length) issues.push('badBarcode'); // one code twice in the same product
    const sku = normalizeSku(row.sku);
    const dup = codes.some(c => seenCode.has(c)) || (sku && seenSku.has(sku)) || (row.familyProductId && seenFam.has(row.familyProductId));
    codes.forEach(c => seenCode.add(c));
    if (sku) seenSku.add(sku);
    if (row.familyProductId) seenFam.add(row.familyProductId);
    if (dup) issues.push('duplicateInFile');
    const byCode = codes.flatMap(c => [c, ...barcodeAliases(c)]).map(c => index.byBarcode.get(c)).find(Boolean);
    const bySku = sku ? index.bySku.get(sku) : undefined;
    const byFam = row.familyProductId ? byFamily.get(row.familyProductId) : undefined;
    const matches = new Set([byCode, bySku, byFam].filter(Boolean) as string[]);
    if (matches.size > 1) issues.push('ambiguousMatch');
    // Two rows pointing at the same existing product: only the first may apply.
    for (const id of matches) { if (matchedProducts.has(id)) issues.push('duplicateInFile'); matchedProducts.add(id); }
    const final = { ...row, issues: [...new Set(issues)] };
    if (final.issues.length) return { kind: 'attention', row: final };
    if (byCode) return { kind: 'match', row: final, productId: byCode, by: 'barcode' };
    if (bySku) return { kind: 'match', row: final, productId: bySku, by: 'sku' };
    if (byFam) return { kind: 'match', row: final, productId: byFam, by: 'family' };
    return { kind: 'new', row: final };
  });
}

export interface ImportSummary { newRows: number; matched: number; attention: number }

export function summarise(classes: RowClass[]): ImportSummary {
  return {
    newRows: classes.filter(c => c.kind === 'new').length,
    matched: classes.filter(c => c.kind === 'match').length,
    attention: classes.filter(c => c.kind === 'attention').length,
  };
}

// ─── Plan + apply ────────────────────────────────────────────────────────────

export interface CatalogState { products: Product[]; categories: Category[]; suppliers: Supplier[]; locations: StockLocation[] }

export interface ImportPlanResult {
  next: CatalogState;
  added: number;
  updated: number;
  skipped: number;
  skippedForLimit: number;
  /** Rows accepted by review but refused while planning (a code / SKU now owned elsewhere, invalid field). */
  refusedRows: ImportRow[];
}

const nameCache = new WeakMap<object, Map<string, string>>();

function findOrCreate<T extends { id: string; name: string; status: string; createdAt: string; updatedAt: string }>(
  list: T[], name: string | undefined, prefix: string, now: string,
): string | undefined {
  if (!name) return undefined;
  let cache = nameCache.get(list);
  if (!cache) {
    cache = new Map(list.filter(r => r.status === 'active').map(r => [normalizeName(r.name), r.id]));
    nameCache.set(list, cache);
  }
  const key = normalizeName(name);
  const hit = cache.get(key);
  if (hit) return hit;
  const rec = { id: newId(prefix), name, status: 'active', createdAt: now, updatedAt: now } as T;
  list.push(rec);
  cache.set(key, rec.id);
  return rec.id;
}

function barcodesFor(row: ImportRow): Product['barcodes'] {
  const out = row.barcodes.map(b => makeBarcode(newId('b'), b.code, b.role, b.units));
  return out;
}

/**
 * Build the next catalogue. Creates stop at `allowance` (Free cap). Updates happen only
 * when `updateMatched` is true and only fill the fields the file provides; identity
 * (id, familyProductId) and history are never touched.
 */
export function planImport(classes: RowClass[], state: CatalogState, opts: { updateMatched: boolean; allowance: number; now: string }): ImportPlanResult {
  const categories = [...state.categories];
  const suppliers = [...state.suppliers];
  const locations = [...state.locations];
  const products = [...state.products];
  const position = new Map(products.map((p, i) => [p.id, i]));
  // Incremental uniqueness sets (O(1) per row — never rebuild the whole index per row).
  const codeOwner = new Map<string, string>();
  const skuOwner = new Map<string, string>();
  for (const p of products) {
    if (p.status !== 'active') continue;
    for (const b of p.barcodes) if (b.normalizedCode && !codeOwner.has(b.normalizedCode)) codeOwner.set(b.normalizedCode, p.id);
    const sku = normalizeSku(p.sku);
    if (sku && !skuOwner.has(sku)) skuOwner.set(sku, p.id);
  }
  const conflicts = (p: Product): boolean => {
    if (validateProduct([], p).length) return true; // field checks only
    const sku = normalizeSku(p.sku);
    if (sku && skuOwner.has(sku) && skuOwner.get(sku) !== p.id) return true;
    return p.barcodes.some(b => codeOwner.has(b.normalizedCode) && codeOwner.get(b.normalizedCode) !== p.id);
  };
  const claim = (p: Product) => {
    for (const b of p.barcodes) codeOwner.set(b.normalizedCode, p.id);
    const sku = normalizeSku(p.sku);
    if (sku) skuOwner.set(sku, p.id);
  };
  let added = 0; let updated = 0; let skipped = 0; let skippedForLimit = 0;
  const refusedRows: ImportRow[] = [];
  // A family id already used by any product (archived included) is never given to a second one.
  const familyTaken = new Set(products.map(p => p.familyProductId));
  // Categories / suppliers / locations are created only for rows that are actually applied.
  const mark = () => [categories.length, suppliers.length, locations.length] as const;
  const rollback = (m: readonly [number, number, number]) => {
    for (const [list, n] of [[categories, m[0]], [suppliers, m[1]], [locations, m[2]]] as const) {
      while (list.length > n) {
        const gone = (list as { id: string; name: string }[]).pop()!;
        nameCache.get(list)?.delete(normalizeName(gone.name));
      }
    }
  };
  for (const c of classes) {
    if (c.kind === 'attention') { skipped++; continue; }
    const r = c.row;
    if (c.kind === 'match' && !opts.updateMatched) { skipped++; continue; }
    if (c.kind === 'new' && added >= opts.allowance) { skippedForLimit++; continue; }
    const before = mark();
    const refs = {
      categoryId: findOrCreate(categories, r.category, 'c', opts.now),
      supplierId: findOrCreate(suppliers, r.supplier, 's', opts.now),
      locationId: findOrCreate(locations, r.location, 'l', opts.now),
    };
    if (c.kind === 'match') {
      const at = position.get(c.productId);
      const prev = at === undefined ? undefined : products[at];
      if (!prev || at === undefined) { skipped++; continue; }
      const have = new Set(prev.barcodes.map(b => b.normalizedCode));
      const extraCodes = barcodesFor(r).filter(b => !have.has(b.normalizedCode));
      const next: Product = {
        ...prev,
        name: r.name || prev.name,
        ...(r.sku ? { sku: r.sku } : {}),
        barcodes: [...prev.barcodes, ...extraCodes],
        ...(refs.categoryId ? { categoryId: refs.categoryId } : {}),
        ...(refs.supplierId ? { supplierId: refs.supplierId } : {}),
        ...(refs.locationId ? { locationId: refs.locationId } : {}),
        ...(r.countUnit ? { countUnit: r.countUnit } : {}),
        ...(r.caseQuantity ? { caseQuantity: r.caseQuantity } : {}),
        ...(r.cost !== undefined ? { costPrice: r.cost } : {}),
        ...(r.sellingPrice !== undefined ? { sellingPrice: r.sellingPrice } : {}),
        ...(r.reorderLevel !== undefined ? { reorderLevel: r.reorderLevel } : {}),
        ...(r.target !== undefined ? { targetStock: r.target } : {}),
        updatedAt: opts.now,
      };
      if (conflicts(next)) { rollback(before); skipped++; refusedRows.push(r); continue; }
      products[at] = next;
      claim(next);
      updated++;
      continue;
    }
    const product: Product = {
      id: newId('p'),
      familyProductId: r.familyProductId && !familyTaken.has(r.familyProductId) ? r.familyProductId : uuid(),
      name: r.name,
      ...(r.sku ? { sku: r.sku } : {}),
      barcodes: barcodesFor(r),
      ...(refs.categoryId ? { categoryId: refs.categoryId } : {}),
      ...(refs.supplierId ? { supplierId: refs.supplierId } : {}),
      ...(refs.locationId ? { locationId: refs.locationId } : {}),
      countUnit: r.countUnit ?? 'each',
      ...(r.caseQuantity ? { caseQuantity: r.caseQuantity } : {}),
      ...(r.cost !== undefined ? { costPrice: r.cost } : {}),
      ...(r.sellingPrice !== undefined ? { sellingPrice: r.sellingPrice } : {}),
      ...(r.reorderLevel !== undefined ? { reorderLevel: r.reorderLevel } : {}),
      ...(r.target !== undefined ? { targetStock: r.target } : {}),
      status: 'active',
      createdAt: opts.now,
      updatedAt: opts.now,
    };
    if (conflicts(product)) { rollback(before); skipped++; refusedRows.push(r); continue; }
    familyTaken.add(product.familyProductId);
    position.set(product.id, products.length);
    products.push(product);
    claim(product);
    added++;
  }
  return { next: { products, categories, suppliers, locations }, added, updated, skipped, skippedForLimit, refusedRows };
}

export const COUNT_UNIT_VALUES = COUNT_UNITS;
