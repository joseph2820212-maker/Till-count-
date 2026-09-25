/**
 * 40 Import Centre (25:942) · 41 CSV field mapping (25:974) · 42 Import review (25:1009) ·
 * 43 Import complete (26:928) · 44 Import from TillCalc (26:957)
 */
import React, { useMemo, useState } from 'react';
import { FlatList, I18nManager, StyleSheet, View } from 'react-native';
import { Text } from '../../../ui/Text';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../../components/AppButton';
import { Card, GAP, GUTTER, Helper, ListRow, Screen, SectionTitle, StateCard, ToggleRow } from '../../../ui/kit';
import { OptionSheet } from '../../../ui/overlays';
import { tc } from '../../../theme/colors';
import { tcType } from '../../../theme/typography';
import { getState, useAppState, commitCatalog } from '../../../state/store';
import { serialCatalog } from '../../../state/actions';
import { dot, formatInt, ltr } from '../../../utils/format';
import { logError } from '../../../utils/errorLog';
import { goTab, useNav, useParams } from '../../../navigation/nav';
import { useTier } from '../../billing/useTier';
import { productAllowance } from '../../billing/limits';
import { realActiveProductCount } from '../../billing/useProGate';
import {
  autoMap, classifyRows, IMPORT_FIELDS, isTillCalcCsv, MAX_IMPORT_BYTES, parseCsv, planImport, rowsFromTable, summarise,
  type ImportField, type ImportRow, type Mapping, type RowClass,
} from '../productImport';
import { MAX_TRANSFER_BYTES, parseTransfer, TransferParseError } from '../familyTransfer';
import { FileTooLargeError, pickTextFile } from '../files';
import { getImportSession, patchImportSession, setImportSession } from '../importSession';

type Problem = { title: string; body: string } | null;

function useFilePicker() {
  const { t } = useTranslation();
  const nav = useNav();
  const [problem, setProblem] = useState<Problem>(null);
  const [busy, setBusy] = useState(false);

  const pickCsv = async () => {
    setBusy(true); setProblem(null);
    try {
      const f = await pickTextFile(MAX_IMPORT_BYTES, ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/vnd.ms-excel', '*/*']);
      if (!f) return;
      const table = parseCsv(f.text);
      if (table.length < 2) { setProblem({ title: t('states.importProblem.title'), body: t('import.errors.empty') }); return; }
      const tillCalc = isTillCalcCsv(table[0]);
      setImportSession({ source: tillCalc ? 'tillcalcCsv' : 'csv', fileName: f.name, table, mapping: autoMap(table[0]), tillCalc });
      nav.navigate('CsvFieldMapping', { source: tillCalc ? 'tillcalcCsv' : 'csv' });
    } catch (e) {
      setProblem({ title: t('states.importProblem.title'), body: e instanceof FileTooLargeError ? t('import.errors.tooLarge') : t('import.errors.unreadable') });
    } finally { setBusy(false); }
  };

  const pickTransfer = async () => {
    setBusy(true); setProblem(null);
    try {
      const f = await pickTextFile(MAX_TRANSFER_BYTES, ['application/json', 'text/plain', 'text/csv', '*/*']);
      if (!f) return;
      if (/\.csv$/i.test(f.name) || (!f.text.trimStart().startsWith('{'))) {
        // A TillCalc CSV export also works here.
        const table = parseCsv(f.text);
        if (table.length < 2) { setProblem({ title: t('states.importProblem.title'), body: t('import.errors.empty') }); return; }
        setImportSession({ source: 'tillcalcCsv', fileName: f.name, table, mapping: autoMap(table[0]), tillCalc: isTillCalcCsv(table[0]) });
        nav.navigate('CsvFieldMapping', { source: 'tillcalcCsv' });
        return;
      }
      const rows = parseTransfer(f.text);
      setImportSession({ source: 'familyTransfer', fileName: f.name, rows });
      nav.navigate('ImportReview', { source: 'familyTransfer' });
    } catch (e) {
      const body = e instanceof TransferParseError ? t(`import.errors.transfer.${e.code}`) : e instanceof FileTooLargeError ? t('import.errors.tooLarge') : t('import.errors.unreadable');
      setProblem({ title: t('states.importProblem.title'), body });
    } finally { setBusy(false); }
  };

  return { problem, busy, pickCsv, pickTransfer, clear: () => setProblem(null) };
}

const ImportProblem: React.FC<{ problem: Problem; onReview?: () => void }> = ({ problem, onReview }) => {
  const { t } = useTranslation();
  if (!problem) return null;
  return <StateCard tone="danger" title={problem.title} body={problem.body} actions={onReview ? [{ label: t('states.importProblem.review'), variant: 'danger', onPress: onReview }] : []} testID="state-import-problem" />;
};

// ─── 40 Import Centre ────────────────────────────────────────────────────────

export const ImportCentreScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const picker = useFilePicker();
  return (
    <Screen title={t('screens.ImportCentre')} onBack={() => nav.goBack()} testID="screen-ImportCentre" footer={<AppButton label={t('import.chooseFile')} onPress={picker.pickCsv} loading={picker.busy} testID="import-choose" />}>
      <SectionTitle>{t('import.title')}</SectionTitle>
      <Card tone="info" title={t('import.csvTitle')} body={t('import.csvBody')} />
      <ListRow title={t('import.chooseCsv')} subtitle={t('import.chooseCsvBody')} onPress={picker.pickCsv} testID="import-csv-row" />
      <ListRow title={t('screens.ImportFromTillCalc')} subtitle={t('import.familyBody')} onPress={() => nav.navigate('ImportFromTillCalc')} testID="import-family-row" />
      <Card tone="success" title={t('import.safeTitle')} body={t('import.safeBody')} />
      <ImportProblem problem={picker.problem} />
    </Screen>
  );
};

