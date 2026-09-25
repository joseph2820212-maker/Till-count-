/**
 * 52 Data & backup (27:1261) · 53 Create backup (27:1306) · 54 Backup success (27:1334) ·
 * 55 Restore file (27:1354) · 56 Restore password (27:1380) · 57 Restore preview (28:1264) ·
 * 58 Restore complete (28:1310)
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../components/AppButton';
import { Card, Helper, ListRow, Screen, SectionTitle, StateCard } from '../../ui/kit';
import { TextField } from '../../ui/fields';
import { StateDialog } from '../../ui/overlays';
import { flushOpenSession, getState, loadStore, resetStoreForTests, useAppState } from '../../state/store';
import { setNumberFormatOverride } from '../../utils/locale';
import { removeSampleData } from '../onboarding/sampleData';
import { APP_VERSION } from '../../appMeta';
import { dot, formatDate, formatDayMonth, formatInt, ltr, setDateFormat } from '../../utils/format';
import { logError } from '../../utils/errorLog';
import { goTab, useNav, useParams } from '../../navigation/nav';
import { pickTextFile, FileTooLargeError } from '../data/files';
import {
  applyRestore, createBackup, decryptBackup, inspectText, MAX_BACKUP_BYTES, MIN_PASSPHRASE_LENGTH, RestoreError, shareBackup,
} from './backupFile';
import { clearRestoreSession, getInspection, getStaged, setInspection, setStaged } from './restoreSession';

// ─── 52 Data & backup ────────────────────────────────────────────────────────

export const DataBackupScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const hasSamples = useAppState(st => st.products.some(p => p.isSample));
  // Samples can be removed only when no open count includes them.
  const sampleCountOpen = useAppState(st => !!st.openSession && (!!st.openSession.isSample || st.openSession.productIdsSnapshot.some(id => id.startsWith('sample_'))));
  const [confirmSamples, setConfirmSamples] = useState(false);
  const [sampleNote, setSampleNote] = useState<string | null>(null);
  const removeSamples = async () => {
    setConfirmSamples(false);
    try {
      await removeSampleData();
      setSampleNote(t('data.sampleRemoved'));
    } catch (e) {
      logError('removeSampleData', e);
      setSampleNote(t('data.removeSampleOpenCount'));
    }
  };
  return (
    <Screen title={t('screens.DataBackup')} onBack={() => nav.goBack()} testID="screen-DataBackup">
      <SectionTitle>{t('data.yourData')}</SectionTitle>
      <ListRow title={t('data.createBackup')} subtitle={t('data.createBackupBody')} onPress={() => nav.navigate('CreateBackup')} testID="data-create-backup" />
      <ListRow title={t('data.restoreBackup')} subtitle={t('data.restoreBackupBody')} onPress={() => nav.navigate('RestoreFile')} testID="data-restore" />
      <ListRow title={t('data.importProducts')} subtitle={t('data.importProductsBody')} onPress={() => nav.navigate('ImportCentre')} testID="data-import" />
      <ListRow title={t('data.exportProducts')} subtitle={t('data.exportProductsBody')} onPress={() => nav.navigate('FamilyExport')} testID="data-export-products" />
      <ListRow title={t('data.exportReports')} subtitle={t('data.exportReportsBody')} onPress={() => nav.navigate('ExportCentre')} testID="data-export-reports" />
      {hasSamples ? (
        <ListRow
          title={t('data.removeSample')}
          subtitle={sampleCountOpen ? t('data.removeSampleOpenCount') : t('data.removeSampleBody')}
          onPress={sampleCountOpen ? undefined : () => setConfirmSamples(true)}
          chevron={!sampleCountOpen}
          testID="data-remove-sample"
        />
      ) : null}
      {sampleNote ? <Helper>{sampleNote}</Helper> : null}
      <Card tone="success" title={t('data.offlineTitle')} body={t('data.offlineBody')} />
      <StateDialog
        visible={confirmSamples}
        tone="danger"
        title={t('data.removeSampleTitle')}
        body={t('data.removeSampleConfirmBody')}
        onDismiss={() => setConfirmSamples(false)}
        testID="state-remove-sample"
        actions={[
          { label: t('common.cancel'), onPress: () => setConfirmSamples(false), testID: 'remove-sample-cancel' },
          { label: t('data.removeSampleConfirm'), variant: 'danger', onPress: () => { void removeSamples(); }, testID: 'remove-sample-confirm' },
        ]}
      />
    </Screen>
  );
};

// ─── 53 Create backup ────────────────────────────────────────────────────────

export const CreateBackupScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ pass?: string; confirm?: string }>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const create = async () => {
    const e: typeof errors = {};
    if (pass.length < MIN_PASSPHRASE_LENGTH) e.pass = t('backup.errors.short', { n: MIN_PASSPHRASE_LENGTH });
    if (confirm !== pass) e.confirm = t('backup.errors.mismatch');
    setErrors(e);
    if (e.pass || e.confirm) return;
    setBusy(true); setFailed(false);
    try {
      await flushOpenSession();
      const r = await createBackup(pass, APP_VERSION, false);
      setPass(''); setConfirm('');
      nav.replace('BackupSuccess', { fileName: r.fileName, uri: r.uri, products: r.entityCounts.products, counts: r.entityCounts.completedCounts });
    } catch (err) {
      setFailed(true);
      void logError('backup', err);
    } finally { setBusy(false); }
  };

  return (
    <Screen title={t('screens.CreateBackup')} onBack={() => nav.goBack()} keyboard testID="screen-CreateBackup" footer={<AppButton label={t('backup.create')} onPress={create} loading={busy} testID="backup-create" />}>
      <SectionTitle>{t('backup.protect')}</SectionTitle>
      <Card tone="info" title={t('backup.includesTitle')} body={t('backup.includesBody')} />
      <TextField label={t('backup.password')} value={pass} onChangeText={setPass} secure error={errors.pass} testID="backup-pass" />
      <TextField label={t('backup.confirm')} value={confirm} onChangeText={setConfirm} secure error={errors.confirm} testID="backup-confirm" />
      <Card tone="danger" title={t('backup.importantTitle')} body={t('backup.importantBody')} />
      {failed ? <StateCard tone="danger" title={t('states.exportProblem.title')} body={t('states.exportProblem.body')} actions={[{ label: t('states.exportProblem.retry'), variant: 'danger', onPress: create }]} testID="state-export-problem" /> : null}
    </Screen>
  );
};

// ─── 54 Backup success ───────────────────────────────────────────────────────

export const BackupSuccessScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { fileName, uri, products, counts } = useParams<'BackupSuccess'>();
  const [failed, setFailed] = useState(false);
  const share = async () => { setFailed(false); try { await shareBackup(uri); } catch (e) { setFailed(true); void logError('backupShare', e); } };
  return (
    <Screen
      title={t('screens.BackupSuccess')}
      onBack={() => nav.goBack()}
      testID="screen-BackupSuccess"
      footer={(
        <>
          <AppButton label={t('backup.share')} onPress={share} testID="backup-share" />
          <AppButton label={t('common.done')} variant="secondary" onPress={() => nav.goBack()} testID="backup-done" />
        </>
      )}
    >
      <SectionTitle>{t('backup.created')}</SectionTitle>
      <Card tone="success" strongBorder title={ltr(fileName)} body={[t('plural.products', { count: products, n: formatInt(products) }), t('plural.completedCounts', { count: counts, n: formatInt(counts) }), t('backup.settingsIncluded')].join(dot())} testID="backup-file-card" />
      <Helper size="body">{t('backup.saveSomewhere')}</Helper>
      {failed ? <StateCard tone="danger" title={t('states.exportProblem.title')} body={t('states.exportProblem.body')} actions={[{ label: t('states.exportProblem.retry'), variant: 'danger', onPress: share }]} /> : null}
    </Screen>
  );
};

// ─── 55 Restore file ─────────────────────────────────────────────────────────

export const RestoreFileScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const choose = async () => {
    setBusy(true); setProblem(null);
    try {
      const f = await pickTextFile(MAX_BACKUP_BYTES, ['*/*']);
      if (!f) return;
      setInspection(inspectText(f.text, f.name));
      nav.navigate('RestorePassword');
    } catch (e) {
      setProblem(e instanceof RestoreError ? t(`restore.errors.${e.code}`) : e instanceof FileTooLargeError ? t('restore.errors.too-large') : t('restore.errors.unreadable'));
    } finally { setBusy(false); }
  };
  return (
    <Screen title={t('screens.RestoreFile')} onBack={() => nav.goBack()} testID="screen-RestoreFile" footer={<AppButton label={t('import.chooseFile')} onPress={choose} loading={busy} testID="restore-choose" />}>
      <SectionTitle>{t('restore.title')}</SectionTitle>
      <Card tone="info" title={t('restore.chooseTitle')} body={t('restore.chooseBody')} />
      <ListRow title={t('restore.chooseRow')} subtitle={t('restore.chooseRowBody')} onPress={choose} testID="restore-row" />
      <Card tone="success" title={t('restore.protectedTitle')} body={t('restore.protectedBody')} />
      {problem ? <StateCard tone="danger" title={t('restore.problemTitle')} body={`${problem} ${t('restore.nothingChanged')}`} testID="state-restore-problem" /> : null}
    </Screen>
  );
};

