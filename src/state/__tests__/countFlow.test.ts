import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  archiveProduct, countScan, countSetCaseLoose, countSetQuantity, createProduct, deleteProduct, discardCount, finishCount,
  OpenCountExistsError, pauseCount, resumeCount, saveNamed, startCount, unarchiveProduct, updateProduct, updateSettings,
} from '../actions';
import { flushOpenSession, getState, loadFullSession, loadStore, resetStoreForTests } from '../store';
import { makeBarcode } from '../../domain/productRules';
import { KEYS } from '../../storage/keys';

async function reopenApp() {
  await flushOpenSession();
  resetStoreForTests();
  await loadStore();
}

async function seedCatalog() {
  const drinks = await saveNamed('categories', { name: 'Drinks' });
  if (!drinks.ok) throw new Error('cat');
  const cola = await createProduct({ name: 'Cola', countUnit: 'each', categoryId: drinks.record.id, barcodes: [makeBarcode('b1', '5000112637922', 'single', 1), makeBarcode('b2', '15000112637929', 'case', 24)], costPrice: 0.5, reorderLevel: 6, targetStock: 24 });
  const milk = await createProduct({ name: 'Milk 2L', countUnit: 'each', barcodes: [makeBarcode('b3', '036000291452', 'single', 1)] });
  const cheese = await createProduct({ name: 'Cheddar', countUnit: 'kg', barcodes: [] });
  if (!cola.ok || !milk.ok || !cheese.ok) throw new Error('seed');
  return { drinks: drinks.record, cola: cola.product, milk: milk.product, cheese: cheese.product };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  resetStoreForTests();
  await loadStore();
});

