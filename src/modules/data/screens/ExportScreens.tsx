/**
 * 36 Export Centre (25:829) · 37 Count PDF preview (25:868) · 38 Reorder PDF preview (25:892) ·
 * 39 CSV preview (25:917) · 45 Family export (26:983)
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../../ui/Text';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../../components/AppButton';
import { Card, Helper, ListRow, Screen, SectionTitle, StateCard } from '../../../ui/kit';
import { tc } from '../../../theme/colors';
import { tcType } from '../../../theme/typography';
import { useAppState, loadFullSession } from '../../../state/store';
import { useCompletedSessions, useReorder } from '../../../state/selectors';
import { needsReorder } from '../../../domain/reorderEngine';
import { NO_SUPPLIER_ID } from '../../../domain/countEngine';
import type { CountSession } from '../../../domain/types';
import { formatInt, ltr } from '../../../utils/format';
import { logError } from '../../../utils/errorLog';
import { useNav, useParams } from '../../../navigation/nav';
import { scopeTitle } from '../../count/scopeLabel';
import { useProGate } from '../../billing/useProGate';
import { countReportData, countReportHtml, csvFileStamp, productsCsvRows, reorderCsvRows, reorderReportData, reorderReportHtml } from '../reports';
import { exportCsv, exportPdf, writeExport, shareUri } from '../files';
import { buildTransfer, transferFileName, type FamilyApp } from '../familyTransfer';

/** Export problem (state 11): data is never touched by a failed export. */
const ExportProblem: React.FC<{ visible: boolean; onRetry: () => void }> = ({ visible, onRetry }) => {
  const { t } = useTranslation();
  if (!visible) return null;
  return <StateCard tone="danger" title={t('states.exportProblem.title')} body={t('states.exportProblem.body')} actions={[{ label: t('states.exportProblem.retry'), variant: 'danger', onPress: onRetry }]} testID="state-export-problem" />;
};

function useExportAction(run: () => Promise<unknown>) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const go = async () => {
    setBusy(true); setFailed(false);
    try { await run(); } catch (e) { setFailed(true); void logError('export', e); } finally { setBusy(false); }
  };
  return { busy, failed, go };
}

// ─── 36 Export Centre ────────────────────────────────────────────────────────

export const ExportCentreScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const completed = useCompletedSessions();
  const gate = useProGate();
  const open = (fn: () => void) => () => { if (gate.allow('reportExport')) fn(); };
  return (
    <Screen title={t('screens.ExportCentre')} onBack={() => nav.goBack()} testID="screen-ExportCentre">
      <SectionTitle>{t('export.title')}</SectionTitle>
      <ListRow title={t('export.countPdf')} subtitle={completed.length ? t('export.countPdfBody') : t('states.historyEmpty.title')} onPress={completed.length ? open(() => nav.navigate('CountPdfPreview', { sessionId: completed[0].id })) : undefined} testID="export-count-pdf" />
      <ListRow title={t('export.reorderPdf')} subtitle={t('export.reorderPdfBody')} onPress={open(() => nav.navigate('ReorderPdfPreview', { supplierId: null }))} testID="export-reorder-pdf" />
      <ListRow title={t('export.reorderCsv')} subtitle={t('export.csvBody')} onPress={open(() => nav.navigate('CsvPreview', { kind: 'reorder' }))} testID="export-reorder-csv" />
      <ListRow title={t('export.productsCsv')} subtitle={t('export.productsCsvBody')} onPress={open(() => nav.navigate('CsvPreview', { kind: 'products' }))} testID="export-products-csv" />
      <Card tone="info" title={t('export.privacyTitle')} body={t('export.privacyBody')} />
      {gate.sheet}
    </Screen>
  );
};

/** Figma PDF page mock (330 × 470 card) rendering the same data the PDF is built from. */
const PageMock: React.FC<{ lines: { text: string; style: 'mast' | 'title' | 'faint' | 'body' | 'gap' }[] }> = ({ lines }) => (
  <View style={s.page} accessible accessibilityRole="summary">
    <ScrollView nestedScrollEnabled contentContainerStyle={{ gap: 4 }}>
      {lines.map((l, i) => l.style === 'gap' ? <View key={i} style={{ height: 8 }} /> : (
        <Text key={i} style={l.style === 'mast' ? s.mast : l.style === 'title' ? s.pageTitle : l.style === 'faint' ? s.faint : s.pageBody}>{l.text}</Text>
      ))}
    </ScrollView>
  </View>
);

function dots(name: string, qty: string): string {
  const width = 26;
  const n = Math.max(2, width - name.length - qty.length);
  return `${name} ${'.'.repeat(n)} ${qty}`;
}

// ─── 37 Count PDF preview ────────────────────────────────────────────────────