// ─── 56 Restore password ─────────────────────────────────────────────────────

export const RestorePasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const inspection = getInspection();
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  if (!inspection) return <Screen title={t('screens.RestorePassword')} onBack={() => nav.goBack()} testID="screen-RestorePassword"><Helper>{t('import.errors.noSession')}</Helper></Screen>;
  const unlock = async () => {
    setBusy(true); setProblem(null);
    try {
      setStaged(await decryptBackup(inspection, pass));
      setPass('');
      nav.navigate('RestorePreview');
    } catch (e) {
      if (e instanceof RestoreError && e.code === 'wrong-passphrase') setWrong(true);
      else setProblem(e instanceof RestoreError ? t(`restore.errors.${e.code}`) : t('restore.errors.invalid-payload'));
    } finally { setBusy(false); }
  };
  return (
    <Screen
      title={t('screens.RestorePassword')}
      onBack={() => nav.goBack()}
      keyboard
      testID="screen-RestorePassword"
      footer={(
        <>
          <AppButton label={t('common.continue')} onPress={unlock} loading={busy} disabled={!pass} testID="restore-unlock" />
          <AppButton label={t('restore.another')} variant="secondary" onPress={() => { clearRestoreSession(); nav.goBack(); }} testID="restore-another" />
        </>
      )}
    >
      <SectionTitle>{t('restore.unlock')}</SectionTitle>
      <Card tone="info" title={ltr(inspection.fileName)} body={t('restore.createdEncrypted', { date: inspection.createdAt ? formatDayMonth(inspection.createdAt) : '—' })} />
      <TextField label={t('backup.password')} value={pass} onChangeText={setPass} secure testID="restore-pass" onSubmitEditing={unlock} />
      {busy ? <Helper>{t('restore.checking')}</Helper> : null}
      {problem ? <StateCard tone="danger" title={t('restore.problemTitle')} body={`${problem} ${t('restore.nothingChanged')}`} testID="state-restore-problem" /> : null}
      <StateDialog
        visible={wrong}
        tone="danger"
        title={t('states.wrongPassword.title')}
        body={t('states.wrongPassword.body')}
        onDismiss={() => setWrong(false)}
        testID="state-wrong-password"
        actions={[
          { label: t('states.wrongPassword.tryAgain'), onPress: () => { setWrong(false); setPass(''); }, testID: 'wrong-try-again' },
          { label: t('states.wrongPassword.chooseFile'), variant: 'danger', onPress: () => { setWrong(false); clearRestoreSession(); nav.goBack(); }, testID: 'wrong-choose-file' },
        ]}
      />
    </Screen>
  );
};

