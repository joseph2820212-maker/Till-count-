/**
 * stockValue.ts — "stock cost value" (handoff §9): the sum of valid quantity × valid
 * entered cost only. Products without a valid cost are counted as "missing cost", never
 * as zero value. Label everywhere: "Based on the cost prices you entered. Not a formal
 * accounting valuation."
 */
import type { CountEntry } from './types';

export interface StockValue {
  total: number;
  valuedCount: number;
  missingCostCount: number;
}

function valid(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0;
}

export function stockValueOf(items: readonly { quantity: number | null | undefined; cost: number | null | undefined }[]): StockValue {
  let total = 0; let valuedCount = 0; let missingCostCount = 0;
  for (const it of items) {
    if (!valid(it.quantity)) continue;
    if (!valid(it.cost)) { missingCostCount++; continue; }
    total += it.quantity * it.cost;
    valuedCount++;
  }
  return { total: Math.round(total * 100) / 100, valuedCount, missingCostCount };
}

/** Value of one completed count, using the cost captured at count time. */
export function sessionStockValue(entries: readonly CountEntry[]): StockValue {
  return stockValueOf(entries.map(e => ({ quantity: e.quantityBase, cost: e.costPriceAtCount })));
}
