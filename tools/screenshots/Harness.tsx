/**
 * Screenshot harness (web only; never bundled into the Android app).
 * URL: ?screen=<Route>&lang=<en|ar|tr|fr|es|de>&state=<variant>
 * Seeds the real store with the sample catalogue, one completed and one paused count,
 * and the import / restore sessions, then opens <Route> through the real navigators.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts, IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold, IBMPlexSansArabic_700Bold } from '@expo-google-fonts/ibm-plex-sans-arabic';
import i18n from '../../src/i18n';
import { TabNavigator } from '../../src/navigation/AppNavigator';
import { FIGMA_SCREENS, ONBOARDING_ROUTES } from '../../src/navigation/screens';
import { TAB_OF, TAB_ROOTS, type TabRoot } from '../../src/navigation/types';
import { BillingProvider } from '../../src/modules/billing/BillingProvider';
import { AppAlertOverlay } from '../../src/components/AppAlertOverlay';
import { getState, loadStore, resetStoreForTests } from '../../src/state/store';
import { completeOnboarding, countSetQuantity, createProduct, pauseCount, startCount } from '../../src/state/actions';
import { makeBarcode } from '../../src/domain/productRules';
import { FREE_CAPS } from '../../src/modules/billing/limits';
import { __setTxFailurePoint } from '../../src/storage/kv';
import { encryptString } from '../../src/backup/backupCrypto';
import { inspectText } from '../../src/modules/backup/backupFile';
import { loadSampleData } from '../../src/modules/onboarding/sampleData';
import { setImportSession } from '../../src/modules/data/importSession';
import { autoMap, parseCsv, rowsFromTable } from '../../src/modules/data/productImport';
import { setInspection, setStaged } from '../../src/modules/backup/restoreSession';
import { setNumberFormatOverride } from '../../src/utils/locale';
import { setDateFormat } from '../../src/utils/format';
import { tc } from '../../src/theme/colors';
import { Asset } from 'expo-asset';
// react-native-web resolves start/end styles from its locale context, not I18nManager.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { LocaleProvider } = require('react-native-web/dist/modules/useLocale') as { LocaleProvider: React.FC<{ direction: 'ltr' | 'rtl'; locale: string; children: React.ReactNode }> };

// Android draws text in Roboto; load it on the web so the renders match device type.
const ROBOTO: [number, number][] = [
  [400, require('@expo-google-fonts/roboto/400Regular/Roboto_400Regular.ttf')],
  [500, require('@expo-google-fonts/roboto/500Medium/Roboto_500Medium.ttf')],
  [600, require('@expo-google-fonts/roboto/600SemiBold/Roboto_600SemiBold.ttf')],
  [700, require('@expo-google-fonts/roboto/700Bold/Roboto_700Bold.ttf')],
  [800, require('@expo-google-fonts/roboto/800ExtraBold/Roboto_800ExtraBold.ttf')],
];
const style = document.createElement('style');
style.textContent = ROBOTO.map(([w, m]) => `@font-face{font-family:Roboto;font-weight:${w};src:url(${Asset.fromModule(m).uri}) format('truetype');}`).join('');
document.head.appendChild(style);

const q = new URLSearchParams(window.location.search);
const LANG = q.get('lang') || 'en';
const ROUTE = q.get('screen') || 'Home';
const STATE = q.get('state') || '';

function params(route: string): object | undefined {
  const st = getState();
  const product = st.products.find(p => p.barcodes.length > 1) ?? st.products[0] ?? { id: '' };
  const completed = st.sessions.find(s => s.status === 'completed');
  const table: Record<string, object> = {
    CountSetup: { scope: { type: 'category', categoryId: st.categories[0]?.id }, scopeLabel: st.categories[0]?.name },
    QuickQuantity: { productId: product.id },
    UnknownBarcode: { code: '5000112999999', symbology: 'ean13' },
    CreateFromScan: { code: '5000112999999', symbology: 'ean13' },
    Results: { sessionId: completed?.id },
    HistoryDetail: { sessionId: completed?.id },
    EditFavourite: { favouriteId: st.favourites[0]?.id },
    ProductDetail: { productId: product.id },
    EditProduct: { productId: product.id },
    Barcodes: { productId: product.id },
    AddBarcode: { productId: product.id },
    CategoryForm: { id: st.categories[0]?.id },
    SupplierForm: { id: st.suppliers[0]?.id },
    LocationForm: { id: st.locations[0]?.id },
    SupplierReorder: { supplierId: st.suppliers[0]?.id },
    EditReorderTarget: { productId: product.id },
    CountPdfPreview: { sessionId: completed?.id },
    ReorderPdfPreview: { supplierId: null },
    CsvPreview: { kind: 'reorder' },
    CsvFieldMapping: { source: 'csv' },
    ImportReview: { source: 'csv' },
    ImportComplete: { added: 118, updated: 0, skipped: 2 },
    BackupSuccess: { fileName: 'TillCount_Backup_20260924_2240.tcb', uri: 'file:///cache/x.tcb', products: 32, counts: 1 },
    RestoreComplete: { products: 32, counts: 1 },
    Pro: { reason: 'products' },
  };
  return table[route];
}

async function seed() {
  try { window.localStorage.clear(); } catch { /* private mode */ }
  resetStoreForTests();
  await loadStore();
  const onboarding = (ONBOARDING_ROUTES as readonly string[]).includes(ROUTE);
  if (STATE !== 'empty') {
    await loadSampleData();
    const st = getState();
    // Count set-up screens are shown as they look with no count open (Figma).
    const SETUP = ['StartCount', 'ChooseLocation', 'ChooseCategory', 'ChooseSupplier', 'SelectProducts', 'CountSetup'];
    if (STATE !== 'noOpenCount' && (STATE === 'openCount' || !SETUP.includes(ROUTE))) {
      await startCount({ scope: { type: 'everything' }, scopeLabel: 'Front shop', mode: 'scan', blindCount: false, caseLooseEnabled: true });
      await countSetQuantity(st.products[0].id, 12, 'scan');
      await countSetQuantity(st.products[1].id, 6, 'scan');
      if (ROUTE === 'CountPaused') await pauseCount();
    }
  }
  if (!onboarding) await completeOnboarding();
  if (STATE === 'atCap') {
    // Fill the catalogue to the provisional Free cap so the next product hits the limit.
    for (let i = getState().products.filter(p => !p.isSample).length; i < FREE_CAPS.products; i++) await createProduct({ name: `Product ${i + 1}`, countUnit: 'each', barcodes: [] });
  }
  if (STATE === 'importFail') __setTxFailurePoint('afterChunks');
  if (ROUTE === 'FamilyExport') {
    // Transfer files carry the shop's own products (sample records are never exported).
    const st = getState();
    await createProduct({ name: 'Heinz Baked Beans 415g', countUnit: 'each', categoryId: st.categories[0]?.id, barcodes: [makeBarcode('b_h1', '5000157024671', 'single', 1, 'ean13')] });
  }
  const table = parseCsv('Description,EAN,Department,Supplier,Case Qty\nCoca-Cola Original 500ml,5000112637922,Drinks,Booker,24\n,5000000000017,Snacks,Bestway,12\nSugar 1kg,5000000000024,Grocery,Booker,10');
  const rows = rowsFromTable(table, autoMap(table[0]));
  setImportSession({
    source: 'csv', fileName: 'products.csv', table, mapping: autoMap(table[0]), rows,
    skipped: ROUTE === 'ImportComplete' ? [{ ...rows[1], issues: ['missingName'] }, { ...rows[2], line: 9, issues: ['badBarcode'] }] as never : undefined,
  });
  if (STATE === 'realBackup') {
    // A genuinely encrypted file, so a wrong password fails exactly as on a device.
    const enc = encryptString(JSON.stringify({ data: {} }), 'correct horse battery');
    setInspection(inspectText(JSON.stringify({ format: 'tillcount-backup', version: 1, createdAt: '2026-09-24T21:40:00.000Z', appVersion: '1.0.0', schemaVersion: 1, entityCounts: { products: 32 }, enc }), 'TillCount_Backup_20260924_2240.tcb'));
  } else {
    setInspection({ fileName: 'TillCount_Backup_20260924_2240.tcb', encrypted: true, createdAt: '2026-09-24T21:40:00.000Z', entityCounts: {}, raw: {} } as never);
  }
  setStaged({ data: {}, entityCounts: { products: 32, categories: 7, suppliers: 4, locations: 4, completedCounts: 1, openCounts: 0, favourites: 1, settings: 1 }, createdAt: '2026-09-24T21:40:00.000Z' } as never);
  const s = getState().settings;
  setNumberFormatOverride(s.numberFormat);
  setDateFormat(s.dateFormat);
  await i18n.changeLanguage(LANG);
}