// ─── 57 Restore preview ──────────────────────────────────────────────────────

export const RestorePreviewScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const inspection = getInspection();
  const staged = getStaged();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  if (!inspection || !staged) return <Screen title={t('screens.RestorePreview')} onBack={() => nav.goBack()} testID="screen-RestorePreview"><Helper>{t('import.errors.noSession')}</Helper></Screen>;
  const c = staged.entityCounts;
  const restore = async () => {
    setConfirm(false); setBusy(true); setProblem(null);
    try {
      await flushOpenSession();
      const counts = await applyRestore(staged);
      clearRestoreSession();
      resetStoreForTests();
      await loadStore();
      // The restored number / date formats apply straight away (not only after a restart).
      setNumberFormatOverride(getState().settings.numberFormat);
      setDateFormat(getState().settings.dateFormat);
      nav.popToTop();
      nav.navigate('RestoreComplete', { products: counts.products, counts: counts.completedCounts });
    } catch (e) {
      setProblem(e instanceof RestoreError ? t(`restore.errors.${e.code}`) : t('restore.errors.rolled-back'));
      void logError('restore', e);
    } finally { setBusy(false); }
  };
  return (
    <Screen
      title={t('screens.RestorePreview')}
      onBack={() => nav.goBack()}
      testID="screen-RestorePreview"
      footer={(
        <>
          <AppButton label={t('restore.restore')} onPress={() => setConfirm(true)} loading={busy} testID="restore-confirm-open" />
          <AppButton label={t('common.cancel')} variant="secondary" onPress={() => { clearRestoreSession(); nav.popToTop(); }} testID="restore-cancel" />
        </>
      )}
    >
      <SectionTitle>{t('restore.ready')}</SectionTitle>
      <Card tone="info" title={ltr(inspection.fileName)} body={t('restore.createdVerified', { date: staged.createdAt ? formatDate(staged.createdAt) : '—' })} />
      <ListRow title={t('restore.products')} subtitle={[t('plural.products', { count: c.products, n: formatInt(c.products) }), t('restore.barcodesIncluded')].join(dot())} chevron={false} />
      <ListRow title={t('restore.history')} subtitle={t('restore.historyLine', { count: c.completedCounts, n: formatInt(c.completedCounts) })} chevron={false} />
      <ListRow title={t('restore.suppliersLocations')} subtitle={[t('plural.suppliers', { count: c.suppliers, n: formatInt(c.suppliers) }), t('plural.locations', { count: c.locations, n: formatInt(c.locations) })].join(dot())} chevron={false} />
      <ListRow title={t('restore.settings')} subtitle={c.settings ? t('restore.settingsLine') : t('restore.settingsNone')} chevron={false} />
      <Card tone="danger" title={t('restore.replacesTitle')} body={t('restore.replacesBody')} />
      {problem ? <StateCard tone="danger" title={t('restore.problemTitle')} body={problem} testID="state-restore-problem" /> : null}
      <StateDialog
        visible={confirm}
        tone="info"
        title={t('states.restoreConfirm.title')}
        body={t('states.restoreConfirm.body', { summary: [t('plural.products', { count: c.products, n: formatInt(c.products) }), t('plural.completedCounts', { count: c.completedCounts, n: formatInt(c.completedCounts) })].join(t('common.listSeparator')) })}
        onDismiss={() => setConfirm(false)}
        testID="state-restore-confirm"
        actions={[
          { label: t('common.cancel'), onPress: () => setConfirm(false), testID: 'restore-dialog-cancel' },
          { label: t('states.restoreConfirm.restore'), onPress: () => { void restore(); }, testID: 'restore-dialog-restore' },
        ]}
      />
    </Screen>
  );
};

// ─── 58 Restore complete ─────────────────────────────────────────────────────

export const RestoreCompleteScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { products, counts } = useParams<'RestoreComplete'>();
  const done = () => { nav.popToTop(); goTab(nav, 'Home'); };
  return (
    <Screen title={t('screens.RestoreComplete')} onBack={done} testID="screen-RestoreComplete" footer={<AppButton label={t('common.done')} onPress={done} testID="restore-done" />}>
      <SectionTitle>{t('screens.RestoreComplete')}</SectionTitle>
      <Card tone="success" strongBorder title={t('restore.readyTitle')} body={[t('plural.products', { count: products, n: formatInt(products) }), t('plural.completedCounts', { count: counts, n: formatInt(counts) }), t('restore.settingsRestored')].join(dot())} />
      <Helper size="body">{t('restore.completeBody')}</Helper>
    </Screen>
  );
};
