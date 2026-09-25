/**
 * Counting: 04 Scan & Count (17:270) · 13 List count (21:414) · 14 Quick quantity (21:471) ·
 * 15 Unknown barcode (22:370) · 16 Create from scan (22:392) · 17 Count paused (22:425)
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, FlatList, Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../../../ui/Text';
import { useTranslation } from 'react-i18next';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { AppButton } from '../../../components/AppButton';
import { AppAlert } from '../../../components/AppAlert';
import { AppKeyboardBottomSheet } from '../../../components/AppKeyboardBottomSheet';
import { BodyText, Card, Chip, ChipRow, GAP, GUTTER, Helper, Keypad, ProductCountRow, ProgressBar, Screen, SectionTitle, StateCard } from '../../../ui/kit';
import { SelectField, TextField } from '../../../ui/fields';
import { StateDialog } from '../../../ui/overlays';
import { tc } from '../../../theme/colors';
import { tcType } from '../../../theme/typography';
import { getState, useAppState } from '../../../state/store';
import { useOpenProgress, useActiveNamed } from '../../../state/selectors';
import {
  countAddToScope, countScan, countSetCaseLoose, countSetQuantity, countStep, createProduct, discardCount, markCameraExplained,
  pauseCount, resumeCount,
} from '../../../state/actions';
import { entryFor } from '../../../domain/countEngine';
import { caseLooseTotal, isMeasuredUnit, packUnitsOf, parseQuantityText, validateQuantity } from '../../../domain/quantity';
import { SCANNER_BARCODE_TYPES, isAcceptableBarcode, normalizeBarcode, symbologyOf } from '../../../domain/barcode';
import { makeBarcode } from '../../../domain/productRules';
import { newId } from '../../../domain/ids';
import { COUNT_UNITS, type CountUnit, type Product } from '../../../domain/types';
import { dot, formatInt, formatQty, ltr, unitLabel } from '../../../utils/format';
import { useNav, useParams } from '../../../navigation/nav';
import { scopeTitle } from '../scopeLabel';
import { useProGate } from '../../billing/useProGate';

const DUPLICATE_WINDOW_MS = 1500;

function productMeta(p: Product): string {
  const code = p.barcodes[0]?.code ?? (p.sku ? `SKU ${p.sku}` : '');
  return [code ? ltr(code) : '', unitLabel(p.countUnit)].filter(Boolean).join(dot());
}

function hapticOk(): void {
  if (!getState().settings.haptics) return;
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined); } catch { /* no haptics */ }
}

/** Screen guard: counting screens need an open count; otherwise go back to the Count tab. */
function useOpenOrLeave(): boolean {
  const nav = useNav();
  const has = useAppState(s => !!s.openSession);
  useEffect(() => { if (!has) nav.popToTop(); }, [has, nav]);
  return has;
}

function useCountLabels() {
  const { t } = useTranslation();
  return { minus: t('count.minusOne'), plus: t('count.plusOne'), quantity: t('count.enterQuantity') };
}

// ─── 04 Scan & Count ─────────────────────────────────────────────────────────