export const CountPdfPreviewScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const params = useParams<'CountPdfPreview'>();
  const completed = useCompletedSessions();
  const sessionId = params?.sessionId ?? completed[0]?.id;
  const [session, setSession] = useState<CountSession | null | undefined>(undefined);
  useEffect(() => { if (sessionId) loadFullSession(sessionId).then(setSession, () => setSession(null)); else setSession(null); }, [sessionId]);
  const data = useMemo(() => (session ? countReportData(session, scopeTitle(session), session.attentionAtCompletion ?? { out: 0, low: 0 }) : null), [session]);
  const action = useExportAction(async () => { if (data && session) await exportPdf(`TillCount_Count_${csvFileStamp(new Date(session.completedAt ?? Date.now()))}`, countReportHtml(data), t('export.countPdf')); });
  if (session === undefined) return <Screen title={t('screens.CountPdfPreview')} onBack={() => nav.goBack()} testID="screen-CountPdfPreview" />;
  if (!data) return <Screen title={t('screens.CountPdfPreview')} onBack={() => nav.goBack()} testID="screen-CountPdfPreview"><StateCard tone="info" title={t('states.historyEmpty.title')} body={t('states.historyEmpty.body')} /></Screen>;
  return (
    <Screen title={t('screens.CountPdfPreview')} onBack={() => nav.goBack()} testID="screen-CountPdfPreview" footer={<AppButton label={t('export.sharePdf')} onPress={action.go} loading={action.busy} testID="pdf-share" />}>
      <PageMock lines={[
        { text: 'TillCount', style: 'mast' },
        { text: data.title, style: 'title' },
        { text: t('pdf.generated', { date: data.generatedAt }), style: 'faint' },
        { text: t('pdf.productsUnits', { products: formatInt(data.products), units: formatInt(data.units) }), style: 'body' },
        { text: t('pdf.lowOut', { low: formatInt(data.low), out: formatInt(data.out) }), style: 'body' },
        { text: t('pdf.stockValue', { value: data.stockValue }), style: 'body' },
        { text: '', style: 'gap' },
        ...data.lines.slice(0, 60).map(l => ({ text: dots(l.name, l.qty), style: 'body' as const })),
        ...(data.lines.length > 60 ? [{ text: t('pdf.moreLines', { n: formatInt(data.lines.length - 60) }), style: 'faint' as const }] : []),
      ]} />
      <ExportProblem visible={action.failed} onRetry={action.go} />
    </Screen>
  );
};

// ─── 38 Reorder PDF preview ──────────────────────────────────────────────────

function useReorderScope(supplierId: string | null | undefined) {
  const { attention } = useReorder();
  const lookups = useAppState(s => s.lookups);
  const hideNoTarget = useAppState(s => s.settings.productsWithoutTarget === 'hide');
  return useMemo(() => {
    let lines = attention.filter(l => needsReorder(l));
    if (hideNoTarget) lines = lines.filter(l => l.product.targetStock !== undefined);
    if (supplierId) lines = lines.filter(l => (supplierId === NO_SUPPLIER_ID ? !l.product.supplierId || !lookups.suppliers.has(l.product.supplierId) : l.product.supplierId === supplierId));
    const label = supplierId ? (supplierId === NO_SUPPLIER_ID ? null : lookups.suppliers.get(supplierId)?.name ?? null) : null;
    return { lines, label, suppliers: lookups.suppliers };
  }, [attention, lookups, supplierId, hideNoTarget]);
}

export const ReorderPdfPreviewScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const params = useParams<'ReorderPdfPreview'>();
  const { lines, label, suppliers } = useReorderScope(params?.supplierId);
  const data = useMemo(() => reorderReportData(lines, suppliers, label), [lines, suppliers, label]);
  const action = useExportAction(async () => { await exportPdf(`TillCount_Reorder_${csvFileStamp()}`, reorderReportHtml(data), t('export.reorderPdf')); });
  const flat = data.groups.flatMap(g => [...(data.groups.length > 1 ? [{ text: g.supplier, style: 'title' as const }] : []), ...g.lines.map(l => ({ text: dots(l.name, l.qty), style: 'body' as const }))]);
  return (
    <Screen title={t('screens.ReorderPdfPreview')} onBack={() => nav.goBack()} testID="screen-ReorderPdfPreview" footer={<AppButton label={t('export.sharePdf')} onPress={action.go} loading={action.busy} disabled={lines.length === 0} testID="pdf-share" />}>
      {lines.length === 0 ? <StateCard tone="success" title={t('states.reorderEmpty.title')} body={t('states.reorderEmpty.body')} /> : (
        <PageMock lines={[
          { text: 'TillCount', style: 'mast' },
          { text: data.title, style: 'title' },
          { text: t('pdf.generated', { date: data.generatedAt }), style: 'faint' },
          { text: t('pdf.itemsToOrder', { count: data.count }), style: 'body' },
          { text: '', style: 'gap' },
          ...flat.slice(0, 80),
          { text: '', style: 'gap' },
          { text: t('pdf.reorderNote'), style: 'body' },
        ]} />
      )}
      <ExportProblem visible={action.failed} onRetry={action.go} />
    </Screen>
  );
};

