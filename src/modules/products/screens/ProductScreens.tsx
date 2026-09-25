/**
 * 22 Products (23:507) · 23 Product detail (23:578) · 24 Add product (23:631) · 25 Edit product (23:668) ·
 * 26 Barcodes (23:705) · 27 Add barcode (23:740)
 */
import React, { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../../components/AppButton';
import { AppAlert } from '../../../components/AppAlert';
import { Card, Chip, ChipRow, GAP, GUTTER, Helper, ListRow, Screen, SectionLabel, SectionTitle, StateCard } from '../../../ui/kit';
import { ActionField, SearchField, SelectField, TextField } from '../../../ui/fields';
import { OverflowMenu, StateDialog } from '../../../ui/overlays';
import { BarcodeCapture } from '../../../ui/BarcodeCapture';
import { useAppState } from '../../../state/store';
import { useReorder, useActiveNamed } from '../../../state/selectors';
import {
  addBarcodeToProduct, archiveProduct, createProduct, deleteProduct, removeBarcodeFromProduct, unarchiveProduct, updateProduct,
} from '../../../state/actions';
import { searchProducts } from '../../../domain/catalogIndex';
import { makeBarcode, type ProductError } from '../../../domain/productRules';
import { packUnitsOf, parseQuantityText } from '../../../domain/quantity';
import { newId } from '../../../domain/ids';
import { BARCODE_ROLES, COUNT_UNITS, type BarcodeRole, type CountUnit, type Product } from '../../../domain/types';
import { dot, formatInt, formatMoney, formatQty, ltr, relativeDay, unitLabel } from '../../../utils/format';
import { parseStrictAmount } from '../../../utils/safeParse';
import { useNav, useParams } from '../../../navigation/nav';
import { useProGate } from '../../billing/useProGate';

function errorText(t: (k: string, o?: Record<string, unknown>) => string, e: ProductError, nameOf: (id: string) => string): string {
  if (e.code === 'duplicateBarcode') return t('products.errors.duplicateBarcode', { code: e.barcode, name: nameOf(e.otherProductId) });
  if (e.code === 'duplicateSku') return t('products.errors.duplicateSku', { name: nameOf(e.otherProductId) });
  if (e.code === 'duplicateBarcodeInProduct' || e.code === 'badBarcode' || e.code === 'badUnitsPerBarcode') return t(`products.errors.${e.code}`, { code: e.barcode });
  return t(`products.errors.${e.code}`);
}

// ─── 22 Products ─────────────────────────────────────────────────────────────

export const ProductsScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const params = useParams<'Products'>();
  const index = useAppState(s => s.index);
  const lookups = useAppState(s => s.lookups);
  const snapshots = useAppState(s => s.snapshots);
  const categories = useActiveNamed('categories').length;
  const suppliers = useActiveNamed('suppliers').length;
  const { lines } = useReorder();
  const [query, setQuery] = useState(params?.query ?? '');
  const [filter, setFilter] = useState(params?.filter);
  const [archived, setArchived] = useState(false);
  const [menu, setMenu] = useState(false);
  const gate = useProGate();
  React.useEffect(() => { setFilter(params?.filter); }, [params?.filter]);

  const statusOf = useMemo(() => new Map(lines.map(l => [l.product.id, l.status])), [lines]);
  const results = useMemo(() => {
    const found = searchProducts(index, query, { includeArchived: archived });
    const list = archived ? found.filter(p => p.status === 'archived') : found;
    if (!filter) return list;
    const want = filter === 'notCounted' ? 'not-counted' : filter;
    return list.filter(p => statusOf.get(p.id) === want);
  }, [index, query, archived, filter, statusOf]);
  const total = index.activeIds.length;

  const add = () => { if (gate.allow('products')) nav.navigate('AddProduct', query.trim() && results.length === 0 ? { name: query.trim() } : undefined); };

  return (
    <Screen
      title={t('screens.Products')}
      tabRoot
      noScroll
      testID="screen-Products"
      action={{ icon: 'ellipsis-horizontal', label: t('common.moreOptions'), onPress: () => setMenu(true) }}
      footer={<AppButton label={t('products.add')} onPress={add} testID="products-add" />}
    >
      <FlatList
        data={results}
        keyExtractor={p => p.id}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={14}
        windowSize={9}
        maxToRenderPerBatch={20}
        removeClippedSubviews
        contentContainerStyle={{ gap: GAP, paddingBottom: GUTTER }}
        ListHeaderComponent={(
          <View style={{ gap: GAP }}>
            <SearchField value={query} onChangeText={setQuery} placeholder={t('products.searchPlaceholder')} testID="products-search" />
            {total > 0 ? (
              <Card tone="info" title={t('products.count', { count: total, n: formatInt(total) })} body={[t('plural.categories', { count: categories, n: formatInt(categories) }), t('plural.suppliers', { count: suppliers, n: formatInt(suppliers) })].join(dot())} onPress={() => nav.navigate('Categories')} testID="products-summary" />
            ) : null}
            {filter || archived ? (
              <ChipRow>
                {filter ? <Chip label={t(`products.filter.${filter}`)} active onPress={() => setFilter(undefined)} testID="products-filter-chip" /> : null}
                {archived ? <Chip label={t('products.archivedChip')} active onPress={() => setArchived(false)} /> : null}
              </ChipRow>
            ) : null}
          </View>
        )}
        ListEmptyComponent={total === 0 && !archived ? (
          <StateCard
            tone="info"
            title={t('states.productsEmpty.title')}
            body={t('states.productsEmpty.body')}
            testID="state-products-empty"
            actions={[
              { label: t('states.productsEmpty.scan'), onPress: add },
              { label: t('states.productsEmpty.import'), onPress: () => nav.navigate('ImportCentre') },
            ]}
          />
        ) : (
          <StateCard tone="info" title={t('states.searchEmpty.title')} body={t('states.searchEmpty.body')} testID="state-search-empty" actions={[{ label: t('products.add'), onPress: add }]} />
        )}
        renderItem={({ item }) => {
          const cat = item.categoryId ? lookups.categories.get(item.categoryId)?.name : undefined;
          const snap = snapshots[item.id];
          const bits = [
            cat,
            item.sellingPrice !== undefined ? formatMoney(item.sellingPrice) : undefined,
            snap ? t('products.counted', { qty: formatQty(snap.quantityBase, item.countUnit) }) : t('status.notCounted'),
          ].filter(Boolean);
          return <ListRow title={item.name} subtitle={bits.join(dot())} onPress={() => nav.navigate('ProductDetail', { productId: item.id })} testID={`product-${item.id}`} />;
        }}
      />
      <OverflowMenu
        visible={menu}
        onClose={() => setMenu(false)}
        items={[
          { label: t('screens.Categories'), icon: 'pricetags-outline', onPress: () => nav.navigate('Categories') },
          { label: t('screens.Suppliers'), icon: 'car-outline', onPress: () => nav.navigate('Suppliers') },
          { label: t('screens.Locations'), icon: 'location-outline', onPress: () => nav.navigate('Locations') },
          { label: t('screens.ImportCentre'), icon: 'download-outline', onPress: () => nav.navigate('ImportCentre') },
          { label: t('screens.FamilyExport'), icon: 'share-outline', onPress: () => nav.navigate('FamilyExport') },
          { label: archived ? t('products.showActive') : t('products.showArchived'), icon: 'archive-outline', onPress: () => setArchived(a => !a) },
        ]}
      />
      {gate.sheet}
    </Screen>
  );
};