function initialState() {
  const onboarding = (ONBOARDING_ROUTES as readonly string[]).includes(ROUTE);
  if (onboarding) return { routes: [{ name: ROUTE }] };
  const isRoot = (TAB_ROOTS as readonly string[]).includes(ROUTE);
  const tabRoot: TabRoot = isRoot ? (ROUTE as TabRoot) : 'Home';
  const stack = isRoot ? [{ name: ROUTE }] : [{ name: tabRoot }, { name: ROUTE, params: params(ROUTE) }];
  const tabs = TAB_ROOTS.map(r => ({ name: TAB_OF[r], state: r === tabRoot ? { index: stack.length - 1, routes: stack } : undefined }));
  return { routes: [{ name: 'Tabs', state: { index: TAB_ROOTS.indexOf(tabRoot), routes: tabs } }] };
}

const Root = createNativeStackNavigator();

export default function Harness() {
  const [fonts] = useFonts({ IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold, IBMPlexSansArabic_700Bold });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { seed().then(() => setReady(true), e => setError(String(e?.stack ?? e))); }, []);
  if (error) return <View testID="harness-error" style={{ flex: 1, backgroundColor: 'red' }}>{error}</View>;
  if (!fonts || !ready) return <View style={{ flex: 1, backgroundColor: tc.warm }} />;
  const onboarding = (ONBOARDING_ROUTES as readonly string[]).includes(ROUTE);
  return (
    <LocaleProvider direction={LANG === 'ar' ? 'rtl' : 'ltr'} locale={LANG}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 0, left: 0, right: 0 } }}>
          <BillingProvider>
            <NavigationContainer initialState={initialState() as never} onReady={() => { (window as unknown as { __harnessReady: boolean }).__harnessReady = true; }}>
              <Root.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
                {onboarding
                  ? FIGMA_SCREENS.filter(s => (ONBOARDING_ROUTES as readonly string[]).includes(s.route)).map(s => <Root.Screen key={s.route} name={s.route} component={s.component} />)
                  : <Root.Screen name="Tabs" component={TabNavigator} />}
              </Root.Navigator>
            </NavigationContainer>
            <AppAlertOverlay />
          </BillingProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
    </LocaleProvider>
  );
}
