/**
 * familyTransfer.ts — the Till-family product transfer file (handoff §12):
 *
 *   { "schema": "till.product-transfer", "version": 1, "exportedBy": "TillCount",
 *     "createdAt": ISO-8601, "products": [...] }
 *
 * Carries product identity only: familyProductId, name, SKU, barcodes (role + units),
 * category, supplier, pack / case quantity, count unit, cost and selling price. Never
 * count history, billing state, settings or any backup password. The apps never read
 * each other's storage; the user moves the file.
 */
import { isAcceptableBarcode } from '../../domain/barcode';
import { BARCODE_ROLES, COUNT_UNITS, type BarcodeRole, type CountUnit, type Product } from '../../domain/types';
import type { Lookups } from '../../domain/countEngine';
import type { ImportRow } from './productImport';

export const TRANSFER_SCHEMA = 'till.product-transfer';
export const TRANSFER_VERSION = 1;
export const MAX_TRANSFER_BYTES = 10 * 1024 * 1024;
export const MAX_TRANSFER_PRODUCTS = 50_000;

export type FamilyApp = 'TillCalc' | 'TillLabel' | 'TillExpiry';

export interface TransferProduct {
  familyProductId: string;
  name: string;
  sku?: string;
  barcodes: { code: string; role: BarcodeRole; unitsPerBarcode: number }[];
  category?: string;
  supplier?: string;
  caseQuantity?: number;
  packQuantity?: number;
  countUnit?: CountUnit;
  costPrice?: number;
  sellingPrice?: number;
}

export interface TransferFile {
  schema: typeof TRANSFER_SCHEMA;
  version: number;
  exportedBy: string;
  createdAt: string;
  products: TransferProduct[];
}

export function buildTransfer(products: readonly Product[], lookups: Lookups, now = new Date()): TransferFile {
  return {
    schema: TRANSFER_SCHEMA,
    version: TRANSFER_VERSION,
    exportedBy: 'TillCount',
    createdAt: now.toISOString(),
    products: products.filter(p => p.status === 'active' && !p.isSample).map(p => ({
      familyProductId: p.familyProductId,
      name: p.name,
      ...(p.sku ? { sku: p.sku } : {}),
      barcodes: p.barcodes.map(b => ({ code: b.code, role: b.role, unitsPerBarcode: b.unitsPerBarcode })),
      ...(p.categoryId && lookups.categories.get(p.categoryId) ? { category: lookups.categories.get(p.categoryId)!.name } : {}),
      ...(p.supplierId && lookups.suppliers.get(p.supplierId) ? { supplier: lookups.suppliers.get(p.supplierId)!.name } : {}),
      ...(p.caseQuantity ? { caseQuantity: p.caseQuantity } : {}),
      ...(p.packQuantity ? { packQuantity: p.packQuantity } : {}),
      countUnit: p.countUnit,
      ...(p.costPrice !== undefined ? { costPrice: p.costPrice } : {}),
      ...(p.sellingPrice !== undefined ? { sellingPrice: p.sellingPrice } : {}),
    })),
  };
}

export function transferFileName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `TillCount_Products_${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}_${p(now.getHours())}${p(now.getMinutes())}.json`;
}

export type TransferError = 'tooLarge' | 'invalidJson' | 'wrongSchema' | 'futureVersion' | 'invalidProducts' | 'tooManyProducts';

export class TransferParseError extends Error {
  readonly code: TransferError;
  constructor(code: TransferError) { super(code); this.name = 'TransferParseError'; this.code = code; }
}

const str = (v: unknown, max = 200): v is string => typeof v === 'string' && v.length <= max;
const nonNeg = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/** Parse + validate a transfer file into import rows. Unknown fields are ignored. */
export function parseTransfer(text: string): ImportRow[] {
  if (text.length > MAX_TRANSFER_BYTES) throw new TransferParseError('tooLarge');
  let data: unknown;
  try { data = JSON.parse(text.replace(/^﻿/, '')); } catch { throw new TransferParseError('invalidJson'); }
  const f = data as Partial<TransferFile>;
  if (!f || typeof f !== 'object' || f.schema !== TRANSFER_SCHEMA) throw new TransferParseError('wrongSchema');
  if (typeof f.version !== 'number' || f.version > TRANSFER_VERSION || f.version < 1) throw new TransferParseError('futureVersion');
  if (!Array.isArray(f.products)) throw new TransferParseError('invalidProducts');
  if (f.products.length > MAX_TRANSFER_PRODUCTS) throw new TransferParseError('tooManyProducts');
  return f.products.map((raw, i): ImportRow => {
    const p = (raw ?? {}) as unknown as Record<string, unknown>;
    const issues: ImportRow['issues'] = [];
    const name = str(p.name) ? p.name.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, 120) : '';
    if (!name) issues.push('missingName');
    const barcodes: ImportRow['barcodes'] = [];
    if (Array.isArray(p.barcodes)) {
      for (const b of p.barcodes as Record<string, unknown>[]) {
        const role = BARCODE_ROLES.includes(b?.role as BarcodeRole) ? (b.role as BarcodeRole) : 'single';
        const units = role === 'single' ? 1 : Number(b?.unitsPerBarcode);
        if (!str(b?.code, 64) || !isAcceptableBarcode(b.code)) { issues.push('badBarcode'); continue; }
        if (!(Number.isInteger(units) && units > 0)) { issues.push('badCaseQuantity'); continue; }
        barcodes.push({ code: b.code.trim(), role, units });
      }
    }
    const unit = COUNT_UNITS.includes(p.countUnit as CountUnit) ? (p.countUnit as CountUnit) : undefined;
    if (p.countUnit !== undefined && !unit) issues.push('badUnit');
    const caseQ = p.caseQuantity !== undefined ? Number(p.caseQuantity) : undefined;
    if (caseQ !== undefined && !(Number.isInteger(caseQ) && caseQ > 0)) issues.push('badCaseQuantity');
    for (const k of ['costPrice', 'sellingPrice'] as const) if (p[k] !== undefined && !nonNeg(p[k])) issues.push('badNumber');
    const fam = str(p.familyProductId, 80) && p.familyProductId.trim() ? p.familyProductId.trim() : undefined;
    return {
      line: i + 1,
      name,
      barcodes,
      issues: [...new Set(issues)],
      ...(fam ? { familyProductId: fam } : {}),
      ...(str(p.sku, 64) && p.sku.trim() ? { sku: p.sku.trim() } : {}),
      ...(str(p.category) && p.category.trim() ? { category: p.category.trim() } : {}),
      ...(str(p.supplier) && p.supplier.trim() ? { supplier: p.supplier.trim() } : {}),
      ...(caseQ !== undefined && Number.isInteger(caseQ) && caseQ > 0 ? { caseQuantity: caseQ } : {}),
      ...(unit ? { countUnit: unit } : {}),
      ...(nonNeg(p.costPrice) ? { cost: p.costPrice } : {}),
      ...(nonNeg(p.sellingPrice) ? { sellingPrice: p.sellingPrice } : {}),
    };
  });
}
