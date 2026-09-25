/**
 * 05 Review (17:308) · 06 Results (17:348) · 18 Count history (22:447) · 19 History detail (22:489) ·
 * 20 Favourite counts (22:534) · 21 Edit favourite (22:572)
 */
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../../../components/AppButton';
import { AppAlert } from '../../../components/AppAlert';
import { BodyText, Card, GAP, GUTTER, Helper, ListRow, MetricCard, MetricRow, Screen, SectionLabel, SectionTitle, StateCard } from '../../../ui/kit';
import { SelectField, TextField } from '../../../ui/fields';
import { StateDialog } from '../../../ui/overlays';
import { tc } from '../../../theme/colors';
import { useAppState, loadFullSession } from '../../../state/store';
import { useCompletedSessions, useOpenProgress, useActiveNamed } from '../../../state/selectors';
import { deleteFavourite, finishCount, saveFavourite } from '../../../state/actions';
import { resolveScope, uncountedIds, unitsOf } from '../../../domain/countEngine';
import { reorderStatus } from '../../../domain/reorderEngine';
import { sessionStockValue } from '../../../domain/stockValue';
import type { CountMode, CountScopeType, CountSession, FavouriteCount } from '../../../domain/types';
import { dot, formatDate, formatDayMonth, formatInt, formatMoney, formatQty, formatTime, relativeDay, unitLabel } from '../../../utils/format';
import { goTab, useNav, useParams } from '../../../navigation/nav';
import { scopeTitle } from '../scopeLabel';
import { useProGate } from '../../billing/useProGate';


// ─── 05 Review ───────────────────────────────────────────────────────────────

export const ReviewScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const progress = useOpenProgress();
  const index = useAppState(s => s.index);
  const snapshots = useAppState(s => s.snapshots);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!progress && !busy) nav.popToTop(); }, [progress, busy, nav]);
  const missing = useMemo(() => (progress ? uncountedIds(progress.session) : []), [progress]);
  if (!progress) return null;
  const { session } = progress;

  const finish = async () => {
    setBusy(true);
    try {
      const done = await finishCount();
      nav.popToTop();
      nav.navigate('Results', { sessionId: done.id });
    } catch {
      AppAlert.error(t('errors.saveFailed'));
      setBusy(false);
    }
  };

  const backToCount = () => nav.navigate(session.mode === 'list' ? 'ListCount' : 'ScanCount');

  return (
    <Screen
      title={t('screens.Review')}
      onBack={() => nav.goBack()}
      noScroll
      testID="screen-Review"
      footer={(
        <>
          <AppButton label={t('review.backToCount')} variant="secondary" onPress={backToCount} testID="review-back" />
          <AppButton label={t('count.finish')} onPress={finish} loading={busy} testID="review-finish" />
        </>
      )}
    >
      <FlatList
        data={missing}
        keyExtractor={id => id}
        initialNumToRender={12}
        windowSize={7}
        contentContainerStyle={{ gap: GAP, paddingBottom: GUTTER }}
        ListHeaderComponent={(
          <View style={{ gap: GAP }}>
            <SectionTitle>{t('review.before')}</SectionTitle>
            {missing.length ? (
              <Card tone="danger" title={t('review.notCounted', { count: missing.length, n: formatInt(missing.length) })} body={t('review.notCountedBody')} testID="review-missing-banner" />
            ) : (
              <Card tone="success" title={t('review.allCounted', { n: formatInt(progress.total) })} body={t('review.allCountedBody')} testID="review-all-counted" />
            )}
          </View>
        )}
        renderItem={({ item }) => {
          const p = index.byId.get(item);
          const prev = snapshots[item];
          const meta = !session.blindCount && prev && p ? t('review.previousNotCounted', { qty: formatQty(prev.quantityBase, p.countUnit) }) : t('review.notCountedShort');
          return (
            <ListRow
              title={p?.name ?? t('review.removedProduct')}
              subtitle={meta}
              chevron={false}
              right={p ? <AppButton label={t('review.count')} onPress={() => nav.navigate('QuickQuantity', { productId: item })} compact style={st.countBtn} testID={`review-count-${item}`} /> : null}
              testID={`review-row-${item}`}
            />
          );
        }}
        ListFooterComponent={<Card tone="info" title={t('review.skippedTitle')} body={t('review.skippedBody')} />}
      />
    </Screen>
  );
};

// ─── 06 Results ──────────────────────────────────────────────────────────────