export const ScanCountScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const params = useParams<'ScanCount'>();
  const has = useOpenOrLeave();
  const progress = useOpenProgress();
  const session = progress?.session;
  const index = useAppState(s => s.index);
  const focused = useIsFocused();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [torch, setTorch] = useState(false);
  const [manualOpen, setManualOpen] = useState(!!params?.openManual);
  const [manualCode, setManualCode] = useState('');
  // Re-opening a count shows the product counted last (Figma keeps it under the scanner).
  const [lastProductId, setLastProductId] = useState<string | null>(() => {
    const entries = session?.entries ?? [];
    return entries.length ? entries.reduce((a, b) => (b.countedAt > a.countedAt ? b : a)).productId : null;
  });
  const [busy, setBusy] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const lastSeen = useRef<{ code: string; at: number } | null>(null);
  const leaving = useRef(false);
  const labels = useCountLabels();

  useEffect(() => {
    const sub = AppState.addEventListener('change', st => {
      setAppActive(st === 'active');
      // Camera access granted in system Settings is picked up on return (no app restart).
      if (st === 'active') void getPermission();
    });
    return () => sub.remove();
  }, [getPermission]);
  useEffect(() => {
    if (params?.openManual) { setManualOpen(true); nav.setParams({ openManual: undefined }); }
  }, [params?.openManual]);
  // Opening a paused count resumes it — but never while this screen is pausing it on the way out.
  useEffect(() => { if (session?.status === 'paused' && !leaving.current) void resumeCount(); }, [session?.status]);
  // The torch never stays on behind another screen.
  useEffect(() => { if (!focused) setTorch(false); }, [focused]);

  const handleCode = useCallback(async (raw: string, symbology: string) => {
    const code = normalizeBarcode(raw, symbology);
    if (!code) return;
    const now = Date.now();
    // The camera reports a code many times a second while it is in view. Every sighting
    // refreshes the window, so a held can counts once; it counts again only after it has
    // been out of view for the whole window.
    if (lastSeen.current && lastSeen.current.code === code && now - lastSeen.current.at < DUPLICATE_WINDOW_MS) {
      lastSeen.current.at = now;
      return;
    }
    if (busy) return;
    lastSeen.current = { code, at: now };
    setBusy(true);
    try {
      const r = await countScan(code, symbology);
      if (r.kind === 'unknown') {
        nav.navigate('UnknownBarcode', { code: r.code, symbology });
      } else if (r.kind === 'outOfScope') {
        setAlertOpen(true); // scanning stops while the question is open
        AppAlert.alert(t('scan.outOfScopeTitle'), t('scan.outOfScopeBody', { name: r.product.name }), [
          { text: t('common.cancel'), style: 'cancel', onPress: () => setAlertOpen(false) },
          { text: t('scan.addToCount'), onPress: () => { setAlertOpen(false); void countAddToScope(r.product.id).then(() => { setLastProductId(r.product.id); nav.navigate('QuickQuantity', { productId: r.product.id }); }); } },
        ]);
      } else {
        hapticOk();
        setLastProductId(r.product.id);
        if (r.outcome.kind === 'needsQuantity') nav.navigate('QuickQuantity', { productId: r.product.id });
      }
    } catch (e) {
      AppAlert.error(t('scan.scanFailed'));
    } finally { setBusy(false); }
  }, [busy, nav, t]);

  const onScanned = useCallback((r: BarcodeScanningResult) => { void handleCode(r.data, symbologyOf(r.type)); }, [handleCode]);

  const submitManual = () => {
    const code = manualCode.trim();
    if (!isAcceptableBarcode(code)) return;
    setManualOpen(false); setManualCode('');
    lastSeen.current = null;
    void handleCode(code, 'unknown');
  };

  if (!has || !session || !progress) return null;
  const last = lastProductId ? index.byId.get(lastProductId) : undefined;
  const lastEntry = last ? entryFor(session, last.id) : undefined;
  const camGranted = !!permission?.granted && Platform.OS !== 'web';
  const denied = !!permission && !permission.granted && !permission.canAskAgain;
  const scanning = camGranted && focused && appActive && !manualOpen && !busy && !alertOpen;
  // The camera runs only while this screen is visible and the app is in the foreground.
  const cameraOn = camGranted && focused && appActive;
  const caseUnits = last ? packUnitsOf(last, 'case') : null;
  const packUnits = last ? packUnitsOf(last, 'pack') : null;

  const leave = async () => { leaving.current = true; await pauseCount(); nav.replace('CountPaused'); };

  return (
    <Screen
      title={t('scan.title', { scope: scopeTitle(session) })}
      onBack={leave}
      testID="screen-ScanCount"
      footer={(
        <>
          <AppButton label={t('scan.typeCode')} variant="secondary" onPress={() => setManualOpen(true)} testID="scan-type-code" />
          <AppButton label={t('count.finish')} onPress={() => nav.navigate('Review')} testID="scan-finish" />
        </>
      )}
    >
      <View style={st.progressRow}>
        <Text style={st.progressText}>{t('count.progress', { counted: formatInt(progress.counted), total: formatInt(progress.total) })}</Text>
        <Text style={st.progressText}>{ltr(`${progress.percent}%`)}</Text>
      </View>
      <ProgressBar percent={progress.percent} testID="scan-progress" />
      <View style={st.scanner} testID="scan-viewport">
        {cameraOn ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{ barcodeTypes: [...SCANNER_BARCODE_TYPES] }}
              onBarcodeScanned={scanning ? onScanned : undefined}
              testID="scan-camera"
            />
            <View pointerEvents="none" style={st.frame} />
            <TouchableOpacity style={st.torch} onPress={() => setTorch(x => !x)} accessibilityRole="switch" accessibilityState={{ checked: torch }} accessibilityLabel={t('scan.torch')} testID="scan-torch">
              <Ionicons name={torch ? 'flashlight' : 'flashlight-outline'} size={22} color={tc.onNavy} />
            </TouchableOpacity>
          </>
        ) : (
          <View style={st.scannerIdle}>
            <Ionicons name="barcode-outline" size={44} color={tc.navy} />
            <Text style={st.scanTitle}>{t('scan.next')}</Text>
            <Text style={st.scanHint}>{t('scan.hint')}</Text>
            <View pointerEvents="none" style={st.idleFrame} />
          </View>
        )}
      </View>
      {!camGranted ? (
        denied ? (
          <StateCard
            tone="danger"
            title={t('states.cameraDenied.title')}
            body={t('states.cameraDenied.body')}
            testID="state-camera-denied"
            actions={[
              { label: t('states.cameraDenied.openSettings'), onPress: () => { void Linking.openSettings().catch(() => undefined); } },
              { label: t('states.cameraDenied.typeCode'), variant: 'danger', onPress: () => setManualOpen(true) },
            ]}
          />
        ) : (
          <AppButton label={t('permission.allow')} variant="secondary" onPress={() => { void markCameraExplained(); void requestPermission(); }} testID="scan-allow-camera" />
        )
      ) : null}
      {last ? (
        <ProductCountRow
          name={last.name}
          meta={productMeta(last)}
          quantity={lastEntry ? formatQty(lastEntry.quantityBase, last.countUnit) : '—'}
          counted={!!lastEntry}
          onMinus={() => { void countStep(last.id, -1); }}
          onPlus={() => { void countStep(last.id, 1); }}
          onQuantityPress={() => nav.navigate('QuickQuantity', { productId: last.id })}
          labels={labels}
          testID="scan-last-row"
        />
      ) : <Helper>{t('scan.ready')}</Helper>}
      {last && session.caseLooseEnabled && (caseUnits || packUnits) ? (
        <Card
          title={lastEntry?.caseCount !== undefined || lastEntry?.looseCount !== undefined
            ? t('count.caseLooseLine', { cases: formatInt(lastEntry?.caseCount ?? 0), per: formatInt(caseUnits ?? packUnits ?? 0), loose: formatQty(lastEntry?.looseCount ?? 0, last.countUnit) })
            : t('count.caseLooseEnter')}
          body={t('count.unitsTotal', { n: formatQty(lastEntry?.quantityBase ?? 0, last.countUnit) })}
          onPress={() => nav.navigate('QuickQuantity', { productId: last.id })}
          testID="scan-case-loose"
        />
      ) : null}
      <AppKeyboardBottomSheet
        visible={manualOpen}
        onClose={() => setManualOpen(false)}
        title={t('scan.typeCodeTitle')}
        footer={(
          <View style={{ gap: GAP }}>
            <AppButton label={t('common.continue')} onPress={submitManual} disabled={!isAcceptableBarcode(manualCode)} testID="manual-continue" />
            <AppButton label={t('common.cancel')} variant="secondary" onPress={() => setManualOpen(false)} />
          </View>
        )}
      >
        <TextField label={t('fields.barcode')} value={manualCode} onChangeText={setManualCode} keyboardType="number-pad" ltr placeholder="5000112637922" autoFocus testID="manual-code" onSubmitEditing={submitManual} />
        <Helper>{t('scan.typeCodeHint')}</Helper>
      </AppKeyboardBottomSheet>
    </Screen>
  );
};

