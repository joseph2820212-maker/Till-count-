/**
 * quantity.ts — quantity rules (handoff §9).
 *  - zero is valid, negative / NaN / infinite are not
 *  - "each" is a whole number; kg / g / l / ml may be decimal
 *  - case + pack + loose converts deterministically to base units
 * Measured values are rounded to 3 decimal places so 0.1 + 0.2 never stores 0.30000000000000004.
 */
import type { CountUnit, Product } from './types';

export const MEASURED_DECIMALS = 3;
export const MAX_QUANTITY = 1_000_000_000;

export function isMeasuredUnit(unit: CountUnit): boolean {
  return unit !== 'each';
}

export function roundForUnit(value: number, unit: CountUnit): number {
  if (!isMeasuredUnit(unit)) return Math.round(value);
  const f = 10 ** MEASURED_DECIMALS;
  return Math.round((value + Number.EPSILON) * f) / f;
}

export type QuantityError = 'empty' | 'notNumber' | 'negative' | 'notWhole' | 'tooLarge';

/**
 * Parse user-typed quantity text. Accepts Western and Eastern-Arabic digits, the Arabic
 * decimal mark and a sole decimal comma. Rejects signs, exponents, thousands separators.
 */
export function parseQuantityText(text: string): number | null {
  let s = String(text ?? '').trim();
  if (!s) return null;
  s = s.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/٫/g, '.');
  if (!s.includes('.') && /^\d+,\d+$/.test(s)) s = s.replace(',', '.');
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function validateQuantity(value: number | null | undefined, unit: CountUnit): QuantityError | null {
  if (value === null || value === undefined) return 'empty';
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'notNumber';
  if (value < 0) return 'negative';
  if (value > MAX_QUANTITY) return 'tooLarge';
  if (!isMeasuredUnit(unit) && !Number.isInteger(value)) return 'notWhole';
  return null;
}

export function isValidQuantity(value: unknown, unit: CountUnit): value is number {
  return validateQuantity(value as number, unit) === null;
}

/** Units in one case / one pack, taken from the product's case / pack barcodes (largest wins if several). */
export function packUnitsOf(product: Pick<Product, 'barcodes' | 'caseQuantity' | 'packQuantity'>, role: 'pack' | 'case'): number | null {
  let best: number | null = null;
  const declared = role === 'case' ? product.caseQuantity : product.packQuantity;
  if (typeof declared === 'number' && Number.isFinite(declared) && declared > 0) best = declared;
  for (const b of product.barcodes) {
    if (b.role !== role) continue;
    if (!(Number.isFinite(b.unitsPerBarcode) && b.unitsPerBarcode > 0)) continue;
    if (best === null || b.unitsPerBarcode > best) best = b.unitsPerBarcode;
  }
  return best;
}

export interface CaseLooseInput { caseCount?: number; packCount?: number; looseCount?: number }
export type ConversionError = 'invalidCount' | 'missingCaseUnits' | 'missingPackUnits';

/**
 * total = caseCount × caseUnits + packCount × packUnits + looseCount.
 * A case / pack count > 0 without a valid units-per value is an error, never a silent zero.
 */
export function caseLooseTotal(
  input: CaseLooseInput,
  caseUnits: number | null,
  packUnits: number | null,
  unit: CountUnit,
): { ok: true; total: number } | { ok: false; error: ConversionError } {
  const parts = [input.caseCount ?? 0, input.packCount ?? 0, input.looseCount ?? 0];
  for (const p of parts) if (!Number.isFinite(p) || p < 0) return { ok: false, error: 'invalidCount' };
  if ((input.caseCount ?? 0) > 0 && !(caseUnits != null && caseUnits > 0)) return { ok: false, error: 'missingCaseUnits' };
  if ((input.packCount ?? 0) > 0 && !(packUnits != null && packUnits > 0)) return { ok: false, error: 'missingPackUnits' };
  if (!Number.isInteger(input.caseCount ?? 0) || !Number.isInteger(input.packCount ?? 0)) return { ok: false, error: 'invalidCount' };
  // Loose items of a counted product are whole units (never rounded away).
  if (!isMeasuredUnit(unit) && !Number.isInteger(input.looseCount ?? 0)) return { ok: false, error: 'invalidCount' };
  const total = (input.caseCount ?? 0) * (caseUnits ?? 0) + (input.packCount ?? 0) * (packUnits ?? 0) + (input.looseCount ?? 0);
  const rounded = roundForUnit(total, unit);
  if (validateQuantity(rounded, unit)) return { ok: false, error: 'invalidCount' };
  return { ok: true, total: rounded };
}

/** Add a delta to an existing quantity (repeated scan). */
export function addQuantity(current: number, delta: number, unit: CountUnit): number {
  return roundForUnit((Number.isFinite(current) ? current : 0) + delta, unit);
}