function useFullSession(sessionId: string): CountSession | null | undefined {
  const [s, setS] = useState<CountSession | null | undefined>(undefined);
  const header = useAppState(st => st.sessions.find(x => x.id === sessionId));
  useEffect(() => {
    let live = true;
    loadFullSession(sessionId).then(v => { if (live) setS(v); }, () => { if (live) setS(null); });
    return () => { live = false; };
  }, [sessionId, header]);
  return s;
}

export const ResultsScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { sessionId } = useParams<'Results'>();
  const session = useFullSession(sessionId);
  const index = useAppState(s => s.index);
  const gate = useProGate();
  if (session === undefined) return <Screen title={t('screens.Results')} onBack={() => nav.popToTop()} testID="screen-Results" />;
  if (!session) return <Screen title={t('screens.Results')} onBack={() => nav.popToTop()} testID="screen-Results"><StateCard tone="danger" title={t('errors.notFoundTitle')} body={t('errors.notFoundBody')} /></Screen>;
  const value = sessionStockValue(session.entries);
  let low = 0; let out = 0;
  for (const e of session.entries) {
    const st = reorderStatus(e.quantityBase, index.byId.get(e.productId)?.reorderLevel);
    if (st === 'out') out++; else if (st === 'low') low++;
  }
  const attention = session.attentionAtCompletion ?? { out, low };
  return (
    <Screen
      title={t('screens.Results')}
      onBack={() => nav.popToTop()}
      testID="screen-Results"
      footer={(
        <>
          <AppButton label={t('results.viewReorder')} onPress={() => { nav.popToTop(); goTab(nav, 'Reorder'); }} testID="results-reorder" />
          <AppButton label={t('results.share')} variant="secondary" onPress={() => { if (gate.allow('reportExport')) nav.navigate('CountPdfPreview', { sessionId }); }} testID="results-share" />
        </>
      )}
    >
      <View style={st.hero} accessible accessibilityRole="summary">
        <Ionicons name="checkmark-circle-outline" size={34} color={tc.success} />
        <SectionTitle>{t('results.complete', { scope: scopeTitle(session) })}</SectionTitle>
        <Helper size="body" center>{t('results.summary', { products: formatInt(session.entries.length), units: formatInt(unitsOf(session.entries)) })}</Helper>
        <Helper center>{t('results.finishedAt', { day: relativeDay(session.completedAt), time: formatTime(session.completedAt) })}</Helper>
      </View>
      <SectionLabel>{t('results.attention')}</SectionLabel>
      <MetricRow>
        <MetricCard label={t('status.low')} value={formatInt(attention.low)} helper={t('common.items')} onPress={() => { nav.popToTop(); goTab(nav, 'Reorder'); }} />
        <MetricCard label={t('status.out')} value={formatInt(attention.out)} helper={t('common.items')} onPress={() => { nav.popToTop(); goTab(nav, 'Reorder'); }} />
      </MetricRow>
      <Card tone="info" title={t('results.stockValue', { value: formatMoney(value.total) })} body={value.missingCostCount ? t('results.stockValueMissing', { n: formatInt(value.missingCostCount) }) : t('results.stockValueBody')} testID="results-value" />
      <Card title={t('results.saved')} body={t('results.savedBody')} />
      {gate.sheet}
    </Screen>
  );
};

// ─── 18 Count history ────────────────────────────────────────────────────────

export const CountHistoryScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const sessions = useCompletedSessions();
  return (
    <Screen title={t('screens.CountHistory')} onBack={() => nav.goBack()} noScroll testID="screen-CountHistory">
      <FlatList
        data={sessions}
        keyExtractor={s => s.id}
        contentContainerStyle={{ gap: GAP, paddingBottom: GUTTER }}
        ListHeaderComponent={<SectionTitle>{t('history.completed')}</SectionTitle>}
        ListEmptyComponent={(
          <StateCard tone="info" title={t('states.historyEmpty.title')} body={t('states.historyEmpty.body')} actions={[{ label: t('home.startCount'), onPress: () => nav.navigate('StartCount') }]} testID="state-history-empty" />
        )}
        renderItem={({ item }) => (
          <ListRow
            title={`${scopeTitle(item)}${dot()}${relativeDay(item.completedAt)}`}
            subtitle={item.unitsTotal === undefined ? t('history.rowSummary', { products: formatInt(item.entryCount) }) : t('history.rowSummaryUnits', { products: formatInt(item.entryCount), units: formatInt(item.unitsTotal) })}
            onPress={() => nav.navigate('HistoryDetail', { sessionId: item.id })}
            testID={`history-${item.id}`}
          />
        )}
      />
    </Screen>
  );
};

// ─── 19 History detail ───────────────────────────────────────────────────────

