/**
 * limits.ts — THE Free/Pro gating layer (handoff §14: "one authoritative
 * src/modules/billing/limits.ts, no screen magic numbers"). Adapted from the donor
 * checkLimit (TillCalc F02).
 *
 * PROVISIONAL caps — OWNER DECISION BEFORE STORE (docs/OWNER_DECISIONS.md OD-02).
 * A cap only blocks a NEW gated action. Existing products, counts, history, restore and
 * backup are never locked by a cap.
 */
export type Tier = 'free' | 'pro';

export type LimitKind =
  | 'products'        // create one more active product (manual, scan, import creates)
  | 'favourites'      // save one more favourite count
  | 'reportExport'    // PDF / CSV reports (Pro-only)
  | 'familyExport'    // Till-family transfer file (Pro-only)
  | 'countScope';     // start a count (always allowed; kept so every count start asks the gate)

export const FREE_CAPS = {
  products: 100,
  favourites: 1,
} as const;

export const LIMIT_CAPS: Record<LimitKind, number | null | 'unlimited'> = {
  products: FREE_CAPS.products,
  favourites: FREE_CAPS.favourites,
  reportExport: null,
  familyExport: null,
  countScope: 'unlimited',
};

export interface LimitResult { allowed: boolean; remaining: number; limit: number | null }

const UNLIMITED: LimitResult = { allowed: true, remaining: Infinity, limit: null };

/**
 * May ONE more `kind` action happen when `currentCount` already exist?
 * Pro is never limited. Missing / negative / non-finite counts are treated as AT the cap,
 * so a bad count can never unlock a Pro-scale action on Free.
 */
export function checkLimit(tier: Tier, kind: LimitKind, currentCount = 0): LimitResult {
  if (tier === 'pro') return UNLIMITED;
  const cap = LIMIT_CAPS[kind];
  if (cap === 'unlimited') return UNLIMITED;
  if (cap === null) return { allowed: false, remaining: 0, limit: null };
  const used = Number.isFinite(currentCount) && currentCount >= 0 ? Math.floor(currentCount) : cap;
  const remaining = Math.max(0, cap - used);
  return { allowed: remaining > 0, remaining, limit: cap };
}

/** How many of `wanted` new products may be created now (imports create up to this many). */
export function productAllowance(tier: Tier, activeRealProducts: number): number {
  const r = checkLimit(tier, 'products', activeRealProducts);
  return r.remaining;
}
