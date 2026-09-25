/** 67 TillCount Pro (29:1492) · 68 Restore purchase (29:1526) */
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../../ui/Text';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../../components/AppButton';
import { Card, Helper, Screen, SectionTitle, StateCard } from '../../../ui/kit';
import { tc } from '../../../theme/colors';
import { tcType } from '../../../theme/typography';
import { useNav, useParams } from '../../../navigation/nav';
import { useBilling } from '../BillingProvider';
import { BILLING_PACKAGE_IDS, isLifetimeProductId } from '../billingConfig';
import { isBypassActive } from '../bypass';
import { useTier } from '../useTier';
import { LIMIT_CAPS, type LimitKind } from '../limits';
import { formatInt } from '../../../utils/format';

/** The Free cap behind a limit reason (0 for Pro-only features). */
function capOf(reason: string): number {
  const cap = LIMIT_CAPS[reason as LimitKind];
  return typeof cap === 'number' ? cap : 0;
}

const FEATURES = ['catalogue', 'history', 'reports', 'reorder', 'transfer'] as const;

export const ProScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const params = useParams<'Pro'>();
  const billing = useBilling();
  const tier = useTier();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger' | 'info'; text: string } | null>(null);
  const lifetime = billing.entitlement.packages.find(p => p.key === 'lifetime' && (p.identifier === BILLING_PACKAGE_IDS.lifetime || isLifetimeProductId(p.productIdentifier))) ?? null;

  // Try the store again whenever the Pro screen opens (e.g. the app started offline).
  useEffect(() => { if (billing.status === 'unavailable' || billing.status === 'error') void billing.retry(); }, []);

  const buy = async () => {
    // A purchase whose entitlement is still being recovered must not be bought twice.
    if (billing.purchaseRecoveryPending) { setMessage({ tone: 'info', text: t('pro.recoveryPending') }); return; }
    if (!lifetime) { setMessage({ tone: 'danger', text: billing.purchaseRecoveryPending ? t('pro.recoveryPending') : t('pro.storeUnavailable') }); return; }
    setBusy(true); setMessage(null);
    try {
      const r = await billing.purchase(lifetime);
      if (r.success) setMessage({ tone: 'success', text: t('pro.unlocked') });
      else if (r.requiresEntitlementRecovery) setMessage({ tone: 'info', text: t('pro.recoveryPending') });
      else if (!r.cancelled) setMessage({ tone: 'danger', text: t('pro.purchaseFailed') });
    } finally { setBusy(false); }
  };

  return (
    <Screen
      title={t('screens.Pro')}
      onBack={() => nav.goBack()}
      testID="screen-Pro"
      footer={tier === 'pro' ? <AppButton label={t('common.done')} onPress={() => nav.goBack()} testID="pro-done" /> : (
        <>
          <AppButton label={lifetime ? t('pro.upgradePrice', { price: lifetime.priceString }) : t('pro.upgrade')} onPress={buy} loading={busy || billing.status === 'purchase_in_progress'} testID="pro-upgrade" />
          <AppButton label={t('pro.restore')} variant="secondary" onPress={() => nav.navigate('RestorePurchase')} testID="pro-restore" />
        </>
      )}
    >
      <Text style={s.heading}>{t('pro.heading')}</Text>
      {params?.reason ? <Card tone="default" body={t(`states.freeLimit.body.${params.reason}`, { n: formatInt(capOf(params.reason)) })} /> : null}
      <Card tone="info" title={t('pro.oneTime')} body={t('pro.oneTimeBody')} />
      {FEATURES.map(f => (
        <View key={f} style={s.feature} accessible accessibilityLabel={t(`pro.feature.${f}`)}>
          <View style={s.dot} />
          <Text style={s.featureText}>{t(`pro.feature.${f}`)}</Text>
        </View>
      ))}
      {tier === 'pro' ? <StateCard tone="success" title={t('pro.activeTitle')} body={isBypassActive() ? t('pro.reviewBuild') : t('pro.activeBody')} testID="pro-active" /> : null}
      {message ? <Card tone={message.tone} body={message.text} testID="pro-message" /> : null}
      <Helper>{t('pro.keepsWorking')}</Helper>
    </Screen>
  );
};

export const RestorePurchaseScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const billing = useBilling();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger' | 'info'; text: string } | null>(null);
  const restore = async () => {
    setBusy(true); setMessage(null);
    try {
      const r = await billing.restore();
      setMessage(r.success ? { tone: 'success', text: t('pro.restored') } : r.errorCode ? { tone: 'danger', text: t('pro.restoreFailed') } : { tone: 'info', text: t('pro.nothingToRestore') });
    } finally { setBusy(false); }
  };
  return (
    <Screen
      title={t('screens.RestorePurchase')}
      onBack={() => nav.goBack()}
      testID="screen-RestorePurchase"
      footer={(
        <>
          <AppButton label={t('pro.restore')} onPress={restore} loading={busy} testID="restore-purchase" />
          <AppButton label={t('common.cancel')} variant="secondary" onPress={() => nav.goBack()} testID="restore-purchase-cancel" />
        </>
      )}
    >
      <SectionTitle>{t('pro.restoreTitle')}</SectionTitle>
      <Card tone="info" title={t('pro.alreadyTitle')} body={t('pro.alreadyBody')} />
      <Helper size="body">{t('pro.restoreSafe')}</Helper>
      {message ? <Card tone={message.tone} body={message.text} testID="restore-purchase-message" /> : null}
    </Screen>
  );
};

const s = StyleSheet.create({
  heading: { ...tcType.screenTitle, color: tc.textPrimary },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: tc.accent },
  featureText: { ...tcType.body, color: tc.textPrimary, flex: 1 },
});