// ─── 44 Import from TillCalc ─────────────────────────────────────────────────

export const ImportFromTillCalcScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const picker = useFilePicker();
  return (
    <Screen title={t('screens.ImportFromTillCalc')} onBack={() => nav.goBack()} testID="screen-ImportFromTillCalc" footer={<AppButton label={t('import.chooseFile')} onPress={picker.pickTransfer} loading={picker.busy} testID="family-choose" />}>
      <SectionTitle>{t('import.familyTitle')}</SectionTitle>
      <Card tone="info" title={t('import.transferTitle')} body={t('import.transferBody')} />
      <ListRow title={t('import.chooseFamily')} subtitle={t('import.chooseFamilyBody')} onPress={picker.pickTransfer} testID="family-row" />
      <Card tone="success" title={t('import.independentTitle')} body={t('import.independentBody')} />
      <ImportProblem problem={picker.problem} />
    </Screen>
  );
};

// ─── 41 CSV field mapping ────────────────────────────────────────────────────

export const CsvFieldMappingScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const session = getImportSession();
  const [mapping, setMapping] = useState<Mapping>(session?.mapping ?? []);
  const [editing, setEditing] = useState<number | null>(null);
  if (!session?.table) return <Screen title={t('screens.CsvFieldMapping')} onBack={() => nav.goBack()} testID="screen-CsvFieldMapping"><Helper>{t('import.errors.noSession')}</Helper></Screen>;
  const headers = session.table[0];
  const hasName = mapping.includes('name');
  const setField = (col: number, f: ImportField | 'ignore') => setMapping(m => m.map((x, i) => (i === col ? f : f !== 'ignore' && x === f ? 'ignore' : x)));
  const next = () => {
    const rows = rowsFromTable(session.table!, mapping, { tillCalc: session.tillCalc });
    patchImportSession({ mapping, rows });
    nav.navigate('ImportReview', { source: session.source });
  };
  const options = [{ value: 'ignore' as const, label: t('import.field.ignore') }, ...IMPORT_FIELDS.map(f => ({ value: f, label: t(`import.field.${f}`) }))];
  return (
    <Screen title={t('screens.CsvFieldMapping')} onBack={() => nav.goBack()} testID="screen-CsvFieldMapping" footer={<AppButton label={t('import.reviewRows')} onPress={next} disabled={!hasName} testID="mapping-review" />}>
      <SectionTitle>{t('import.matchColumns')}</SectionTitle>
      <Helper>{t('import.matchHelper')}</Helper>
      {session.tillCalc ? <Card tone="info" title={t('import.tillCalcDetected')} body={t('import.tillCalcDetectedBody')} /> : null}
      {!hasName ? <Card tone="danger" title={t('import.needName')} body={t('import.needNameBody')} /> : null}
      {headers.map((h, i) => (
        <View key={i}>
          <ListRow
            title={h || t('import.columnN', { n: i + 1 })}
            right={(
              <View style={s.targetWrap}>
                <Text style={s.arrow}>{I18nManager.isRTL ? '←' : '→'}</Text>
                <Text style={[s.target, mapping[i] === 'ignore' && s.ignored]} numberOfLines={1}>{t(`import.field.${mapping[i] ?? 'ignore'}`)}</Text>
              </View>
            )}
            onPress={() => setEditing(i)}
            chevron={false}
            testID={`mapping-${i}`}
          />
        </View>
      ))}
      <OptionSheet visible={editing !== null} onClose={() => setEditing(null)} title={editing !== null ? [headers[editing] || t('import.columnN', { n: editing + 1 }), session.table![1]?.[editing] ? t('import.example', { value: session.table![1][editing] }) : ''].filter(Boolean).join(dot()) : ''} options={options} value={editing !== null ? mapping[editing] : undefined} onSelect={v => { if (editing !== null) setField(editing, v); }} />
    </Screen>
  );
};