export const HistoryDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { sessionId } = useParams<'HistoryDetail'>();
  const session = useFullSession(sessionId);
  const gate = useProGate();
  const sorted = useMemo(() => (session ? [...session.entries].sort((a, b) => a.productName.localeCompare(b.productName)) : []), [session]);
  if (session === undefined) return <Screen title={t('screens.HistoryDetail')} onBack={() => nav.goBack()} testID="screen-HistoryDetail" />;
  if (!session) return <Screen title={t('screens.HistoryDetail')} onBack={() => nav.goBack()} testID="screen-HistoryDetail"><StateCard tone="danger" title={t('errors.notFoundTitle')} body={t('errors.notFoundBody')} /></Screen>;
  const value = sessionStockValue(session.entries);
  const att = session.attentionAtCompletion;
  return (
    <Screen
      title={t('screens.HistoryDetail')}
      onBack={() => nav.goBack()}
      noScroll
      testID="screen-HistoryDetail"
      footer={<AppButton label={t('history.shareReport')} variant="secondary" onPress={() => { if (gate.allow('reportExport')) nav.navigate('CountPdfPreview', { sessionId }); }} testID="history-share" />}
    >
      <FlatList
        data={sorted}
        keyExtractor={e => e.productId}
        initialNumToRender={15}
        windowSize={9}
        contentContainerStyle={{ gap: GAP, paddingBottom: GUTTER }}
        ListHeaderComponent={(
          <View style={{ gap: GAP }}>
            <SectionTitle>{`${scopeTitle(session)}${dot()}${formatDayMonth(session.completedAt)}`}</SectionTitle>
            <MetricRow>
              <MetricCard label={t('history.products')} value={formatInt(session.entries.length)} />
              <MetricCard label={t('history.units')} value={formatInt(unitsOf(session.entries))} />
            </MetricRow>
            <Card title={t('history.attention')} body={att ? t('history.attentionLine', { out: formatInt(att.out), low: formatInt(att.low) }) : t('history.attentionUnknown')} />
            <Card tone="info" title={t('history.stockValue')} body={t('history.stockValueLine', { value: formatMoney(value.total) })} />
            <Helper>{t('history.completedOn', { date: formatDate(session.completedAt), time: formatTime(session.completedAt) })}</Helper>
          </View>
        )}
        renderItem={({ item }) => (
          <ListRow
            title={item.productName}
            subtitle={item.countUnit === 'each' ? t('history.units_n', { count: item.quantityBase, n: formatQty(item.quantityBase, 'each') }) : `${formatQty(item.quantityBase, item.countUnit)} ${unitLabel(item.countUnit)}`}
            onPress={() => nav.navigate('ProductDetail', { productId: item.productId })}
            testID={`history-entry-${item.productId}`}
          />
        )}
      />
      {gate.sheet}
    </Screen>
  );
};

// ─── 20 Favourite counts ─────────────────────────────────────────────────────

function favouriteSummary(t: (k: string, o?: Record<string, unknown>) => string, f: FavouriteCount, n: number, name?: string): string {
  if (f.scope.type === 'everything') return t('favourites.everything');
  return t('favourites.summary', { type: t(`scope.${f.scope.type}`), name: name ?? '', count: n, n: formatInt(n) });
}

export const FavouriteCountsScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const favourites = useAppState(s => s.favourites);
  const products = useAppState(s => s.products);
  const lookups = useAppState(s => s.lookups);
  const gate = useProGate();
  const nameOf = (f: FavouriteCount) => f.scope.categoryId ? lookups.categories.get(f.scope.categoryId)?.name : f.scope.supplierId ? lookups.suppliers.get(f.scope.supplierId)?.name : f.scope.locationId ? lookups.locations.get(f.scope.locationId)?.name : undefined;
  return (
    <Screen title={t('screens.FavouriteCounts')} onBack={() => nav.goBack()} testID="screen-FavouriteCounts" footer={<AppButton label={t('favourites.new')} onPress={() => { if (gate.allow('favourites')) nav.navigate('EditFavourite'); }} testID="favourites-new" />}>
      <SectionTitle>{t('screens.FavouriteCounts')}</SectionTitle>
      {favourites.length === 0 ? <Helper>{t('favourites.empty')}</Helper> : null}
      {favourites.map(f => (
        <ListRow key={f.id} title={f.name} subtitle={favouriteSummary(t, f, resolveScope(products, f.scope).length, nameOf(f))} onPress={() => nav.navigate('EditFavourite', { favouriteId: f.id })} testID={`favourite-row-${f.id}`} />
      ))}
      {gate.sheet}
    </Screen>
  );
};

// ─── 21 Edit favourite ───────────────────────────────────────────────────────

