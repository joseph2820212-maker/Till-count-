/** 01 Home (Figma 17:112). */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../components/AppButton';
import { BodyText, Card, MetricCard, MetricRow, ProgressBar, Screen, SectionLabel } from '../../ui/kit';
import { OverflowMenu } from '../../ui/overlays';
import { useAppState } from '../../state/store';
import { useCompletedSessions, useOpenProgress, useRecentlyCounted, useReorder } from '../../state/selectors';
import { dot, formatInt, formatQty, weekdayShort } from '../../utils/format';
import { goTab, useNav } from '../../navigation/nav';
import { scopeTitle } from '../count/scopeLabel';

export const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const [menu, setMenu] = useState(false);
  const open = useOpenProgress();
  const { summary, attention } = useReorder();
  const completed = useCompletedSessions();
  const recent = useRecentlyCounted(2);
  const hasProducts = useAppState(s => s.index.activeIds.length > 0);
  const last = completed[0];

  const resume = () => nav.navigate(open?.session.status === 'paused' ? 'CountPaused' : open?.session.mode === 'list' ? 'ListCount' : 'ScanCount');

  return (
    <Screen
      title={t('app.name')}
      tabRoot
      testID="screen-Home"
      action={{ icon: 'ellipsis-horizontal', label: t('common.moreOptions'), onPress: () => setMenu(true) }}
    >
      <AppButton label={t('home.startCount')} onPress={() => nav.navigate('StartCount')} testID="home-start-count" />
      {open ? (
        <Card title={t('home.continueCount')} onPress={resume} testID="home-continue">
          <View style={{ gap: 5 }}>
            <BodyText>{t('home.continueProgress', { scope: scopeTitle(open.session), counted: formatInt(open.counted), total: formatInt(open.total) })}</BodyText>
            <ProgressBar percent={open.percent} />
          </View>
        </Card>
      ) : null}
      <SectionLabel>{t('home.today')}</SectionLabel>
      <MetricRow>
        <MetricCard label={t('status.low')} value={formatInt(summary.low)} helper={t('common.items')} onPress={() => goTab(nav, 'Reorder')} testID="metric-low" />
        <MetricCard label={t('status.out')} value={formatInt(summary.out)} helper={t('common.items')} onPress={() => goTab(nav, 'Reorder')} testID="metric-out" />
      </MetricRow>
      <MetricRow>
        <MetricCard label={t('status.notCounted')} value={formatInt(summary.notCounted)} helper={t('common.items')} onPress={() => goTab(nav, 'Products', { filter: 'notCounted' })} testID="metric-not-counted" />
        <MetricCard
          label={t('home.lastCount')}
          value={last ? weekdayShort(last.completedAt) : '—'}
          helper={last ? (last.scope.type === 'everything' ? t('home.fullCount') : scopeTitle(last)) : t('home.noCountYet')}
          onPress={() => nav.navigate('CountHistory')}
          testID="metric-last-count"
        />
      </MetricRow>
      <Card
        title={t('home.reorderList')}
        body={attention.length ? t('home.needAttention', { count: attention.length, n: formatInt(attention.length) }) : t('home.nothingToReorder')}
        onPress={() => goTab(nav, 'Reorder')}
        testID="home-reorder"
      />
      <Card
        title={t('home.recentlyCounted')}
        body={recent.length ? recent.map(r => `${r.product.name}${dot()}${formatQty(r.snapshot.quantityBase, r.product.countUnit)}`).join(`  ${dot()}  `) : hasProducts ? t('home.noRecent') : t('home.noProducts')}
        onPress={() => nav.navigate('CountHistory')}
        testID="home-recent"
      />
      <OverflowMenu
        visible={menu}
        onClose={() => setMenu(false)}
        items={[
          { label: t('screens.CountHistory'), icon: 'time-outline', onPress: () => nav.navigate('CountHistory') },
          { label: t('screens.FavouriteCounts'), icon: 'star-outline', onPress: () => nav.navigate('FavouriteCounts') },
          { label: t('screens.ImportCentre'), icon: 'download-outline', onPress: () => nav.navigate('ImportCentre') },
          { label: t('screens.ExportCentre'), icon: 'share-outline', onPress: () => nav.navigate('ExportCentre') },
          { label: t('screens.Help'), icon: 'help-circle-outline', onPress: () => nav.navigate('Help') },
        ]}
      />
    </Screen>
  );
};