// ─── 13 List count ───────────────────────────────────────────────────────────

export const ListCountScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const has = useOpenOrLeave();
  const progress = useOpenProgress();
  const session = progress?.session;
  const index = useAppState(s => s.index);
  const snapshots = useAppState(s => s.snapshots);
  const labels = useCountLabels();
  const leaving = useRef(false);
  useEffect(() => { if (session?.status === 'paused' && !leaving.current) void resumeCount(); }, [session?.status]);

  const entryMap = useMemo(() => new Map((session?.entries ?? []).map(e => [e.productId, e])), [session?.entries]);
  const rows = useMemo(() => (session?.productIdsSnapshot ?? []).map(id => index.byId.get(id)).filter((p): p is Product => !!p), [session?.productIdsSnapshot, index]);

  if (!has || !session || !progress) return null;
  const pause = async () => { leaving.current = true; await pauseCount(); nav.replace('CountPaused'); };

  return (
    <Screen
      title={t('screens.ListCount')}
      onBack={pause}
      noScroll
      testID="screen-ListCount"
      footer={(
        <>
          <AppButton label={t('count.pause')} variant="secondary" onPress={pause} testID="list-pause" />
          <AppButton label={t('count.review')} onPress={() => nav.navigate('Review')} testID="list-review" />
        </>
      )}
    >
      <FlatList
        data={rows}
        keyExtractor={p => p.id}
        initialNumToRender={12}
        windowSize={9}
        maxToRenderPerBatch={16}
        removeClippedSubviews
        contentContainerStyle={{ gap: GAP, paddingBottom: GUTTER }}
        ListHeaderComponent={(
          <View style={{ gap: 4 }}>
            <SectionTitle>{t('list.title', { scope: scopeTitle(session) })}</SectionTitle>
            <BodyText>{t('count.progress', { counted: formatInt(progress.counted), total: formatInt(progress.total) })}</BodyText>
          </View>
        )}
        renderItem={({ item }) => {
          const e = entryMap.get(item.id);
          const prev = snapshots[item.id];
          const meta = !session.blindCount && prev && !e ? `${productMeta(item)}${dot()}${t('count.previousShort', { qty: formatQty(prev.quantityBase, item.countUnit) })}` : productMeta(item);
          return (
            <ProductCountRow
              name={item.name}
              meta={meta}
              quantity={e ? formatQty(e.quantityBase, item.countUnit) : '—'}
              counted={!!e}
              onMinus={() => { void countStep(item.id, -1); }}
              onPlus={() => { void countStep(item.id, 1); }}
              onQuantityPress={() => nav.navigate('QuickQuantity', { productId: item.id })}
              labels={labels}
              testID={`list-row-${item.id}`}
            />
          );
        }}
      />
    </Screen>
  );
};