// ─── 23 Product detail ───────────────────────────────────────────────────────

export const ProductDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { productId } = useParams<'ProductDetail'>();
  const product = useAppState(s => s.index.byId.get(productId));
  const lookups = useAppState(s => s.lookups);
  const snap = useAppState(s => s.snapshots[productId]);
  const session = useAppState(s => (snap ? s.sessions.find(x => x.id === snap.countSessionId) : undefined));
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!product) {
    return <Screen title={t('screens.ProductDetail')} onBack={() => nav.goBack()} testID="screen-ProductDetail"><StateCard tone="info" title={t('errors.notFoundTitle')} body={t('products.deleted')} /></Screen>;
  }
  const codes = product.barcodes.map(b => `${t(`barcodes.role.${b.role}`)} ${ltr(b.code)}`).join(dot());
  const caseUnits = packUnitsOf(product, 'case');
  const packUnits = packUnitsOf(product, 'pack');
  const reorderLine = product.reorderLevel !== undefined || product.targetStock !== undefined
    ? [product.reorderLevel !== undefined ? t('products.lowAt', { n: formatQty(product.reorderLevel, product.countUnit) }) : null, product.targetStock !== undefined ? t('products.target', { n: formatQty(product.targetStock, product.countUnit) }) : null].filter(Boolean).join(dot())
    : t('products.noReorder');
  const archived = product.status === 'archived';

  const restore = async () => {
    const r = await unarchiveProduct(product.id);
    if (!r.ok) AppAlert.error(t('products.restoreBlocked'));
  };

  return (
    <Screen
      title={t('screens.ProductDetail')}
      onBack={() => nav.goBack()}
      testID="screen-ProductDetail"
      action={{ icon: 'ellipsis-horizontal', label: t('common.moreOptions'), onPress: () => setMenu(true), testID: 'product-menu' }}
      footer={archived ? <AppButton label={t('products.restore')} onPress={restore} testID="product-restore" /> : <AppButton label={t('products.edit')} onPress={() => nav.navigate('EditProduct', { productId })} testID="product-edit" />}
    >
      <SectionTitle>{product.name}</SectionTitle>
      {archived ? <Card tone="danger" title={t('products.archivedTitle')} body={t('products.archivedBody')} /> : null}
      <Card
        tone={snap ? 'success' : 'info'}
        title={snap ? t('products.countedTitle', { qty: formatQty(snap.quantityBase, product.countUnit), unit: product.countUnit === 'each' ? '' : unitLabel(product.countUnit) }).replace(/\s{2,}/g, ' ').trim() : t('status.notCounted')}
        body={snap ? t('products.lastCounted', { day: relativeDay(snap.countedAt), scope: session?.scopeLabel ?? t('scope.everything') }) : t('products.neverCounted')}
        testID="product-count-card"
      />
      <ListRow title={t('products.barcodes')} subtitle={codes || t('products.noBarcode')} onPress={() => nav.navigate('Barcodes', { productId })} testID="detail-barcodes" />
      <ListRow title={t('fields.category')} subtitle={(product.categoryId && lookups.categories.get(product.categoryId)?.name) || t('products.uncategorised')} onPress={() => nav.navigate('EditProduct', { productId })} />
      <ListRow title={t('fields.supplier')} subtitle={(product.supplierId && lookups.suppliers.get(product.supplierId)?.name) || t('reorder.noSupplier')} onPress={() => nav.navigate('EditProduct', { productId })} />
      <ListRow title={t('fields.location')} subtitle={(product.locationId && lookups.locations.get(product.locationId)?.name) || t('products.noLocation')} onPress={() => nav.navigate('EditProduct', { productId })} />
      <ListRow title={t('products.reorder')} subtitle={reorderLine} onPress={() => nav.navigate('EditReorderTarget', { productId })} testID="detail-reorder" />
      <ListRow title={t('products.packCase')} subtitle={caseUnits || packUnits ? [caseUnits ? t('products.perCase', { n: formatInt(caseUnits) }) : null, packUnits ? t('products.perPack', { n: formatInt(packUnits) }) : null].filter(Boolean).join(dot()) : t('products.noPackCase')} onPress={() => nav.navigate('Barcodes', { productId })} />
      {product.costPrice !== undefined || product.sellingPrice !== undefined ? (
        <ListRow title={t('products.prices')} subtitle={[product.costPrice !== undefined ? t('products.costLine', { v: formatMoney(product.costPrice) }) : null, product.sellingPrice !== undefined ? t('products.priceLine', { v: formatMoney(product.sellingPrice) }) : null].filter(Boolean).join(dot())} onPress={() => nav.navigate('EditProduct', { productId })} />
      ) : null}
      <OverflowMenu
        visible={menu}
        onClose={() => setMenu(false)}
        items={[
          ...(archived ? [] : [{ label: t('products.archive'), icon: 'archive-outline' as const, onPress: () => { void archiveProduct(productId); }, testID: 'product-archive' }]),
          { label: t('products.delete'), icon: 'trash-outline', onPress: () => setConfirmDelete(true), testID: 'product-delete' },
        ]}
      />
      <StateDialog
        visible={confirmDelete}
        tone="danger"
        title={t('states.deleteProduct.title')}
        body={t('states.deleteProduct.body')}
        onDismiss={() => setConfirmDelete(false)}
        testID="state-delete-product"
        actions={[
          { label: t('common.cancel'), onPress: () => setConfirmDelete(false), testID: 'delete-cancel' },
          { label: t('common.delete'), variant: 'danger', onPress: () => { setConfirmDelete(false); void deleteProduct(productId).then(() => nav.goBack()); }, testID: 'delete-confirm' },
        ]}
      />
    </Screen>
  );
};

