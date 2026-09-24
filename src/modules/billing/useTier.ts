import { useBilling } from './BillingProvider';
import { isBillingPremiumForApp } from './billingConfig';
import { isBypassActive } from './bypass';
import type { Tier } from './limits';

/**
 * Free or Pro for gating decisions. A failed entitlement check never turns a paying
 * user into a free one for data they already have — callers gate only NEW actions.
 */
export function useTier(): Tier {
  const billing = useBilling();
  if (isBypassActive()) return 'pro';
  return isBillingPremiumForApp(billing.entitlement.isPremium, billing.status) ? 'pro' : 'free';
}