// ─── 14 Quick quantity ───────────────────────────────────────────────────────

type Field = 'quantity' | 'cases' | 'packs' | 'loose';

export const QuickQuantityScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { productId } = useParams<'QuickQuantity'>();
  const has = useOpenOrLeave();
  const product = useAppState(s => s.index.byId.get(productId));
  const session = useAppState(s => s.openSession);
  const entry = session ? entryFor(session, productId) : undefined;
  const caseUnits = product ? packUnitsOf(product, 'case') : null;
  const packUnits = product ? packUnitsOf(product, 'pack') : null;
  const caseLoose = !!session?.caseLooseEnabled && !!(caseUnits || packUnits);
  const [field, setField] = useState<Field>(caseLoose && entry?.caseCount !== undefined ? 'cases' : 'quantity');
  // Blind count: nothing is prefilled from history; the current entry of this count is shown.
  const [vals, setVals] = useState<Record<Field, string>>({
    quantity: entry ? String(entry.quantityBase) : '',
    cases: entry?.caseCount !== undefined ? String(entry.caseCount) : '',
    packs: entry?.packCount !== undefined ? String(entry.packCount) : '',
    loose: entry?.looseCount !== undefined ? String(entry.looseCount) : '',
  });
  const [error, setError] = useState<string | null>(null);
  if (!has || !product) return null;
  const measured = isMeasuredUnit(product.countUnit);
  const allowDecimal = measured && (field === 'quantity' || field === 'loose');
  const current = vals[field];

  const onKey = (k: string) => {
    setError(null);
    setVals(v => {
      const cur = v[field];
      if (k === '.' && (cur.includes('.') || !allowDecimal)) return v;
      const next = cur === '0' && k !== '.' ? k : cur + k;
      if (next.replace('.', '').length > 9) return v;
      return { ...v, [field]: next };
    });
  };

  // The active field decides: "Quantity" is a plain total, any other field is case + pack + loose.
  const usingParts = caseLoose && field !== 'quantity';
  const partsTotal = caseLooseTotal({ caseCount: parseQuantityText(vals.cases) ?? 0, packCount: parseQuantityText(vals.packs) ?? 0, looseCount: parseQuantityText(vals.loose) ?? 0 }, caseUnits, packUnits, product.countUnit);

  const done = async () => {
    try {
      if (usingParts) {
        const parts = { caseCount: parseQuantityText(vals.cases) ?? 0, packCount: parseQuantityText(vals.packs) ?? 0, looseCount: parseQuantityText(vals.loose) ?? 0 };
        if (!partsTotal.ok) { setError(t(`quantity.errors.${partsTotal.error}`)); return; }
        await countSetCaseLoose(product.id, parts, 'keypad');
      } else {
        const q = parseQuantityText(vals.quantity);
        const err = validateQuantity(q, product.countUnit);
        if (err) { setError(t(`quantity.errors.${err}`)); return; }
        await countSetQuantity(product.id, q!, 'keypad');
      }
      nav.goBack();
    } catch (e) {
      setError(t('quantity.errors.invalidCount'));
    }
  };

  const fieldLabel: Record<Field, string> = {
    quantity: t('quantity.quantity'),
    cases: t('quantity.cases', { n: formatInt(caseUnits ?? 0) }),
    packs: t('quantity.packs', { n: formatInt(packUnits ?? 0) }),
    loose: t('quantity.loose'),
  };

  return (
    <Screen title={t('screens.QuickQuantity')} onBack={() => nav.goBack()} testID="screen-QuickQuantity">
      <SectionTitle>{product.name}</SectionTitle>
      {caseLoose ? (
        <ChipRow>
          {(['quantity', ...(caseUnits ? ['cases'] : []), ...(packUnits ? ['packs'] : []), 'loose'] as Field[]).map(f => (
            <Chip key={f} label={fieldLabel[f]} active={field === f} onPress={() => setField(f)} testID={`qq-field-${f}`} />
          ))}
        </ChipRow>
      ) : null}
      <Card tone="info" title={t('quantity.currentEntry')} body={fieldLabel[field]} />
      <Text style={st.hero} testID="qq-value" accessibilityLiveRegion="polite">{current ? ltr(current) : '0'}</Text>
      {usingParts && partsTotal.ok ? <Helper center>{t('count.unitsTotal', { n: formatQty(partsTotal.total, product.countUnit) })}</Helper> : null}
      {measured ? <Helper center>{t('quantity.measuredHint', { unit: unitLabel(product.countUnit) })}</Helper> : null}
      {error ? <Text style={st.error} accessibilityLiveRegion="assertive" testID="qq-error">{error}</Text> : null}
      <Keypad
        onKey={onKey}
        onClear={() => { setError(null); setVals(v => ({ ...v, [field]: '' })); }}
        onDone={() => { void done(); }}
        labels={{ clear: t('quantity.clear'), done: t('common.done'), decimal: t('quantity.decimal') }}
        allowDecimal={allowDecimal}
      />
    </Screen>
  );
};