// ─── 24 Add product / 25 Edit product ────────────────────────────────────────

function numText(v: number | undefined): string { return v === undefined ? '' : String(v); }

const ProductForm: React.FC<{ mode: 'add' | 'edit' }> = ({ mode }) => {
  const { t } = useTranslation();
  const nav = useNav();
  const addParams = useParams<'AddProduct'>();
  const editParams = useParams<'EditProduct'>();
  const existing = useAppState(s => (mode === 'edit' ? s.index.byId.get(editParams.productId) : undefined));
  const categories = useActiveNamed('categories');
  const suppliers = useActiveNamed('suppliers');
  const locations = useActiveNamed('locations');
  const settings = useAppState(s => s.settings);
  const products = useAppState(s => s.index);
  const [name, setName] = useState(existing?.name ?? addParams?.name ?? '');
  const [code, setCode] = useState(addParams?.barcode ?? '');
  const [symbology, setSymbology] = useState(addParams?.symbology);
  const [sku, setSku] = useState(existing?.sku ?? '');
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '');
  const [supplierId, setSupplierId] = useState(existing?.supplierId ?? '');
  const [locationId, setLocationId] = useState(existing?.locationId ?? (mode === 'add' ? locations[0]?.id ?? '' : ''));
  const [unit, setUnit] = useState<CountUnit>(existing?.countUnit ?? settings.defaultCountUnit);
  const [cost, setCost] = useState(numText(existing?.costPrice));
  const [price, setPrice] = useState(numText(existing?.sellingPrice));
  const [level, setLevel] = useState(numText(existing?.reorderLevel));
  const [target, setTarget] = useState(numText(existing?.targetStock));
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [capture, setCapture] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const gate = useProGate();
  if (mode === 'edit' && !existing) return <Screen title={t('screens.EditProduct')} onBack={() => nav.goBack()} testID="screen-EditProduct" />;

  const none = (label: string) => ({ value: '__none', label });
  const opt = (list: { id: string; name: string }[]) => list.map(r => ({ value: r.id, label: r.name }));
  const nameOf = (id: string) => products.byId.get(id)?.name ?? '';

  const parseOptional = (s: string, key: string, fe: Record<string, string>, quantity = false): number | undefined => {
    if (!s.trim()) return undefined;
    const v = quantity ? parseQuantityText(s) : parseStrictAmount(s);
    if (v === null) { fe[key] = t('products.errors.badNumber'); return undefined; }
    return v;
  };

  const save = async () => {
    const fe: Record<string, string> = {};
    if (!name.trim()) fe.name = t('products.errors.nameRequired');
    const costPrice = parseOptional(cost, 'cost', fe);
    const sellingPrice = parseOptional(price, 'price', fe);
    const reorderLevel = parseOptional(level, 'level', fe, true);
    const targetStock = parseOptional(target, 'target', fe, true);
    setFieldErr(fe);
    if (Object.keys(fe).length) return;
    const common = {
      name,
      sku: sku.trim() || undefined,
      categoryId: categoryId || undefined,
      supplierId: supplierId || undefined,
      locationId: locationId || undefined,
      countUnit: unit,
      costPrice, sellingPrice, reorderLevel, targetStock,
      notes: notes.trim() || undefined,
    };
    setBusy(true);
    try {
      if (mode === 'add') {
        if (!gate.allow('products')) return;
        const barcodes = code.trim() ? [makeBarcode(newId('b'), code, 'single', 1, symbology)] : [];
        const r = await createProduct({ ...common, barcodes });
        if (!r.ok) { setErrors(r.errors.map(e => errorText(t, e, nameOf))); return; }
        nav.replace('ProductDetail', { productId: r.product.id });
      } else if (existing) {
        const next: Product = { ...existing, ...common };
        (['sku', 'categoryId', 'supplierId', 'locationId', 'costPrice', 'sellingPrice', 'reorderLevel', 'targetStock', 'notes'] as const).forEach(k => { if (next[k] === undefined) delete next[k]; });
        const r = await updateProduct(next);
        if (!r.ok) { setErrors(r.errors.map(e => errorText(t, e, nameOf))); return; }
        nav.goBack();
      }
    } catch {
      AppAlert.error(t('errors.saveFailed'));
    } finally { setBusy(false); }
  };

  const measured = unit !== 'each';
  const route = mode === 'add' ? 'AddProduct' : 'EditProduct';
  const nameField = <TextField key="name" label={t('fields.productName')} value={name} onChangeText={setName} error={fieldErr.name} testID="form-name" maxLength={120} />;
  const barcodeField = <ActionField key="code" label={t('fields.barcode')} value={code} placeholder={t('products.scanOrType')} onPress={() => setCapture(true)} testID="form-barcode" ltr />;
  const skuField = <TextField key="sku" label={t('fields.sku')} value={sku} onChangeText={setSku} ltr testID="form-sku" maxLength={64} placeholder={t('common.optional')} />;
  const catField = <SelectField key="cat" label={t('fields.category')} value={categoryId || '__none'} onChange={v => setCategoryId(v === '__none' ? '' : v)} options={[none(t('products.chooseCategory')), ...opt(categories)]} testID="form-category" />;
  const supField = <SelectField key="sup" label={t('fields.supplier')} value={supplierId || '__none'} onChange={v => setSupplierId(v === '__none' ? '' : v)} options={[none(t('common.optional')), ...opt(suppliers)]} testID="form-supplier" />;
  const locField = <SelectField key="loc" label={t('fields.location')} value={locationId || '__none'} onChange={v => setLocationId(v === '__none' ? '' : v)} options={[none(t('products.noLocation')), ...opt(locations)]} testID="form-location" />;
  const unitField = <SelectField key="unit" label={t('fields.countUnit')} value={unit} onChange={setUnit} options={COUNT_UNITS.map(u => ({ value: u, label: unitLabel(u) }))} testID="form-unit" />;
  const levelField = <TextField key="level" label={t('fields.reorderLevel')} value={level} onChangeText={setLevel} keyboardType={measured ? 'decimal-pad' : 'number-pad'} error={fieldErr.level} testID="form-level" placeholder={t('common.optional')} />;
  const targetField = <TextField key="target" label={t('fields.targetStock')} value={target} onChangeText={setTarget} keyboardType={measured ? 'decimal-pad' : 'number-pad'} error={fieldErr.target} testID="form-target" placeholder={t('common.optional')} />;
  const costField = <TextField key="cost" label={t('fields.costPrice')} value={cost} onChangeText={setCost} keyboardType="decimal-pad" error={fieldErr.cost} testID="form-cost" placeholder={t('common.optional')} />;
  const priceField = <TextField key="price" label={t('fields.sellingPrice')} value={price} onChangeText={setPrice} keyboardType="decimal-pad" error={fieldErr.price} testID="form-price" placeholder={t('common.optional')} />;
  const notesField = <TextField key="notes" label={t('fields.notes')} value={notes} onChangeText={setNotes} multiline testID="form-notes" maxLength={500} placeholder={t('common.optional')} />;

  // Figma order first (the visible frame), the remaining record fields below it.
  const primary = mode === 'add' ? [nameField, barcodeField, catField, supField, locField, unitField] : [nameField, skuField, catField, supField, levelField, targetField];
  const more = mode === 'add' ? [skuField, costField, priceField, levelField, targetField] : [locField, unitField, costField, priceField, notesField];

  return (
    <Screen title={t(`screens.${route}`)} onBack={() => nav.goBack()} keyboard testID={`screen-${route}`} footer={<AppButton label={mode === 'add' ? t('products.save') : t('products.saveChanges')} onPress={save} loading={busy} testID="form-save" />}>
      {errors.length ? <Card tone="danger" title={t('products.errors.title')} body={errors.join('\n')} testID="form-errors" /> : null}
      {primary}
      <SectionLabel>{t('products.moreDetails')}</SectionLabel>
      {more}
      <BarcodeCapture visible={capture} onClose={() => setCapture(false)} onCapture={(c, sym) => { setCode(c); setSymbology(sym); setCapture(false); }} />
      {gate.sheet}
    </Screen>
  );
};

