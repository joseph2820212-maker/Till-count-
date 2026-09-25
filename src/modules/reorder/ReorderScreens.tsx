/** 07 Reorder (17:386) · 34 Supplier reorder (24:867) · 35 Edit reorder target (24:908) */
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../../ui/Text';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../components/AppButton';
import { Card, Chip, ChipRow, GAP, GUTTER, ListRow, Screen, SectionLabel, SectionTitle, StateCard } from '../../ui/kit';
import { TextField } from '../../ui/fields';
import { OverflowMenu } from '../../ui/overlays';
import { tc } from '../../theme/colors';
import { tcType } from '../../theme/typography';
import { useAppState } from '../../state/store';
import { useReorder } from '../../state/selectors';
import { setReorderTarget } from '../../state/actions';
import { suggestedOrder, type ReorderLine } from '../../domain/reorderEngine';
import { parseQuantityText, validateQuantity } from '../../domain/quantity';
import { NO_SUPPLIER_ID } from '../../domain/countEngine';
import { dot, formatInt, formatQty, formatTime, relativeDay, unitLabel } from '../../utils/format';
import { goTab, useNav, useParams } from '../../navigation/nav';
import { useProGate } from '../billing/useProGate';

/** Reorder lines shown with the current settings (products without target may be hidden). */
function useVisibleAttention(): ReorderLine[] {
  const { attention } = useReorder();
  const hideNoTarget = useAppState(s => s.settings.productsWithoutTarget === 'hide');
  return useMemo(() => (hideNoTarget ? attention.filter(l => l.product.targetStock !== undefined) : attention), [attention, hideNoTarget]);
}

function supplierKey(l: ReorderLine, known: ReadonlyMap<string, unknown>): string {
  return l.product.supplierId && known.has(l.product.supplierId) ? l.product.supplierId : NO_SUPPLIER_ID;
}

