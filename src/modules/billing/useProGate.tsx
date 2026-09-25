/**
 * useProGate — screens ask `gate.allow(kind)` before a gated action. When Free blocks it,
 * the "Free limit reached" state (Figma state 02) explains which limit was hit and offers
 * Upgrade / Not now. Existing data is never locked.
 */
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StateDialog } from '../../ui/overlays';
import { useNav } from '../../navigation/nav';
import { getState } from '../../state/store';
import { checkLimit, LIMIT_CAPS, type LimitKind } from './limits';
import { useTier } from './useTier';

/** Sample records are marked isSample AND carry a `sample_` id; anything else counts. */
const isRealSample = (r: { id: string; isSample?: boolean }) => !!r.isSample && r.id.startsWith('sample_');

/**
 * Products that count toward the Free cap: every real product still in the catalogue,
 * archived included — archiving does not free a slot (restoring it stays free), deleting does.
 */
export function realActiveProductCount(): number {
  return getState().products.filter(p => !isRealSample(p)).length;
}

function currentCountFor(kind: LimitKind): number {
  const s = getState();
  if (kind === 'products') return realActiveProductCount();
  if (kind === 'favourites') return s.favourites.filter(f => !isRealSample(f)).length;
  return 0;
}

export function useProGate(): { allow: (kind: LimitKind, ctx?: Record<string, unknown>) => boolean; sheet: React.ReactNode; tier: 'free' | 'pro' } {
  const { t } = useTranslation();
  const nav = useNav();
  const tier = useTier();
  const [blocked, setBlocked] = useState<LimitKind | null>(null);

  const allow = useCallback((kind: LimitKind) => {
    const r = checkLimit(tier, kind, currentCountFor(kind));
    if (!r.allowed) setBlocked(kind);
    return r.allowed;
  }, [tier]);

  const cap = blocked ? LIMIT_CAPS[blocked] : null;
  const sheet = (
    <StateDialog
      visible={!!blocked}
      tone="info"
      title={t('states.freeLimit.title')}
      body={blocked ? t(`states.freeLimit.body.${blocked}`, { n: typeof cap === 'number' ? cap : '' }) : ''}
      onDismiss={() => setBlocked(null)}
      testID="state-free-limit"
      actions={[
        { label: t('states.freeLimit.upgrade'), onPress: () => { const reason = blocked ?? undefined; setBlocked(null); nav.navigate('Pro', { reason }); }, testID: 'free-limit-upgrade' },
        { label: t('states.freeLimit.notNow'), onPress: () => setBlocked(null), testID: 'free-limit-not-now' },
      ]}
    />
  );
  return { allow, sheet, tier };
}
