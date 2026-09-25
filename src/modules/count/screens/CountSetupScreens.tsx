/**
 * Count tab and count set-up flow:
 *  08 Count (21:187) · 02 Start Count (17:184) · 03 Choose Scope / location (17:230) ·
 *  10 Choose category (21:283) · 11 Choose supplier (21:327) · 12 Select products (21:371) ·
 *  09 Count setup (21:251)
 */
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../../components/AppButton';
import { AppAlert } from '../../../components/AppAlert';
import { Card, CheckRow, GAP, GUTTER, Helper, ListRow, OptionCard, Screen, ScopeRow, SectionLabel, SectionTitle, StateCard, ToggleRow } from '../../../ui/kit';
import { OverflowMenu, StateDialog } from '../../../ui/overlays';
import { SearchField } from '../../../ui/fields';
import { useAppState, getState } from '../../../state/store';
import { useMembershipCounts, useOpenProgress } from '../../../state/selectors';
import { discardCount, startCount } from '../../../state/actions';
import { resolveScope, NO_SUPPLIER_ID } from '../../../domain/countEngine';
import { searchProducts } from '../../../domain/catalogIndex';
import type { CountMode, CountScope, CountScopeType } from '../../../domain/types';
import { dot, formatInt, formatTime, relativeDay } from '../../../utils/format';
import { useNav, useParams } from '../../../navigation/nav';
import { scopeTitle } from '../scopeLabel';
import { useProGate } from '../../billing/useProGate';

// ─── 08 Count (tab root) ─────────────────────────────────────────────────────

export const CountScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const [menu, setMenu] = useState(false);
  const open = useOpenProgress();
  const favourites = useAppState(s => s.favourites);
  const products = useAppState(s => s.products);
  const resume = () => nav.navigate(open?.session.mode === 'list' ? 'ListCount' : 'ScanCount');
  return (
    <Screen title={t('screens.Count')} tabRoot testID="screen-Count" action={{ icon: 'ellipsis-horizontal', label: t('common.moreOptions'), onPress: () => setMenu(true) }}>
      <SectionTitle>{t('count.countStock')}</SectionTitle>
      <Card tone="info" title={t('count.startNewTitle')} body={t('count.startNewBody')} />
      <AppButton label={t('home.startCount')} onPress={() => nav.navigate('StartCount')} testID="count-start" />
      {open ? (
        <>
          <SectionLabel>{t('count.active')}</SectionLabel>
          <Card
            title={scopeTitle(open.session)}
            body={t('count.activeLine', { counted: formatInt(open.counted), total: formatInt(open.total), day: relativeDay(open.session.startedAt), time: formatTime(open.session.startedAt) })}
            onPress={resume}
            testID="count-active-card"
          />
          <AppButton label={t('count.resume')} variant="secondary" onPress={resume} testID="count-resume" />
        </>
      ) : null}
      <SectionLabel>{t('count.favourites')}</SectionLabel>
      {favourites.length ? favourites.map(f => (
        <ListRow
          key={f.id}
          title={f.name}
          subtitle={t('count.productsCount', { count: resolveScope(products, f.scope).length, n: formatInt(resolveScope(products, f.scope).length) })}
          onPress={() => nav.navigate('CountSetup', { scope: f.scope, favouriteId: f.id })}
          testID={`favourite-${f.id}`}
        />
      )) : <Helper>{t('count.noFavourites')}</Helper>}
      <OverflowMenu
        visible={menu}
        onClose={() => setMenu(false)}
        items={[
          { label: t('screens.FavouriteCounts'), icon: 'star-outline', onPress: () => nav.navigate('FavouriteCounts') },
          { label: t('screens.CountHistory'), icon: 'time-outline', onPress: () => nav.navigate('CountHistory') },
          { label: t('screens.CountSettings'), icon: 'settings-outline', onPress: () => nav.navigate('CountSettings') },
        ]}
      />
    </Screen>
  );
};

// ─── 02 Start Count ──────────────────────────────────────────────────────────

const SCOPES: CountScopeType[] = ['everything', 'category', 'supplier', 'location', 'selected'];

