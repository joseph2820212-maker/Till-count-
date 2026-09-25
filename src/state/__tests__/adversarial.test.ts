/**
 * Adversarial flows (handoff §24): things a busy shop floor actually does — rapid repeat
 * scans, double taps, absurd quantities, scanning archived goods, mixing sample and real
 * data — must never lose, invent or zero a count.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  archiveProduct, countClear, countScan, countSetQuantity, createProduct, discardCount, finishCount, startCount, updateSettings,
} from '../actions';
import { flushOpenSession, getState, loadStore, resetStoreForTests } from '../store';
import { makeBarcode } from '../../domain/productRules';
import { loadSampleData, removeSampleData, RealDataPresentError } from '../../modules/onboarding/sampleData';

async function reopenApp() {
  await flushOpenSession();
  resetStoreForTests();
  await loadStore();
}

async function product(name: string, code: string) {
  const r = await createProduct({ name, countUnit: 'each', barcodes: [makeBarcode(`b_${code}`, code, 'single', 1)] });
  if (!r.ok) throw new Error(`seed ${name}`);
  return r.product;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  resetStoreForTests();
  await loadStore();
});

describe('adversarial counting', () => {
  it('50 rapid repeat scans (not awaited one by one) count exactly 50 and survive an app kill', async () => {
    const cola = await product('Cola', '5000112637922');
    await updateSettings({ repeatedScanAddsOne: true });
    await startCount({ scope: { type: 'everything' }, mode: 'scan', blindCount: false, caseLooseEnabled: false });
    await Promise.all(Array.from({ length: 50 }, () => countScan('5000112637922', 'ean13')));
    expect(getState().openSession!.entries.find(e => e.productId === cola.id)!.quantityBase).toBe(50);
    await reopenApp();
    expect(getState().openSession!.entries.find(e => e.productId === cola.id)!.quantityBase).toBe(50);
  });

  it('a double-tapped Finish writes one completed count', async () => {
    const cola = await product('Cola', '5000112637922');
    await startCount({ scope: { type: 'everything' }, mode: 'list', blindCount: false, caseLooseEnabled: false });
    await countSetQuantity(cola.id, 7, 'manual');
    await Promise.all([finishCount(), finishCount(), finishCount()]);
    await reopenApp();
    expect(getState().sessions.filter(s => s.status === 'completed')).toHaveLength(1);
    expect(getState().snapshots[cola.id].quantityBase).toBe(7);
  });

  it('absurd, negative and non-numeric quantities are refused and change nothing', async () => {
    const cola = await product('Cola', '5000112637922');
    await startCount({ scope: { type: 'everything' }, mode: 'list', blindCount: false, caseLooseEnabled: false });
    await countSetQuantity(cola.id, 5, 'manual');
    for (const bad of [-1, Number.NaN, Number.POSITIVE_INFINITY, 1e12, 2.5]) {
      await expect(countSetQuantity(cola.id, bad, 'manual')).rejects.toThrow();
    }
    expect(getState().openSession!.entries.find(e => e.productId === cola.id)!.quantityBase).toBe(5);
  });

  it('a cleared entry is "not counted", so finishing keeps the previous count (never zero)', async () => {
    const cola = await product('Cola', '5000112637922');
    await startCount({ scope: { type: 'everything' }, mode: 'list', blindCount: false, caseLooseEnabled: false });
    await countSetQuantity(cola.id, 9, 'manual');
    await finishCount();
    await startCount({ scope: { type: 'everything' }, mode: 'list', blindCount: false, caseLooseEnabled: false });
    await countSetQuantity(cola.id, 3, 'manual');
    await countClear(cola.id);
    await finishCount();
    expect(getState().snapshots[cola.id].quantityBase).toBe(9);
  });

  it('scanning an archived product never counts it silently', async () => {
    const cola = await product('Cola', '5000112637922');
    await archiveProduct(cola.id);
    await startCount({ scope: { type: 'everything' }, mode: 'scan', blindCount: false, caseLooseEnabled: false });
    const r = await countScan('5000112637922', 'ean13');
    expect(r.kind).not.toBe('counted');
    expect(getState().openSession!.entries).toEqual([]);
  });

  it('UPC-A and its EAN-13 form are the same product (one normalisation path)', async () => {
    const milk = await product('Milk', '036000291452');
    await updateSettings({ repeatedScanAddsOne: true });
    await startCount({ scope: { type: 'everything' }, mode: 'scan', blindCount: false, caseLooseEnabled: false });
    await countScan('036000291452', 'upc_a');
    await countScan('0036000291452', 'ean13');
    expect(getState().openSession!.entries.find(e => e.productId === milk.id)!.quantityBase).toBe(2);
  });
});

describe('sample data never mixes with real data', () => {
  it('refuses to load samples into a catalogue that has real products', async () => {
    await product('Cola', '5000112637922');
    await expect(loadSampleData()).rejects.toBeInstanceOf(RealDataPresentError);
  });

  it('removing samples keeps every real product, count and snapshot', async () => {
    await loadSampleData();
    const real = await product('Real beans', '5000157024671');
    await startCount({ scope: { type: 'everything' }, mode: 'list', blindCount: false, caseLooseEnabled: false });
    await countSetQuantity(real.id, 4, 'manual');
    await finishCount();
    const realSessions = getState().sessions.filter(s => !s.isSample).length;
    await removeSampleData();
    await reopenApp();
    const st = getState();
    expect(st.products.map(p => p.name)).toEqual(['Real beans']);
    expect(st.sessions.filter(s => !s.isSample)).toHaveLength(realSessions);
    expect(st.sessions.some(s => s.isSample)).toBe(false);
    expect(st.snapshots[real.id].quantityBase).toBe(4);
  });
});

describe('races with Finish', () => {
  it('an edit that arrives while Finish is saving never reopens the completed count', async () => {
    const cola = await product('Cola', '5000112637922');
    await startCount({ scope: { type: 'everything' }, mode: 'list', blindCount: false, caseLooseEnabled: false });
    await countSetQuantity(cola.id, 7, 'manual');
    const finishing = finishCount();
    const late = countSetQuantity(cola.id, 9, 'manual').then(() => 'saved', () => 'refused');
    await finishing;
    expect(await late).toBe('refused');
    await reopenApp();
    const st = getState();
    expect(st.openSession).toBeNull();
    expect(st.sessions.filter(s => s.status === 'completed')).toHaveLength(1);
    expect(st.snapshots[cola.id].quantityBase).toBe(7);
  });

  it('Discard pressed while Finish is saving cannot delete the completed count', async () => {
    const cola = await product('Cola', '5000112637922');
    await startCount({ scope: { type: 'everything' }, mode: 'list', blindCount: false, caseLooseEnabled: false });
    await countSetQuantity(cola.id, 7, 'manual');
    const finishing = finishCount();
    const discard = discardCount().then(() => 'discarded', () => 'refused');
    await finishing;
    expect(await discard).toBe('refused');
    await reopenApp();
    expect(getState().sessions.filter(s => s.status === 'completed')).toHaveLength(1);
  });

  it('two catalogue edits started together both land', async () => {
    const a = await product('A', '5000112637922');
    const b = await product('B', '036000291452');
    await Promise.all([archiveProduct(a.id), archiveProduct(b.id)]);
    await reopenApp();
    expect(getState().products.filter(p => p.status === 'archived').map(p => p.name).sort()).toEqual(['A', 'B']);
  });
});