const OrderRow: React.FC<{ line: ReorderLine; onPress: () => void }> = ({ line, onPress }) => {
  const { t } = useTranslation();
  const showSuggestion = useAppState(s => s.settings.reorderShowSuggestions);
  const out = line.status === 'out';
  const unit = line.product.countUnit;
  const meta = [
    t('reorder.countLine', { n: formatQty(line.latestQuantity, unit) }),
    line.product.targetStock !== undefined ? t('reorder.targetLine', { n: formatQty(line.product.targetStock, unit) }) : t('reorder.noTarget'),
  ].join(dot());
  const order = !showSuggestion ? '—' : line.suggestedOrder !== null ? formatQty(line.suggestedOrder, unit) : t('reorder.setTarget');
  return (
    <TouchableOpacity
      style={[s.row, out && s.rowOut]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${line.product.name}, ${t(`reorder.badge.${line.status}`)}, ${meta}, ${t('reorder.order')} ${order}`}
      testID={`order-row-${line.product.id}`}
    >
      <View style={s.copy}>
        <Text style={s.name} numberOfLines={2}>{line.product.name}</Text>
        <Text style={s.meta} numberOfLines={1}>{meta}</Text>
        <Text style={[s.badge, { color: out ? tc.danger : tc.accent }]}>{t(`reorder.badge.${line.status}`)}</Text>
      </View>
      <View style={[s.orderBox, { backgroundColor: out ? tc.softRed : tc.softBlue }]}>
        <Text style={s.orderLabel}>{t('reorder.order')}</Text>
        <Text style={s.orderValue} numberOfLines={1} adjustsFontSizeToFit>{order}</Text>
        {unit !== 'each' && line.suggestedOrder !== null && showSuggestion ? <Text style={s.orderLabel}>{unitLabel(unit)}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

type Row = { kind: 'label'; text: string } | { kind: 'line'; line: ReorderLine };

function sectioned(lines: ReorderLine[], t: (k: string) => string, labels = true): Row[] {
  const out = lines.filter(l => l.status === 'out').sort((a, b) => a.product.name.localeCompare(b.product.name));
  const low = lines.filter(l => l.status === 'low').sort((a, b) => a.product.name.localeCompare(b.product.name));
  return [
    ...(out.length && labels ? [{ kind: 'label' as const, text: t('reorder.sectionOut') }] : []), ...out.map(line => ({ kind: 'line' as const, line })),
    ...(low.length && labels ? [{ kind: 'label' as const, text: t('reorder.sectionLow') }] : []), ...low.map(line => ({ kind: 'line' as const, line })),
  ];
}

// ─── 07 Reorder (tab root) ───────────────────────────────────────────────────

export const ReorderScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const lines = useVisibleAttention();
  const lookups = useAppState(s => s.lookups);
  const grouped = useAppState(s => s.settings.reorderGroupBySupplier);
  const [supplier, setSupplier] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const gate = useProGate();

  const bySupplier = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of lines) { const k = supplierKey(l, lookups.suppliers); m.set(k, (m.get(k) ?? 0) + 1); }
    return [...m.entries()].map(([id, n]) => ({ id, n, name: id === NO_SUPPLIER_ID ? t('reorder.noSupplier') : lookups.suppliers.get(id)?.name ?? '' }))
      .sort((a, b) => (a.id === NO_SUPPLIER_ID ? 1 : b.id === NO_SUPPLIER_ID ? -1 : a.name.localeCompare(b.name)));
  }, [lines, lookups, t]);
  const shown = supplier ? lines.filter(l => supplierKey(l, lookups.suppliers) === supplier) : lines;
  const rows = useMemo(() => sectioned(shown, t), [shown, t]);
  const outN = shown.filter(l => l.status === 'out').length;
  const lowN = shown.filter(l => l.status === 'low').length;
  const supplierName = supplier ? bySupplier.find(b => b.id === supplier)?.name : undefined;

  const share = () => { if (gate.allow('reportExport')) nav.navigate('ReorderPdfPreview', { supplierId: supplier }); };

  return (
    <Screen
      title={t('screens.Reorder')}
      tabRoot
      noScroll
      testID="screen-Reorder"
      action={{ icon: 'ellipsis-horizontal', label: t('common.moreOptions'), onPress: () => setMenu(true) }}
      footer={lines.length ? <AppButton label={supplierName ? t('reorder.shareSupplier', { name: supplierName }) : t('reorder.share')} onPress={share} testID="reorder-share" /> : undefined}
    >
      <FlatList
        data={rows}
        keyExtractor={(r, i) => (r.kind === 'label' ? `l${i}` : r.line.product.id)}
        initialNumToRender={14}
        windowSize={9}
        contentContainerStyle={{ gap: GAP, paddingBottom: GUTTER }}
        ListHeaderComponent={lines.length ? (
          <View style={{ gap: GAP }}>
            <Card tone="info" title={t('reorder.attention', { count: shown.length, n: formatInt(shown.length) })} body={t('reorder.attentionLine', { out: formatInt(outN), low: formatInt(lowN) })} testID="reorder-summary" />
            {grouped && bySupplier.length > 1 ? (
              <ChipRow>
                <Chip label={t('reorder.all', { n: formatInt(lines.length) })} active={!supplier} onPress={() => setSupplier(null)} testID="chip-all" />
                {bySupplier.map(b => <Chip key={b.id} label={`${b.name} ${formatInt(b.n)}`} active={supplier === b.id} onPress={() => setSupplier(b.id)} testID={`chip-${b.id}`} />)}
              </ChipRow>
            ) : null}
            {supplier ? <ListRow title={t('screens.SupplierReorder')} subtitle={supplierName} onPress={() => nav.navigate('SupplierReorder', { supplierId: supplier })} testID="reorder-supplier-link" /> : null}
          </View>
        ) : null}
        ListEmptyComponent={(
          <StateCard tone="success" title={t('states.reorderEmpty.title')} body={t('states.reorderEmpty.body')} actions={[{ label: t('common.done'), onPress: () => goTab(nav, 'Home') }]} testID="state-reorder-empty" />
        )}
        renderItem={({ item }) => item.kind === 'label'
          ? <SectionLabel>{item.text}</SectionLabel>
          : <OrderRow line={item.line} onPress={() => nav.navigate('EditReorderTarget', { productId: item.line.product.id })} />}
      />
      <OverflowMenu
        visible={menu}
        onClose={() => setMenu(false)}
        items={[
          ...bySupplier.map(b => ({ label: t('reorder.supplierList', { name: b.name }), icon: 'car-outline' as const, onPress: () => nav.navigate('SupplierReorder', { supplierId: b.id }) })),
          { label: t('export.reorderCsv'), icon: 'grid-outline', onPress: () => { if (gate.allow('reportExport')) nav.navigate('CsvPreview', { kind: 'reorder', supplierId: supplier }); } },
          { label: t('screens.ReorderSettings'), icon: 'settings-outline', onPress: () => nav.navigate('ReorderSettings') },
        ]}
      />
      {gate.sheet}
    </Screen>
  );
};

// ─── 34 Supplier reorder ─────────────────────────────────────────────────────

export const SupplierReorderScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { supplierId } = useParams<'SupplierReorder'>();
  const lookups = useAppState(s => s.lookups);
  const all = useVisibleAttention();
  const lines = useMemo(() => all.filter(l => supplierKey(l, lookups.suppliers) === (supplierId ?? NO_SUPPLIER_ID)), [all, lookups, supplierId]);
  // One flat list, out of stock first (Figma): each row's badge already names its status.
  const rows = useMemo(() => sectioned(lines, t, false), [lines, t]);
  const name = supplierId && supplierId !== NO_SUPPLIER_ID ? lookups.suppliers.get(supplierId)?.name ?? '' : t('reorder.noSupplier');
  const gate = useProGate();
  const outN = lines.filter(l => l.status === 'out').length;
  return (
    <Screen
      title={t('screens.SupplierReorder')}
      onBack={() => nav.goBack()}
      noScroll
      testID="screen-SupplierReorder"
      footer={lines.length ? <AppButton label={t('reorder.shareSupplier', { name })} onPress={() => { if (gate.allow('reportExport')) nav.navigate('ReorderPdfPreview', { supplierId }); }} testID="supplier-share" /> : undefined}
    >
      <FlatList
        data={rows}
        keyExtractor={(r, i) => (r.kind === 'label' ? `l${i}` : r.line.product.id)}
        contentContainerStyle={{ gap: GAP, paddingBottom: GUTTER }}
        ListHeaderComponent={(
          <View style={{ gap: GAP }}>
            <SectionTitle>{name}</SectionTitle>
            {lines.length ? <Card tone="info" title={t('reorder.needOrdering', { count: lines.length, n: formatInt(lines.length) })} body={t('reorder.attentionLine', { out: formatInt(outN), low: formatInt(lines.length - outN) })} /> : null}
          </View>
        )}
        ListEmptyComponent={<StateCard tone="success" title={t('states.reorderEmpty.title')} body={t('states.reorderEmpty.body')} />}
        renderItem={({ item }) => item.kind === 'label'
          ? <SectionLabel>{item.text}</SectionLabel>
          : <OrderRow line={item.line} onPress={() => nav.navigate('EditReorderTarget', { productId: item.line.product.id })} />}
      />
      {gate.sheet}
    </Screen>
  );
};

// ─── 35 Edit reorder target ──────────────────────────────────────────────────

export const EditReorderTargetScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { productId } = useParams<'EditReorderTarget'>();
  const product = useAppState(s => s.index.byId.get(productId));
  const snap = useAppState(s => s.snapshots[productId]);
  const [level, setLevel] = useState(product?.reorderLevel !== undefined ? String(product.reorderLevel) : '');
  const [target, setTarget] = useState(product?.targetStock !== undefined ? String(product.targetStock) : '');
  const [errors, setErrors] = useState<{ level?: string; target?: string }>({});
  if (!product) return <Screen title={t('screens.EditReorderTarget')} onBack={() => nav.goBack()} testID="screen-EditReorderTarget" />;
  const unit = product.countUnit;
  const parse = (s: string) => (s.trim() ? parseQuantityText(s) : undefined);
  const lv = parse(level); const tg = parse(target);
  const suggestion = tg === null || tg === undefined ? null : suggestedOrder(snap?.quantityBase ?? null, tg, unit);
  /** "8 units" for counted items (Figma), "3.4 kg" for measured ones. */
  const qtyText = (q: number) => (unit === 'each' ? t('history.units_n', { count: q, n: formatQty(q, unit) }) : `${formatQty(q, unit)} ${unitLabel(unit)}`);

  const save = async () => {
    const e: typeof errors = {};
    if (lv === null || (lv !== undefined && validateQuantity(lv, 'kg'))) e.level = t('products.errors.badNumber');
    if (tg === null || (tg !== undefined && validateQuantity(tg, 'kg'))) e.target = t('products.errors.badNumber');
    setErrors(e);
    if (e.level || e.target) return;
    const r = await setReorderTarget(productId, lv ?? undefined, tg ?? undefined);
    if (r.ok) nav.goBack();
  };
  const remove = async () => { const r = await setReorderTarget(productId, undefined, undefined); if (r.ok) nav.goBack(); };

  return (
    <Screen
      title={t('screens.EditReorderTarget')}
      onBack={() => nav.goBack()}
      keyboard
      testID="screen-EditReorderTarget"
      footer={(
        <>
          <AppButton label={t('target.save')} onPress={save} testID="target-save" />
          <AppButton label={t('target.remove')} variant="secondary" onPress={remove} testID="target-remove" />
        </>
      )}
    >
      <SectionTitle>{product.name}</SectionTitle>
      <Card tone="info" title={t('target.lastCounted')} body={snap ? t('target.lastCountedLine', { qty: qtyText(snap.quantityBase), unit: '', day: relativeDay(snap.countedAt), time: formatTime(snap.countedAt) }).replace(/\s{2,}/g, ' ') : t('products.neverCounted')} />
      <TextField label={t('target.level')} value={level} onChangeText={setLevel} keyboardType={unit === 'each' ? 'number-pad' : 'decimal-pad'} error={errors.level} testID="target-level" placeholder={t('common.optional')} />
      <TextField label={t('fields.targetStock')} value={target} onChangeText={setTarget} keyboardType={unit === 'each' ? 'number-pad' : 'decimal-pad'} error={errors.target} testID="target-target" placeholder={t('common.optional')} />
      <Card tone="success" title={t('target.suggested')} body={suggestion !== null ? qtyText(suggestion) : snap ? t('target.needsTarget') : t('target.needsCount')} testID="target-suggestion" />
    </Screen>
  );
};

const s = StyleSheet.create({
  row: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: tc.card, borderWidth: 1, borderColor: tc.border, borderRadius: 12, paddingStart: 12, paddingEnd: 10, paddingVertical: 10 },
  rowOut: { borderColor: tc.danger },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  name: { ...tcType.cardTitle, color: tc.textPrimary },
  meta: { ...tcType.bodySmall, color: tc.textMuted },
  badge: { ...tcType.micro, textTransform: 'uppercase' },
  orderBox: { width: 82, minHeight: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  orderLabel: { ...tcType.micro, color: tc.textMuted, textTransform: 'uppercase' },
  orderValue: { ...tcType.cardValue, color: tc.textPrimary, writingDirection: 'ltr' },
});