// ─── 15 Unknown barcode ──────────────────────────────────────────────────────

export const UnknownBarcodeScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { code, symbology } = useParams<'UnknownBarcode'>();
  const archivedId = useAppState(s => s.index.archivedByBarcode.get(normalizeBarcode(code, symbology)));
  const archived = useAppState(s => (archivedId ? s.index.byId.get(archivedId) : undefined));
  return (
    <Screen
      title={t('screens.UnknownBarcode')}
      onBack={() => nav.goBack()}
      testID="screen-UnknownBarcode"
      footer={(
        <>
          <AppButton label={t('unknown.addIt')} onPress={() => nav.replace('CreateFromScan', { code, symbology })} testID="unknown-add" />
          <AppButton label={t('unknown.scanAnother')} variant="secondary" onPress={() => nav.goBack()} testID="unknown-scan-another" />
          <AppButton label={t('unknown.typeCode')} variant="secondary" onPress={() => nav.navigate('ScanCount', { openManual: true })} testID="unknown-type" />
        </>
      )}
    >
      <SectionTitle>{t('unknown.title')}</SectionTitle>
      <Card tone="info" title={ltr(code)} body={t('unknown.notInList')} />
      {archived ? <Card tone="default" title={t('unknown.archivedTitle')} body={t('unknown.archivedBody', { name: archived.name })} onPress={() => nav.navigate('ProductDetail', { productId: archived.id })} /> : null}
      <Helper size="body">{t('unknown.helper')}</Helper>
    </Screen>
  );
};

