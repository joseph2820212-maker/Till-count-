/**
 * reports.ts — rows and HTML for the four reports (handoff §12): completed-count PDF,
 * reorder PDF, product CSV, reorder CSV. One place builds each; the preview screens and
 * the share action read the same data, so a preview never differs from its file.
 */
import i18n from '../../i18n';
import { escapeHtml } from '../../utils/htmlEscape';
import { formatDate, formatMoney, formatQty, unitLabel } from '../../utils/format';
import { groupBySupplier, type ReorderLine } from '../../domain/reorderEngine';
import { sessionStockValue } from '../../domain/stockValue';
import type { Lookups } from '../../domain/countEngine';
import type { CountSession, Product, ProductCountSnapshot, Supplier } from '../../domain/types';
import { APP_NAME } from '../../appMeta';

type Cell = string | number | null | undefined;

export function productsCsvRows(products: readonly Product[], lookups: Lookups, snapshots: Readonly<Record<string, ProductCountSnapshot>>): Cell[][] {
  const header = ['name', 'sku', 'barcode', 'category', 'supplier', 'location', 'count_unit', 'case_quantity', 'cost_price', 'selling_price', 'reorder_level', 'target_stock', 'last_counted_quantity', 'last_counted_at', 'family_product_id'];
  const rows = products.filter(p => p.status === 'active').sort((a, b) => a.name.localeCompare(b.name)).map(p => {
    const snap = snapshots[p.id];
    const caseCode = p.barcodes.find(b => b.role === 'case');
    return [
      p.name, p.sku ?? '', p.barcodes.find(b => b.role === 'single')?.code ?? p.barcodes[0]?.code ?? '',
      p.categoryId ? lookups.categories.get(p.categoryId)?.name ?? '' : '',
      p.supplierId ? lookups.suppliers.get(p.supplierId)?.name ?? '' : '',
      p.locationId ? lookups.locations.get(p.locationId)?.name ?? '' : '',
      p.countUnit, p.caseQuantity ?? caseCode?.unitsPerBarcode ?? '',
      p.costPrice ?? '', p.sellingPrice ?? '', p.reorderLevel ?? '', p.targetStock ?? '',
      snap ? snap.quantityBase : '', snap ? snap.countedAt : '', p.familyProductId,
    ];
  });
  return [header, ...rows];
}

export function reorderCsvRows(lines: readonly ReorderLine[], suppliers: ReadonlyMap<string, Supplier>): Cell[][] {
  const t = i18n.t.bind(i18n);
  const header = [t('csv.product'), t('csv.supplier'), t('csv.count'), t('csv.target'), t('csv.order'), t('csv.unit'), t('csv.status')];
  const rows: Cell[][] = [];
  for (const g of groupBySupplier(lines, suppliers)) {
    for (const l of g.lines) {
      rows.push([l.product.name, g.supplierName ?? t('reorder.noSupplier'), l.latestQuantity ?? '', l.product.targetStock ?? '', l.suggestedOrder ?? '', l.product.countUnit, l.status]);
    }
  }
  return [header, ...rows];
}