// ─── 39 CSV preview ──────────────────────────────────────────────────────────

export const CsvPreviewScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { kind, supplierId } = useParams<'CsvPreview'>();
  const products = useAppState(s => s.products);
  const lookups = useAppState(s => s.lookups);
  const snapshots = useAppState(s => s.snapshots);
  const { lines } = useReorderScope(supplierId);
  const rows = useMemo(() => (kind === 'products' ? productsCsvRows(products, lookups, snapshots) : reorderCsvRows(lines, lookups.suppliers)), [kind, products, lookups, snapshots, lines]);
  const fileName = kind === 'products' ? `TillCount_Products_${csvFileStamp()}.csv` : `TillCount_Reorder_${csvFileStamp()}.csv`;
  const action = useExportAction(async () => { await exportCsv(fileName, rows, fileName); });
  const [header, ...body] = rows;
  const visibleCols = kind === 'products' ? [0, 2, 3, 4, 12] : [0, 1, 2, 3, 4];
  return (
    <Screen title={t('screens.CsvPreview')} onBack={() => nav.goBack()} testID="screen-CsvPreview" footer={<AppButton label={t('export.exportCsv')} onPress={action.go} loading={action.busy} disabled={body.length === 0} testID="csv-export" />}>
      <SectionTitle>{kind === 'products' ? 'Products.csv' : 'Reorder.csv'}</SectionTitle>
      <Card tone="info" title={t('export.rows', { count: body.length, n: formatInt(body.length) })} body={t('export.columns', { columns: visibleCols.map(i => String(header[i] ?? '')).join(' · ') })} />
      {body.length === 0 ? <Helper>{t('export.noRows')}</Helper> : null}
      {body.slice(0, 50).map((r, i) => (
        <View key={i} style={s.csvRow}><Text style={s.csvText} numberOfLines={1}>{visibleCols.map(c => String(r[c] ?? '')).join(' | ')}</Text></View>
      ))}
      {body.length > 50 ? <Helper>{t('export.moreRows', { n: formatInt(body.length - 50) })}</Helper> : null}
      <ExportProblem visible={action.failed} onRetry={action.go} />
    </Screen>
  );
};

// ─── 45 Family export ────────────────────────────────────────────────────────

export const FamilyExportScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const products = useAppState(s => s.products);
  const lookups = useAppState(s => s.lookups);
  const [app, setApp] = useState<FamilyApp>('TillCalc');
  const gate = useProGate();
  const count = products.filter(p => p.status === 'active' && !p.isSample).length;
  const action = useExportAction(async () => {
    const file = buildTransfer(products, lookups);
    const uri = await writeExport(transferFileName(), JSON.stringify(file, null, 2), 'json');
    await shareUri(uri, 'application/json', t('family.shareTitle', { app }));
  });
  return (
    <Screen title={t('screens.FamilyExport')} onBack={() => nav.goBack()} testID="screen-FamilyExport" footer={<AppButton label={t('family.create')} onPress={() => { if (gate.allow('familyExport')) void action.go(); }} loading={action.busy} disabled={count === 0} testID="family-create" />}>
      <SectionTitle>{t('family.title')}</SectionTitle>
      <Card tone="info" title={t('family.ready', { count, n: formatInt(count) })} body={t('family.readyBody')} />
      {(['TillCalc', 'TillLabel', 'TillExpiry'] as FamilyApp[]).map(a => (
        <ListRow key={a} title={a} subtitle={t(`family.app.${a}`)} selected={app === a} onPress={() => setApp(a)} testID={`family-${a}`} />
      ))}
      <Helper>{t('family.sameFile')}</Helper>
      <ExportProblem visible={action.failed} onRetry={action.go} />
      {gate.sheet}
    </Screen>
  );
};

const s = StyleSheet.create({
  page: { alignSelf: 'center', width: '92%', maxWidth: 330, height: 470, backgroundColor: tc.card, borderWidth: 1, borderColor: tc.border, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 22 },
  mast: { ...tcType.sectionTitle, color: tc.textPrimary },
  pageTitle: { ...tcType.cardTitle, color: tc.textPrimary },
  faint: { ...tcType.micro, color: tc.textFaint },
  pageBody: { ...tcType.bodySmall, color: tc.textMuted, writingDirection: 'ltr' },
  csvRow: { minHeight: 46, justifyContent: 'center', backgroundColor: tc.card, borderWidth: 1, borderColor: tc.rule, paddingHorizontal: 12 },
  csvText: { ...tcType.bodySmall, color: tc.textMuted },
});

export { ltr };