// ─── 16 Create from scan ─────────────────────────────────────────────────────

export const CreateFromScanScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { code, symbology } = useParams<'CreateFromScan'>();
  const categories = useActiveNamed('categories');
  const defaultUnit = useAppState(s => s.settings.defaultCountUnit);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [unit, setUnit] = useState<CountUnit>(defaultUnit);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const gate = useProGate();

  const save = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t('products.errors.nameRequired');
    const q = qty.trim() ? parseQuantityText(qty) : null;
    if (qty.trim()) { const qe = validateQuantity(q, unit); if (qe) e.qty = t(`quantity.errors.${qe}`); }
    setErrors(e);
    if (Object.keys(e).length) return;
    if (!gate.allow('products')) return;
    setBusy(true);
    try {
      const r = await createProduct({ name, countUnit: unit, categoryId: categoryId || undefined, barcodes: [makeBarcode(newId('b'), code, 'single', 1, symbology)] });
      if (!r.ok) { setErrors({ name: r.errors.map(er => t(`products.errors.${er.code}`)).join(' ') }); return; }
      await countAddToScope(r.product.id);
      if (q !== null) await countSetQuantity(r.product.id, q, 'scan');
      nav.goBack();
    } catch {
      AppAlert.error(t('errors.saveFailed'));
    } finally { setBusy(false); }
  };

  return (
    <Screen title={t('screens.CreateFromScan')} onBack={() => nav.goBack()} keyboard testID="screen-CreateFromScan" footer={<AppButton label={t('create.save')} onPress={save} loading={busy} testID="create-save" />}>
      <SectionTitle>{t('create.newProduct')}</SectionTitle>
      <Card tone="info" title={t('create.captured')} body={ltr(code)} />
      <TextField label={t('fields.productName')} value={name} onChangeText={setName} placeholder={t('create.namePlaceholder')} error={errors.name} autoFocus testID="create-name" maxLength={120} />
      <TextField label={t('create.quantityNow')} value={qty} onChangeText={setQty} keyboardType={isMeasuredUnit(unit) ? 'decimal-pad' : 'number-pad'} placeholder={t('create.quantityPlaceholder')} error={errors.qty} testID="create-qty" />
      <SelectField label={t('fields.category')} value={categoryId || '__none'} onChange={v => setCategoryId(v === '__none' ? '' : v)} options={[{ value: '__none', label: t('products.uncategorised') }, ...categories.map(c => ({ value: c.id, label: c.name }))]} testID="create-category" />
      <SelectField label={t('fields.countUnit')} value={unit} onChange={v => setUnit(v)} options={COUNT_UNITS.map(u => ({ value: u, label: unitLabel(u) }))} testID="create-unit" />
      {gate.sheet}
    </Screen>
  );
};