export const EditFavouriteScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const params = useParams<'EditFavourite'>();
  const existing = useAppState(s => (params?.favouriteId ? s.favourites.find(f => f.id === params.favouriteId) : undefined));
  const categories = useActiveNamed('categories');
  const suppliers = useActiveNamed('suppliers');
  const locations = useActiveNamed('locations');
  const products = useAppState(s => s.products);
  const settings = useAppState(s => s.settings);
  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<CountScopeType>(existing?.scope.type ?? 'everything');
  const [refId, setRefId] = useState<string>(existing?.scope.categoryId ?? existing?.scope.supplierId ?? existing?.scope.locationId ?? '');
  const [mode, setMode] = useState<CountMode>(existing?.mode ?? settings.defaultCountMode);
  const [error, setError] = useState<string | undefined>();
  const [confirm, setConfirm] = useState(false);
  const scope = useMemo(() => (
    type === 'category' ? { type, categoryId: refId } : type === 'supplier' ? { type, supplierId: refId } : type === 'location' ? { type, locationId: refId }
      : type === 'selected' ? { type, selectedProductIds: existing?.scope.selectedProductIds ?? [] } : { type }
  ), [type, refId, existing]);
  const included = useMemo(() => resolveScope(products, scope).length, [products, scope]);
  const refOptions = (type === 'category' ? categories : type === 'supplier' ? suppliers : locations).map(r => ({ value: r.id, label: r.name }));
  const scopeTypes: CountScopeType[] = existing?.scope.type === 'selected' ? ['everything', 'category', 'supplier', 'location', 'selected'] : ['everything', 'category', 'supplier', 'location'];

  const save = async () => {
    if (!name.trim()) { setError(t('favourites.nameRequired')); return; }
    if ((type === 'category' || type === 'supplier' || type === 'location') && !refId) { setError(t('favourites.chooseScope')); return; }
    const r = await saveFavourite({ id: existing?.id, name, scope, mode, blindCount: existing?.blindCount ?? settings.blindCount, caseLooseEnabled: existing?.caseLooseEnabled ?? settings.caseLooseEnabled });
    if (!r.ok) { setError(t('favourites.nameRequired')); return; }
    nav.goBack();
  };

  return (
    <Screen
      title={t('screens.EditFavourite')}
      onBack={() => nav.goBack()}
      keyboard
      testID="screen-EditFavourite"
      footer={(
        <>
          <AppButton label={t('favourites.save')} onPress={save} testID="favourite-save" />
          {existing ? <AppButton label={t('favourites.delete')} variant="secondary" onPress={() => setConfirm(true)} testID="favourite-delete" /> : null}
        </>
      )}
    >
      <SectionTitle>{t('favourites.formTitle')}</SectionTitle>
      <TextField label={t('fields.name')} value={name} onChangeText={v => { setName(v); setError(undefined); }} error={error} placeholder={t('favourites.namePlaceholder')} testID="favourite-name" maxLength={120} />
      <SelectField label={t('favourites.scope')} value={type} onChange={v => { setType(v); setRefId(''); }} options={scopeTypes.map(s => ({ value: s, label: t(`start.scope.${s}.title`) }))} testID="favourite-scope" />
      {type === 'category' || type === 'supplier' || type === 'location' ? (
        <SelectField label={t(`scope.${type}`)} value={refId || undefined} onChange={setRefId} options={refOptions} placeholder={t('favourites.choose')} testID="favourite-ref" />
      ) : null}
      <SelectField label={t('favourites.mode')} value={mode} onChange={setMode} options={[{ value: 'scan', label: t('setup.scanTitle') }, { value: 'list', label: t('setup.listTitle') }]} testID="favourite-mode" />
      <Card title={t('favourites.included')} body={t('favourites.includedLine', { count: included, n: formatInt(included) })} />
      <StateDialog
        visible={confirm}
        tone="danger"
        title={t('favourites.deleteTitle')}
        body={t('favourites.deleteBody')}
        onDismiss={() => setConfirm(false)}
        actions={[
          { label: t('common.cancel'), onPress: () => setConfirm(false) },
          { label: t('common.delete'), variant: 'danger', onPress: () => { setConfirm(false); if (existing) void deleteFavourite(existing.id).then(() => nav.goBack()); } },
        ]}
      />
    </Screen>
  );
};

const st = StyleSheet.create({
  hero: { backgroundColor: tc.softGreen, borderWidth: 1, borderColor: tc.success, borderRadius: 16, padding: 16, alignItems: 'center', gap: 7 },
  countBtn: { flexGrow: 0, flexBasis: 'auto', minWidth: 75, borderRadius: 8 },
});

export { BodyText };