export const AddProductScreen: React.FC = () => <ProductForm mode="add" />;
export const EditProductScreen: React.FC = () => <ProductForm mode="edit" />;

// ─── 26 Barcodes ─────────────────────────────────────────────────────────────

export const BarcodesScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { productId } = useParams<'Barcodes'>();
  const product = useAppState(s => s.index.byId.get(productId));
  const [remove, setRemove] = useState<string | null>(null);
  if (!product) return <Screen title={t('screens.Barcodes')} onBack={() => nav.goBack()} testID="screen-Barcodes" />;
  const roleLine = (role: BarcodeRole, units: number) => role === 'single' ? t('barcodes.singleLine') : t(`barcodes.${role}Line`, { n: formatInt(units) });
  return (
    <Screen title={t('screens.Barcodes')} onBack={() => nav.goBack()} testID="screen-Barcodes" footer={product.status === 'active' ? <AppButton label={t('barcodes.add')} onPress={() => nav.navigate('AddBarcode', { productId })} testID="barcodes-add" /> : undefined}>
      <SectionTitle>{product.name}</SectionTitle>
      {product.barcodes.length === 0 ? <Helper>{t('barcodes.none')}</Helper> : null}
      {product.barcodes.map(b => (
        <ListRow key={b.id} title={ltr(b.code)} subtitle={roleLine(b.role, b.unitsPerBarcode)} onPress={() => setRemove(b.id)} testID={`barcode-${b.id}`} />
      ))}
      <Card tone="info" title={t('barcodes.rolesTitle')} body={t('barcodes.rolesBody')} />
      <StateDialog
        visible={!!remove}
        tone="danger"
        title={t('barcodes.removeTitle')}
        body={t('barcodes.removeBody')}
        onDismiss={() => setRemove(null)}
        actions={[
          { label: t('common.cancel'), onPress: () => setRemove(null) },
          { label: t('barcodes.remove'), variant: 'danger', onPress: () => { const id = remove; setRemove(null); if (id) void removeBarcodeFromProduct(productId, id); }, testID: 'barcode-remove-confirm' },
        ]}
      />
    </Screen>
  );
};