// ─── 17 Count paused ─────────────────────────────────────────────────────────

export const CountPausedScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const progress = useOpenProgress();
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { if (!progress) nav.popToTop(); }, [progress, nav]);
  if (!progress) return null;
  const { session } = progress;
  const resume = async () => { await resumeCount(); nav.replace(session.mode === 'list' ? 'ListCount' : 'ScanCount'); };
  return (
    <Screen
      title={t('screens.CountPaused')}
      onBack={() => nav.goBack()}
      testID="screen-CountPaused"
      footer={(
        <>
          <AppButton label={t('count.resume')} onPress={resume} testID="paused-resume" />
          <AppButton label={t('paused.reviewProgress')} variant="secondary" onPress={() => nav.navigate('Review')} testID="paused-review" />
          <AppButton label={t('paused.discard')} variant="secondary" onPress={() => setConfirm(true)} testID="paused-discard" />
        </>
      )}
    >
      <SectionTitle>{t('screens.CountPaused')}</SectionTitle>
      <Card tone="info" title={scopeTitle(session)} body={t('paused.progress', { counted: formatInt(progress.counted), total: formatInt(progress.total), percent: progress.percent })} />
      <Helper size="body">{t('paused.saved')}</Helper>
      <StateDialog
        visible={confirm}
        tone="danger"
        title={t('states.discard.title')}
        body={t('states.discard.body')}
        onDismiss={() => setConfirm(false)}
        testID="state-discard"
        actions={[
          { label: t('states.discard.keep'), onPress: () => setConfirm(false), testID: 'discard-keep' },
          { label: t('states.discard.discard'), variant: 'danger', onPress: () => { setConfirm(false); void discardCount(); }, testID: 'discard-confirm' },
        ]}
      />
    </Screen>
  );
};

const st = StyleSheet.create({
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { ...tcType.bodySmall, color: tc.textMuted },
  scanner: { height: 226, borderRadius: 16, borderWidth: 1, borderColor: tc.navy, backgroundColor: tc.softBlue, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  scannerIdle: { alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  scanTitle: { ...tcType.sectionTitle, color: tc.textPrimary, textAlign: 'center' },
  scanHint: { ...tcType.bodySmall, color: tc.textMuted, textAlign: 'center' },
  idleFrame: { width: 244, height: 66, borderRadius: 12, borderWidth: 2, borderColor: tc.accent },
  frame: { width: 244, height: 110, borderRadius: 12, borderWidth: 2, borderColor: tc.accent },
  torch: { position: 'absolute', top: 8, end: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(26,37,64,0.6)', alignItems: 'center', justifyContent: 'center' },
  hero: { ...tcType.hero, color: tc.textPrimary, textAlign: 'center' },
  error: { ...tcType.bodySmall, color: tc.danger, textAlign: 'center' },
});
