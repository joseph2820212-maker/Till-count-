/**
 * 28 Categories (23:769) · 29 Category form (24:718) · 30 Suppliers (24:740) · 31 Supplier form (24:778) ·
 * 32 Locations (24:804) · 33 Location form (24:842)
 */
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../../components/AppButton';
import { AppAlert } from '../../../components/AppAlert';
import { Card, Helper, ListRow, Screen, SectionLabel, SectionTitle } from '../../../ui/kit';
import { TextField } from '../../../ui/fields';
import { StateDialog } from '../../../ui/overlays';
import { useAppState } from '../../../state/store';
import { useMembershipCounts } from '../../../state/selectors';
import { archiveNamed, saveNamed, unarchiveNamed } from '../../../state/actions';
import { formatInt } from '../../../utils/format';
import { useNav, useParams } from '../../../navigation/nav';

type Kind = 'categories' | 'suppliers' | 'locations';
const LIST_ROUTE = { categories: 'Categories', suppliers: 'Suppliers', locations: 'Locations' } as const;
const FORM_ROUTE = { categories: 'CategoryForm', suppliers: 'SupplierForm', locations: 'LocationForm' } as const;
const KEY = { categories: 'category', suppliers: 'supplier', locations: 'location' } as const;

const NamedList: React.FC<{ kind: Kind }> = ({ kind }) => {
  const { t } = useTranslation();
  const nav = useNav();
  const records = useAppState(s => s[kind]);
  const counts = useMembershipCounts();
  const map = kind === 'categories' ? counts.category : kind === 'suppliers' ? counts.supplier : counts.location;
  const active = records.filter(r => r.status === 'active').sort((a, b) => a.name.localeCompare(b.name));
  const archived = records.filter(r => r.status === 'archived').sort((a, b) => a.name.localeCompare(b.name));
  const k = KEY[kind];
  return (
    <Screen title={t(`screens.${LIST_ROUTE[kind]}`)} onBack={() => nav.goBack()} testID={`screen-${LIST_ROUTE[kind]}`} footer={<AppButton label={t(`named.${k}.add`)} onPress={() => nav.navigate(FORM_ROUTE[kind])} testID={`${k}-add`} />}>
      <SectionTitle>{t(`screens.${LIST_ROUTE[kind]}`)}</SectionTitle>
      {active.length === 0 ? <Helper>{t(`named.${k}.empty`)}</Helper> : null}
      {active.map(r => (
        <ListRow key={r.id} title={r.name} subtitle={t('count.productsCount', { count: map.get(r.id) ?? 0, n: formatInt(map.get(r.id) ?? 0) })} onPress={() => nav.navigate(FORM_ROUTE[kind], { id: r.id })} testID={`${k}-row-${r.id}`} />
      ))}
      {archived.length ? <SectionLabel>{t('named.archived')}</SectionLabel> : null}
      {archived.map(r => (
        <ListRow key={r.id} title={r.name} subtitle={t('named.archivedRow')} onPress={() => nav.navigate(FORM_ROUTE[kind], { id: r.id })} testID={`${k}-row-${r.id}`} />
      ))}
    </Screen>
  );
};

export const CategoriesScreen: React.FC = () => <NamedList kind="categories" />;
export const SuppliersScreen: React.FC = () => <NamedList kind="suppliers" />;
export const LocationsScreen: React.FC = () => <NamedList kind="locations" />;

const NamedForm: React.FC<{ kind: Kind }> = ({ kind }) => {
  const { t } = useTranslation();
  const nav = useNav();
  const params = useParams<'CategoryForm'>();
  const record = useAppState(s => (params?.id ? s[kind].find(r => r.id === params.id) : undefined));
  const counts = useMembershipCounts();
  const map = kind === 'categories' ? counts.category : kind === 'suppliers' ? counts.supplier : counts.location;
  const n = record ? map.get(record.id) ?? 0 : 0;
  const [name, setName] = useState(record?.name ?? '');
  const [reference, setReference] = useState((record as { reference?: string } | undefined)?.reference ?? '');
  const [error, setError] = useState<string | undefined>();
  const [confirm, setConfirm] = useState(false);
  const k = KEY[kind];
  const archived = record?.status === 'archived';

  const saving = useRef(false);
  const save = async () => {
    if (saving.current) return;
    saving.current = true;
    try {
      const r = await saveNamed(kind, { id: record?.id, name, reference });
      if (!r.ok) { setError(t(`named.errors.${r.error}`)); return; }
      nav.goBack();
    } finally { saving.current = false; }
  };
  const restore = async () => {
    if (!record) return;
    const r = await unarchiveNamed(kind, record.id);
    if (!r.ok) AppAlert.error(t(`named.errors.${r.error}`));
  };

  return (
    <Screen
      title={t(`screens.${FORM_ROUTE[kind]}`)}
      onBack={() => nav.goBack()}
      keyboard
      testID={`screen-${FORM_ROUTE[kind]}`}
      footer={(
        <>
          <AppButton label={t(`named.${k}.save`)} onPress={save} testID={`${k}-save`} />
          {record && !archived ? <AppButton label={t(`named.${k}.archive`)} variant="secondary" onPress={() => setConfirm(true)} testID={`${k}-archive`} /> : null}
          {archived ? <AppButton label={t('named.restore')} variant="secondary" onPress={restore} testID={`${k}-restore`} /> : null}
        </>
      )}
    >
      <TextField label={t(`named.${k}.nameLabel`)} value={name} onChangeText={v => { setName(v); setError(undefined); }} error={error} testID={`${k}-name`} maxLength={120} />
      {kind === 'suppliers' ? <TextField label={t('named.supplier.reference')} value={reference} onChangeText={setReference} placeholder={t('named.supplier.referencePlaceholder')} testID="supplier-reference" maxLength={120} /> : null}
      {record ? <Card tone="info" title={t('named.products')} body={t(`named.${k}.productsLine`, { count: n, n: formatInt(n) })} /> : null}
      {kind === 'locations' ? <Card title={t('named.location.noteTitle')} body={t('named.location.noteBody')} /> : null}
      <StateDialog
        visible={confirm}
        tone="danger"
        title={t(`named.${k}.archiveTitle`)}
        body={t('named.archiveBody', { count: n, n: formatInt(n) })}
        onDismiss={() => setConfirm(false)}
        actions={[
          { label: t('common.cancel'), onPress: () => setConfirm(false) },
          { label: t('named.archiveConfirm'), variant: 'danger', onPress: () => { setConfirm(false); if (record) void archiveNamed(kind, record.id).then(() => nav.goBack()); }, testID: `${k}-archive-confirm` },
        ]}
      />
    </Screen>
  );
};

export const CategoryFormScreen: React.FC = () => <NamedForm kind="categories" />;
export const SupplierFormScreen: React.FC = () => <NamedForm kind="suppliers" />;
export const LocationFormScreen: React.FC = () => <NamedForm kind="locations" />;
