/**
 * bypass.ts — the ONE QA billing bypass rule (handoff §14).
 *
 * The review APK is built with APP_VARIANT=review and EXPO_PUBLIC_BILLING_BYPASS=1, which
 * unlocks Pro without a store account. It can never ship in production:
 *  - app.config.js runs scripts/buildGuard.js on every config read and REFUSES a
 *    production build that sets the bypass (or a review build carrying RevenueCat keys);
 *  - at runtime the bypass also requires the review variant marker and NO RevenueCat key,
 *    so a store build (which always carries a key) cannot honour it.
 * `npm run verify` re-checks the guard (scripts/verify.mjs).
 */
import { getRevenueCatApiKey } from './billingConfig';

export function isReviewVariant(): boolean {
  return process.env.EXPO_PUBLIC_APP_VARIANT === 'review';
}

export function isBypassActive(): boolean {
  const requested = process.env.EXPO_PUBLIC_BILLING_BYPASS === '1';
  return requested && isReviewVariant() && !getRevenueCatApiKey();
}
