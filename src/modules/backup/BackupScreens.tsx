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
import { flushOpenSession, loadStore, resetStoreForTests } from '../../state/store';
import { APP_VERSION } from '../../appMeta';
import { formatDate, formatDayMonth, formatInt, ltr } from '../../utils/format';
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
  return (
    <Screen title={t('screens.DataBackup')} onBack={() => nav.goBack()} testID="screen-DataBackup">
      <SectionTitle>{t('data.yourData')}</SectionTitle>
      <ListRow title={t('data.createBackup')} subtitle={t('data.createBackupBody')} onPress={() => nav.navigate('CreateBackup')} testID="data-create-backup" />
      <ListRow title={t('data.restoreBackup')} subtitle={t('data.restoreBackupBody')} onPress={() => nav.navigate('RestoreFile')} testID="data-restore" />
      <ListRow title={t('data.importProducts')} subtitle={t('data.importProductsBody')} onPress={() => nav.navigate('ImportCentre')} testID="data-import" />
      <ListRow title={t('data.exportProducts')} subtitle={t('data.exportProductsBody')} onPress={() => nav.navigate('FamilyExport')} testID="data-export-products" />
      <ListRow title={t('data.exportReports')} subtitle={t('data.exportReportsBody')} onPress={() => nav.navigate('ExportCentre')} testID="data-export-reports" />
      <Card tone="success" title={t('data.offlineTitle')} body={t('data.offlineBody')} />
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
      <Card tone="success" strongBorder title={ltr(fileName)} body={t('backup.summary', { products: formatInt(products), counts: formatInt(counts) })} testID="backup-file-card" />
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
      <ListRow title={t('restore.products')} subtitle={t('restore.productsLine', { n: formatInt(c.products) })} chevron={false} />
      <ListRow title={t('restore.history')} subtitle={t('restore.historyLine', { count: c.completedCounts, n: formatInt(c.completedCounts) })} chevron={false} />
      <ListRow title={t('restore.suppliersLocations')} subtitle={t('restore.suppliersLocationsLine', { s: formatInt(c.suppliers), l: formatInt(c.locations) })} chevron={false} />
      <ListRow title={t('restore.settings')} subtitle={c.settings ? t('restore.settingsLine') : t('restore.settingsNone')} chevron={false} />
      <Card tone="danger" title={t('restore.replacesTitle')} body={t('restore.replacesBody')} />
      {problem ? <StateCard tone="danger" title={t('restore.problemTitle')} body={problem} testID="state-restore-problem" /> : null}
      <StateDialog
        visible={confirm}
        tone="info"
        title={t('states.restoreConfirm.title')}
        body={t('states.restoreConfirm.body', { products: formatInt(c.products), counts: formatInt(c.completedCounts) })}
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
      <Card tone="success" strongBorder title={t('restore.readyTitle')} body={t('restore.completeLine', { products: formatInt(products), counts: formatInt(counts) })} />
      <Helper size="body">{t('restore.completeBody')}</Helper>
    </Screen>
  );
};