describe('full count flow through the store', () => {
  it('scan, list, case+loose, pause, reopen, finish; history + snapshots persist', async () => {
    const { cola, milk, cheese } = await seedCatalog();
    await startCount({ scope: { type: 'everything' }, mode: 'scan', blindCount: false, caseLooseEnabled: true });
    const r1 = await countScan('5000112637922', 'ean13');
    expect(r1.kind).toBe('counted');
    await countScan('15000112637929', 'itf14');
    expect(getState().openSession!.entries.find(e => e.productId === cola.id)!.quantityBase).toBe(25);
    await countSetCaseLoose(cola.id, { caseCount: 2, looseCount: 7 }, 'keypad');
    await countSetQuantity(cheese.id, 1.25, 'list');
    await pauseCount();

    // Process death + restart: the paused count comes back exactly.
    await reopenApp();
    const open = getState().openSession!;
    expect(open.status).toBe('paused');
    expect(open.entries.map(e => [e.productId, e.quantityBase]).sort()).toEqual([[cheese.id, 1.25], [cola.id, 55]].sort());
    await resumeCount();

    const [a, b] = await Promise.all([finishCount(), finishCount()]); // double tap
    expect(a).toBe(b);
    expect(getState().openSession).toBeNull();
    const snaps = getState().snapshots;
    expect(snaps[cola.id].quantityBase).toBe(55);
    expect(snaps[milk.id]).toBeUndefined(); // skipped → not zeroed

    await reopenApp();
    expect(getState().sessions).toHaveLength(1);
    expect(getState().sessions[0].status).toBe('completed');
    expect(getState().snapshots[cola.id].quantityBase).toBe(55);
    const full = await loadFullSession(getState().sessions[0].id);
    expect(full!.entries).toHaveLength(2);
  });

  it('crash right after a quantity entry keeps the entry', async () => {
    const { milk } = await seedCatalog();
    await startCount({ scope: { type: 'everything' }, mode: 'list', blindCount: false, caseLooseEnabled: false });
    await countSetQuantity(milk.id, 3, 'list');
    await reopenApp();
    expect(getState().openSession!.entries[0]).toMatchObject({ productId: milk.id, quantityBase: 3 });
  });

  it('only one open count; discard removes only the unfinished count', async () => {
    const { milk } = await seedCatalog();
    await startCount({ scope: { type: 'everything' }, mode: 'list', blindCount: false, caseLooseEnabled: false });
    await countSetQuantity(milk.id, 1, 'list');
    await finishCount();
    await startCount({ scope: { type: 'everything' }, mode: 'list', blindCount: false, caseLooseEnabled: false });
    await expect(startCount({ scope: { type: 'everything' }, mode: 'list', blindCount: false, caseLooseEnabled: false })).rejects.toBeInstanceOf(OpenCountExistsError);
    await countSetQuantity(milk.id, 9, 'list');
    await discardCount();
    expect(getState().openSession).toBeNull();
    expect(getState().sessions).toHaveLength(1);
    expect(getState().snapshots[milk.id].quantityBase).toBe(1);
    const keys = await AsyncStorage.getAllKeys();
    expect(keys.filter(k => k.startsWith('tillcount:countEntries:')).filter(k => !k.includes(':g')).length).toBe(1);
  });

  it('unknown and out-of-scope scans are reported, not silently counted', async () => {
    const { drinks, milk } = await seedCatalog();
    await startCount({ scope: { type: 'category', categoryId: drinks.id }, mode: 'scan', blindCount: false, caseLooseEnabled: false });
    expect(await countScan('9999999999994', 'ean13')).toEqual({ kind: 'unknown', code: '9999999999994' });
    const oos = await countScan('036000291452', 'upc_a');
    expect(oos.kind).toBe('outOfScope');
    expect(getState().openSession!.entries).toEqual([]);
    const ok = await countScan('036000291452', 'upc_a', { allowOutOfScope: true });
    expect(ok.kind).toBe('counted');
    expect(getState().openSession!.productIdsSnapshot).toContain(milk.id);
  });

  it('repeated scan OFF never increments blindly', async () => {
    await seedCatalog();
    await updateSettings({ repeatedScanAddsOne: false });
    await startCount({ scope: { type: 'everything' }, mode: 'scan', blindCount: false, caseLooseEnabled: false });
    const r = await countScan('5000112637922', 'ean13');
    expect(r.kind === 'counted' && r.outcome.kind).toBe('needsQuantity');
    expect(getState().openSession!.entries).toEqual([]);
  });

  it('renaming / archiving / deleting a product never rewrites completed history', async () => {
    const { cola } = await seedCatalog();
    await startCount({ scope: { type: 'everything' }, mode: 'list', blindCount: false, caseLooseEnabled: false });
    await countSetQuantity(cola.id, 4, 'list');
    await finishCount();
    const sessionId = getState().sessions[0].id;
    await updateProduct({ ...getState().index.byId.get(cola.id)!, name: 'Cola Zero', costPrice: 0.9 });
    await archiveProduct(cola.id);
    await deleteProduct(cola.id);
    await reopenApp();
    const full = await loadFullSession(sessionId);
    expect(full!.entries[0]).toMatchObject({ productName: 'Cola', costPriceAtCount: 0.5, quantityBase: 4 });
  });

  it('archive during an active count keeps the scope; unarchive is refused when the code moved', async () => {
    const { cola } = await seedCatalog();
    await startCount({ scope: { type: 'everything' }, mode: 'list', blindCount: false, caseLooseEnabled: false });
    await archiveProduct(cola.id);
    expect(getState().openSession!.productIdsSnapshot).toContain(cola.id);
    await countSetQuantity(cola.id, 2, 'list');
    const other = await createProduct({ name: 'New cola', countUnit: 'each', barcodes: [makeBarcode('x', '5000112637922', 'single', 1)] });
    expect(other.ok).toBe(true);
    const back = await unarchiveProduct(cola.id);
    expect(back.ok).toBe(false);
  });
});

describe('fail closed on corrupt storage', () => {
  it('a corrupt products collection shows an error state and is not overwritten', async () => {
    await seedCatalog();
    await AsyncStorage.setItem(KEYS.products, '{broken');
    resetStoreForTests();
    await loadStore();
    expect(getState().status).toBe('error');
    expect(getState().error?.kind).toBe('corrupt');
    expect(await AsyncStorage.getItem(KEYS.products)).toBe('{broken');
  });
  it('data from a newer schema is refused', async () => {
    await AsyncStorage.setItem(KEYS.schemaVersion, '99');
    resetStoreForTests();
    await loadStore();
    expect(getState().error?.kind).toBe('future');
  });
});