// ─── 27 Add barcode ──────────────────────────────────────────────────────────

export const AddBarcodeScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { productId } = useParams<'AddBarcode'>();
  const index = useAppState(s => s.index);
  const [code, setCode] = useState('');
  const [symbology, setSymbology] = useState<string | undefined>();
  const [role, setRole] = useState<BarcodeRole>('single');
  const [units, setUnits] = useState('1');
  const [capture, setCapture] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const n = role === 'single' ? 1 : parseQuantityText(units);
    if (!code.trim()) { setError(t('barcodes.errors.codeRequired')); return; }
    if (role !== 'single' && !(n !== null && Number.isInteger(n) && n > 0)) { setError(t('products.errors.badUnitsPerBarcode', { code })); return; }
    const r = await addBarcodeToProduct(productId, makeBarcode(newId('b'), code, role, n ?? 1, symbology));
    if (!r.ok) { setError(r.errors.map(e => errorText(t, e, id => index.byId.get(id)?.name ?? '')).join('\n')); return; }
    nav.goBack();
  };

  return (
    <Screen title={t('screens.AddBarcode')} onBack={() => nav.goBack()} keyboard testID="screen-AddBarcode" footer={<AppButton label={t('barcodes.save')} onPress={save} testID="barcode-save" />}>
      <SectionTitle>{t('barcodes.newTitle')}</SectionTitle>
      <ActionField label={t('fields.barcode')} value={code} placeholder={t('products.scanOrType')} onPress={() => setCapture(true)} testID="barcode-code" ltr />
      <SelectField label={t('barcodes.roleLabel')} value={role} onChange={v => { setRole(v); if (v === 'single') setUnits('1'); }} options={BARCODE_ROLES.map(r => ({ value: r, label: t(`barcodes.role.${r}`) }))} testID="barcode-role" />
      {/* Figma always shows the units field; a single-unit barcode is fixed at 1. */}
      <TextField label={t('barcodes.unitsLabel')} value={role === 'single' ? '1' : units} onChangeText={setUnits} keyboardType="number-pad" editable={role !== 'single'} testID="barcode-units" />
      {error ? <Card tone="danger" title={t('products.errors.title')} body={error} testID="barcode-error" /> : null}
      <Card tone="info" title={t('barcodes.duplicateTitle')} body={t('barcodes.duplicateBody')} />
      <BarcodeCapture visible={capture} onClose={() => setCapture(false)} onCapture={(c, sym) => { setCode(c); setSymbology(sym); setCapture(false); setError(null); }} />
    </Screen>
  );
};