export const StartCountScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const [scope, setScope] = useState<CountScopeType>('everything');
  const open = useAppState(s => s.openSession);
  const hasProducts = useAppState(s => s.index.activeIds.length > 0);
  const [dismissed, setDismissed] = useState(false);

  const next = () => {
    if (scope === 'everything') nav.navigate('CountSetup', { scope: { type: 'everything' } });
    else if (scope === 'category') nav.navigate('ChooseCategory');
    else if (scope === 'supplier') nav.navigate('ChooseSupplier');
    else if (scope === 'location') nav.navigate('ChooseLocation');
    else nav.navigate('SelectProducts');
  };

  return (
    <Screen title={t('screens.StartCount')} onBack={() => nav.goBack()} testID="screen-StartCount" footer={<AppButton label={t('common.continue')} onPress={next} disabled={!hasProducts || !!open} testID="start-continue" />}>
      <SectionTitle>{t('start.question')}</SectionTitle>
      <Helper>{t('start.helper')}</Helper>
      {!hasProducts ? (
        <StateCard
          tone="info"
          title={t('states.productsEmpty.title')}
          body={t('states.productsEmpty.body')}
          actions={[{ label: t('states.productsEmpty.scan'), onPress: () => nav.navigate('AddProduct') }, { label: t('states.productsEmpty.import'), onPress: () => nav.navigate('ImportCentre') }]}
          testID="state-products-empty"
        />
      ) : null}
      {SCOPES.map(s => (
        <ScopeRow key={s} title={t(`start.scope.${s}.title`)} subtitle={t(`start.scope.${s}.body`)} selected={scope === s} onPress={() => setScope(s)} testID={`scope-${s}`} />
      ))}
      <StateDialog
        visible={!!open && !dismissed}
        tone="danger"
        title={t('states.discard.title')}
        body={t('states.discard.body')}
        onDismiss={() => { setDismissed(true); nav.goBack(); }}
        testID="state-discard"
        actions={[
          { label: t('states.discard.keep'), onPress: () => { setDismissed(true); nav.replace(open?.mode === 'list' ? 'ListCount' : 'ScanCount'); }, testID: 'discard-keep' },
          { label: t('states.discard.discard'), variant: 'danger', onPress: () => { void discardCount(); }, testID: 'discard-confirm' },
        ]}
      />
    </Screen>
  );
};

// ─── Named scope pickers (location 03 / category 10 / supplier 11) ───────────

type PickerKind = 'location' | 'category' | 'supplier';

const ScopePicker: React.FC<{ kind: PickerKind }> = ({ kind }) => {
  const { t } = useTranslation();
  const nav = useNav();
  const counts = useMembershipCounts();
  const list = useAppState(s => (kind === 'location' ? s.locations : kind === 'category' ? s.categories : s.suppliers)).filter(r => r.status === 'active');
  const [selected, setSelected] = useState<string | null>(null);
  const countFor = (id: string) => (kind === 'location' ? counts.location : kind === 'category' ? counts.category : counts.supplier).get(id) ?? 0;
  const rows = useMemo(() => {
    // Locations keep the order the shop created them in (its walking order); the rest are A–Z.
    const r = [...list].sort((a, b) => (kind === 'location' ? a.createdAt.localeCompare(b.createdAt) : a.name.localeCompare(b.name))).map(x => ({ id: x.id, name: x.name, n: countFor(x.id) }));
    if (kind === 'supplier' && counts.noSupplier > 0) r.push({ id: NO_SUPPLIER_ID, name: t('reorder.noSupplier'), n: counts.noSupplier });
    return r;
  }, [list, counts, kind, t]);
  // Figma opens Choose location with the first location that has products selected.
  useEffect(() => {
    if (kind === 'location' && selected === null) {
      const first = rows.find(r => r.n > 0);
      if (first) setSelected(first.id);
    }
  }, [kind, rows, selected]);
  const chosen = rows.find(r => r.id === selected);
  const go = () => {
    if (!chosen) return;
    const scope: CountScope = kind === 'location' ? { type: 'location', locationId: chosen.id } : kind === 'category' ? { type: 'category', categoryId: chosen.id } : { type: 'supplier', supplierId: chosen.id };
    nav.navigate('CountSetup', { scope, scopeLabel: chosen.name });
  };
  const route = kind === 'location' ? 'ChooseLocation' : kind === 'category' ? 'ChooseCategory' : 'ChooseSupplier';
  const cta = kind === 'location' ? t('home.startCount') : kind === 'category' ? t('pick.useCategory') : t('pick.useSupplier');
  return (
    <Screen title={t(`screens.${route}`)} onBack={() => nav.goBack()} testID={`screen-${route}`} footer={<AppButton label={cta} onPress={go} disabled={!chosen || chosen.n === 0} testID="scope-use" />}>
      <SectionTitle>{t(`pick.${kind}.title`)}</SectionTitle>
      {kind === 'location' ? <Helper>{t('pick.location.helper')}</Helper> : null}
      {rows.length === 0 ? (
        <StateCard tone="info" title={t(`pick.${kind}.emptyTitle`)} body={t(`pick.${kind}.emptyBody`)} actions={[{ label: t('common.add'), onPress: () => nav.navigate(kind === 'location' ? 'LocationForm' : kind === 'category' ? 'CategoryForm' : 'SupplierForm') }]} />
      ) : null}
      {rows.map(r => kind === 'location' ? (
        <ScopeRow key={r.id} title={r.name} subtitle={t('count.productsCount', { count: r.n, n: formatInt(r.n) })} selected={selected === r.id} onPress={() => setSelected(r.id)} testID={`pick-${r.id}`} />
      ) : (
        <ListRow key={r.id} title={r.name} subtitle={t('count.productsCount', { count: r.n, n: formatInt(r.n) })} selected={selected === r.id} onPress={() => setSelected(r.id)} testID={`pick-${r.id}`} />
      ))}
    </Screen>
  );
};