export function csvFileStamp(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}_${p(now.getHours())}${p(now.getMinutes())}`;
}

const A4_STYLE = `
  @page { size: A4; margin: 16mm 14mm; }
  body { font-family: -apple-system, Roboto, 'Segoe UI', Arial, sans-serif; color: #1A2540; font-size: 11pt; }
  h1 { font-size: 16pt; margin: 0 0 4px; } h2 { font-size: 13pt; margin: 18px 0 6px; }
  .muted { color: #5B6476; } .faint { color: #8A8E9F; font-size: 9pt; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: start; background: #1A2540; color: #fff; font-size: 9pt; padding: 6px 8px; }
  td { padding: 6px 8px; border-bottom: 1px solid #EBE7DE; font-size: 10pt; }
  td.num, th.num { text-align: end; direction: ltr; unicode-bidi: embed; }
  .note { background: #E3E9F3; padding: 8px 10px; border-radius: 6px; margin-top: 12px; font-size: 9pt; }
`;

function doc(title: string, body: string): string {
  const lang = (i18n.language || 'en').split('-')[0];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  return `<!DOCTYPE html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${A4_STYLE}</style></head><body>${body}</body></html>`;
}

export interface CountReportData {
  title: string;
  scope: string;
  generatedAt: string;
  completedAt?: string;
  products: number;
  units: number;
  low: number;
  out: number;
  stockValue: string;
  missingCost: number;
  lines: { name: string; qty: string }[];
}

export function countReportData(session: CountSession, scope: string, attention: { out: number; low: number }, now = new Date()): CountReportData {
  const value = sessionStockValue(session.entries);
  const entries = [...session.entries].sort((a, b) => a.productName.localeCompare(b.productName));
  return {
    title: i18n.t('pdf.countTitle', { scope }),
    scope,
    generatedAt: formatDate(now.toISOString()),
    completedAt: session.completedAt,
    products: session.entries.length,
    units: session.entries.reduce((n, e) => (e.countUnit === 'each' ? n + e.quantityBase : n), 0),
    low: attention.low,
    out: attention.out,
    stockValue: formatMoney(value.total),
    missingCost: value.missingCostCount,
    lines: entries.map(e => ({ name: e.productName, qty: e.countUnit === 'each' ? formatQty(e.quantityBase, 'each') : `${formatQty(e.quantityBase, e.countUnit)} ${unitLabel(e.countUnit)}` })),
  };
}

export function countReportHtml(d: CountReportData): string {
  const t = i18n.t.bind(i18n);
  const rows = d.lines.map(l => `<tr><td>${escapeHtml(l.name)}</td><td class="num">${escapeHtml(l.qty)}</td></tr>`).join('');
  return doc(d.title, `
    <h1>${escapeHtml(APP_NAME)}</h1>
    <h2>${escapeHtml(d.title)}</h2>
    <div class="faint">${escapeHtml(t('pdf.generated', { date: d.generatedAt }))}${d.completedAt ? ` · ${escapeHtml(t('pdf.completed', { date: formatDate(d.completedAt) }))}` : ''}</div>
    <p class="muted">${escapeHtml(t('pdf.productsUnits', { products: d.products, units: d.units }))}<br/>
    ${escapeHtml(t('pdf.lowOut', { low: d.low, out: d.out }))}<br/>
    ${escapeHtml(t('pdf.stockValue', { value: d.stockValue }))}</p>
    <table><thead><tr><th>${escapeHtml(t('csv.product'))}</th><th class="num">${escapeHtml(t('pdf.counted'))}</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="note">${escapeHtml(t('pdf.valueNote'))}${d.missingCost ? ` ${escapeHtml(t('pdf.missingCost', { n: d.missingCost }))}` : ''}</div>
  `);
}

export interface ReorderReportData {
  title: string;
  generatedAt: string;
  count: number;
  groups: { supplier: string; lines: { name: string; qty: string }[] }[];
}

export function reorderReportData(lines: readonly ReorderLine[], suppliers: ReadonlyMap<string, Supplier>, supplierLabel: string | null, now = new Date()): ReorderReportData {
  const groups = groupBySupplier(lines, suppliers).map(g => ({
    supplier: g.supplierName ?? i18n.t('reorder.noSupplier'),
    lines: g.lines.map(l => ({
      name: l.product.name,
      qty: l.suggestedOrder !== null ? (l.product.countUnit === 'each' ? formatQty(l.suggestedOrder, 'each') : `${formatQty(l.suggestedOrder, l.product.countUnit)} ${unitLabel(l.product.countUnit)}`) : i18n.t('reorder.setTarget'),
    })),
  }));
  return {
    title: supplierLabel ? i18n.t('pdf.reorderTitleSupplier', { supplier: supplierLabel }) : i18n.t('pdf.reorderTitle'),
    generatedAt: formatDate(now.toISOString()),
    count: lines.length,
    groups,
  };
}

export function reorderReportHtml(d: ReorderReportData): string {
  const t = i18n.t.bind(i18n);
  const tables = d.groups.map(g => `
    <h2>${escapeHtml(g.supplier)}</h2>
    <table><thead><tr><th>${escapeHtml(t('csv.product'))}</th><th class="num">${escapeHtml(t('csv.order'))}</th></tr></thead>
    <tbody>${g.lines.map(l => `<tr><td>${escapeHtml(l.name)}</td><td class="num">${escapeHtml(l.qty)}</td></tr>`).join('')}</tbody></table>`).join('');
  return doc(d.title, `
    <h1>${escapeHtml(APP_NAME)}</h1>
    <h2>${escapeHtml(d.title)}</h2>
    <div class="faint">${escapeHtml(t('pdf.generated', { date: d.generatedAt }))}</div>
    <p class="muted">${escapeHtml(t('pdf.itemsToOrder', { count: d.count }))}</p>
    ${tables}
    <div class="note">${escapeHtml(t('pdf.reorderNote'))}</div>
  `);
}