// ─── 42 Import review ────────────────────────────────────────────────────────

function statusLine(t: (k: string, o?: Record<string, unknown>) => string, c: RowClass, name: (id: string) => string): string {
  if (c.kind === 'attention') return `! ${c.row.issues.map(i => t(`import.issue.${i}`)).join(', ')}`;
  if (c.kind === 'match') return `= ${t('import.matchLine', { name: name(c.productId), by: t(`import.by.${c.by}`) })}`;
  const detail = c.row.barcodes[0] ? t('import.readyBarcode', { code: ltr(c.row.barcodes[0].code) }) : c.row.category ? t('import.readyCategory', { name: c.row.category }) : c.row.supplier ? t('import.readySupplier', { name: c.row.supplier }) : t('import.readyManual');
  return `✓ ${t('import.ready')}${dot()}${detail}`;
}

export const ImportReviewScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const session = getImportSession();
  const index = useAppState(s => s.index);
  const tier = useTier();
  const [updateMatched, setUpdateMatched] = useState(false);
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const classes = useMemo(() => (session?.rows ? classifyRows(session.rows, index) : []), [session?.rows, index]);
  const summary = summarise(classes);
  const allowance = productAllowance(tier, realActiveProductCount());
  const creates = Math.min(summary.newRows, allowance);
  const ready = creates + (updateMatched ? summary.matched : 0);
  const shown = onlyIssues ? classes.filter(c => c.kind === 'attention') : classes;

  const run = async () => {
    setBusy(true); setFailed(false);
    try {
      // Planned and written in the catalogue queue, against the catalogue as it is at that moment.
      const plan = await serialCatalog(async () => {
        const st = getState();
        const p = planImport(classes, { products: st.products, categories: st.categories, suppliers: st.suppliers, locations: st.locations }, { updateMatched, allowance, now: new Date().toISOString() });
        await commitCatalog(p.next); // one transaction: all or nothing
        return p;
      });
      patchImportSession({ skipped: [...classes.filter(c => c.kind === 'attention').map(c => c.row), ...plan.refusedRows] });
      nav.replace('ImportComplete', { added: plan.added, updated: plan.updated, skipped: plan.skipped + plan.skippedForLimit });
    } catch (e) {
      setFailed(true);
      void logError('import', e);
    } finally { setBusy(false); }
  };

  if (!session?.rows) return <Screen title={t('screens.ImportReview')} onBack={() => nav.goBack()} testID="screen-ImportReview"><Helper>{t('import.errors.noSession')}</Helper></Screen>;
  return (
    <Screen
      title={t('screens.ImportReview')}
      onBack={() => nav.goBack()}
      noScroll
      testID="screen-ImportReview"
      footer={(
        <>
          <AppButton label={t('import.importReady', { count: ready, n: formatInt(ready) })} onPress={run} loading={busy} disabled={ready === 0} testID="review-import" />
          {summary.attention ? <AppButton label={onlyIssues ? t('import.showAll') : t('import.fixRows', { count: summary.attention, n: formatInt(summary.attention) })} variant="secondary" onPress={() => setOnlyIssues(x => !x)} testID="review-fix" /> : null}
        </>
      )}
    >
      <FlatList
        data={shown}
        keyExtractor={c => String(c.row.line)}
        initialNumToRender={15}
        windowSize={9}
        contentContainerStyle={{ gap: GAP, paddingBottom: GUTTER }}
        ListHeaderComponent={(
          <View style={{ gap: GAP }}>
            <SectionTitle>{t('import.reviewN', { count: classes.length, n: formatInt(classes.length) })}</SectionTitle>
            <Card tone="info" title={t('import.readyAttention', { ready: formatInt(ready), attention: formatInt(summary.attention) })} body={t('import.nothingUntilConfirm')} testID="review-summary" />
            {summary.matched ? (
              <ToggleRow title={t('import.updateMatched', { n: formatInt(summary.matched) })} subtitle={t('import.updateMatchedBody')} value={updateMatched} onChange={setUpdateMatched} testID="review-update-matched" />
            ) : null}
            {summary.newRows > allowance ? <Card tone="info" title={t('states.freeLimit.title')} body={t('import.limitBody', { n: formatInt(allowance), total: formatInt(summary.newRows) })} /> : null}
            {failed ? <StateCard tone="danger" title={t('states.importProblem.title')} body={t('import.errors.writeFailed')} actions={[{ label: t('states.exportProblem.retry'), variant: 'danger', onPress: run }]} testID="state-import-problem" /> : null}
          </View>
        )}
        renderItem={({ item }) => (
          <ListRow
            title={item.row.name || t('import.unknownRow', { n: item.row.line })}
            subtitle={statusLine(t, item, id => index.byId.get(id)?.name ?? '')}
            chevron={false}
            testID={`review-row-${item.row.line}`}
          />
        )}
      />
    </Screen>
  );
};