export const ChooseLocationScreen: React.FC = () => <ScopePicker kind="location" />;
export const ChooseCategoryScreen: React.FC = () => <ScopePicker kind="category" />;
export const ChooseSupplierScreen: React.FC = () => <ScopePicker kind="supplier" />;

// ─── 12 Select products ──────────────────────────────────────────────────────

export const SelectProductsScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const index = useAppState(s => s.index);
  const lookups = useAppState(s => s.lookups);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const results = useMemo(() => searchProducts(index, query), [index, query]);
  const toggle = (id: string) => setPicked(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const go = () => nav.navigate('CountSetup', { scope: { type: 'selected', selectedProductIds: [...picked] }, scopeLabel: t('scope.selectedCount', { count: picked.size }) });
  return (
    <Screen
      title={t('screens.SelectProducts')}
      onBack={() => nav.goBack()}
      noScroll
      testID="screen-SelectProducts"
      footer={<AppButton label={t('select.countN', { count: picked.size, n: formatInt(picked.size) })} onPress={go} disabled={picked.size === 0} testID="select-count" />}
    >
      <FlatList
        data={results}
        keyExtractor={p => p.id}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        windowSize={9}
        contentContainerStyle={{ gap: GAP, paddingBottom: GUTTER }}
        ListHeaderComponent={(
          <View style={{ gap: GAP }}>
            <SectionTitle>{t('select.title')}</SectionTitle>
            <Helper>{t('select.helper')}</Helper>
            <SearchField value={query} onChangeText={setQuery} placeholder={t('products.searchPlaceholder')} testID="select-search" />
          </View>
        )}
        ListEmptyComponent={<Helper>{t('states.searchEmpty.body')}</Helper>}
        renderItem={({ item }) => {
          const meta = [item.categoryId ? lookups.categories.get(item.categoryId)?.name : undefined, item.locationId ? lookups.locations.get(item.locationId)?.name : undefined].filter(Boolean).join(dot());
          return <CheckRow title={item.name} subtitle={meta || undefined} checked={picked.has(item.id)} onPress={() => toggle(item.id)} testID={`select-${item.id}`} />;
        }}
      />
    </Screen>
  );
};

// ─── 09 Count setup ──────────────────────────────────────────────────────────

export const CountSetupScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { scope, scopeLabel, favouriteId } = useParams<'CountSetup'>();
  const settings = useAppState(s => s.settings);
  const favourite = useAppState(s => (favouriteId ? s.favourites.find(f => f.id === favouriteId) : undefined));
  const products = useAppState(s => s.products);
  const [mode, setMode] = useState<CountMode>(favourite?.mode ?? settings.defaultCountMode);
  const [blind, setBlind] = useState(favourite?.blindCount ?? settings.blindCount);
  const [caseLoose, setCaseLoose] = useState(favourite?.caseLooseEnabled ?? settings.caseLooseEnabled);
  const [busy, setBusy] = useState(false);
  const inScope = useMemo(() => resolveScope(products, scope).length, [products, scope]);
  const gate = useProGate();

  const go = async () => {
    if (!gate.allow('countScope', { scopeType: scope.type })) return;
    setBusy(true);
    try {
      const label = favourite?.name ?? scopeLabel;
      await startCount({ scope, scopeLabel: label, mode, blindCount: blind, caseLooseEnabled: caseLoose });
      nav.popToTop();
      nav.navigate(mode === 'list' ? 'ListCount' : 'ScanCount');
    } catch (e) {
      AppAlert.error(e instanceof Error && e.name === 'OpenCountExistsError' ? t('count.alreadyOpen') : t('errors.saveFailed'));
    } finally { setBusy(false); }
  };

  return (
    <Screen title={t('screens.CountSetup')} onBack={() => nav.goBack()} testID="screen-CountSetup" footer={<AppButton label={t('common.continue')} onPress={go} loading={busy} disabled={inScope === 0 || !!getState().openSession} testID="setup-continue" />}>
      <SectionTitle>{t('setup.question')}</SectionTitle>
      <OptionCard title={t('setup.scanTitle')} body={t('setup.scanBody')} selected={mode === 'scan'} onPress={() => setMode('scan')} testID="setup-scan" />
      <OptionCard title={t('setup.listTitle')} body={t('setup.listBody')} selected={mode === 'list'} onPress={() => setMode('list')} testID="setup-list" />
      <ToggleRow title={t('setup.blindTitle')} subtitle={t('setup.blindBody')} value={blind} onChange={setBlind} testID="setup-blind" />
      <ToggleRow title={t('setup.caseLooseTitle')} subtitle={t('setup.caseLooseBody')} value={caseLoose} onChange={setCaseLoose} testID="setup-case-loose" />
      <Helper>{t('setup.inScope', { count: inScope, n: formatInt(inScope), scope: favourite?.name ?? scopeLabel ?? scopeTitle({ scope }) })}</Helper>
      {gate.sheet}
    </Screen>
  );
};