// ─── 43 Import complete ──────────────────────────────────────────────────────

export const ImportCompleteScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { added, updated, skipped } = useParams<'ImportComplete'>();
  const [showSkipped, setShowSkipped] = useState(false);
  const skippedRows: ImportRow[] = getImportSession()?.skipped ?? [];
  const done = () => { setImportSession(null); nav.popToTop(); };
  return (
    <Screen title={t('screens.ImportComplete')} onBack={done} testID="screen-ImportComplete" footer={<AppButton label={t('common.done')} onPress={done} testID="import-done" />}>
      <SectionTitle>{t('screens.ImportComplete')}</SectionTitle>
      <Card
        tone="success"
        title={t('import.added', { count: added, n: formatInt(added) })}
        body={[updated ? t('import.updatedLine', { n: formatInt(updated) }) : null, skipped ? t('import.skippedLine', { count: skipped, n: formatInt(skipped) }) : null].filter(Boolean).join(' ') || t('import.allDone')}
        testID="import-complete-card"
      />
      <ListRow title={t('import.viewProducts')} subtitle={t('import.viewProductsBody')} onPress={() => { setImportSession(null); nav.popToTop(); goTab(nav, 'Products'); }} testID="import-view-products" />
      {skippedRows.length ? <ListRow title={t('import.skippedRows')} subtitle={t('import.reviewN', { count: skippedRows.length, n: formatInt(skippedRows.length) })} onPress={() => setShowSkipped(x => !x)} testID="import-skipped" /> : null}
      {showSkipped ? skippedRows.map(r => (
        <ListRow key={r.line} title={r.name || t('import.unknownRow', { n: r.line })} subtitle={`! ${t('import.lineN', { n: r.line })}${dot()}${r.issues.map(i => t(`import.issue.${i}`)).join(', ')}`} chevron={false} tone="danger" />
      )) : null}
    </Screen>
  );
};

const s = StyleSheet.create({
  /** Arrow + target field in a fixed column (Figma field mapping). */
  targetWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 150 },
  arrow: { ...tcType.body, color: tc.textFaint },
  target: { ...tcType.body, color: tc.accent, flexShrink: 1 },
  ignored: { color: tc.textFaint },
});
