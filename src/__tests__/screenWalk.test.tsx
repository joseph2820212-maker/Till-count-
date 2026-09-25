/**
 * Screen walk (handoff §22): every one of the 71 Figma screens renders with realistic
 * data and params, in all six languages (Arabic with RTL on), with the REAL locale
 * files. A screen fails if it throws, shows a raw translation key, or renders
 * "undefined" / "NaN" / "null". Native-backed primitives are stubbed; everything that
 * decides what text appears (store, engines, i18n, formatting) is real.
 */
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;

// Function declarations are hoisted above the (hoisted) jest.mock factories.
function mockPass(name: string) { return ({ children, ...props }: any) => require('react').createElement(name, props, children); }
var mockRtl = { isRTL: false };
var mockCamera = { granted: true, canAskAgain: true, status: 'granted' };
jest.mock('react-native', () => ({
  StyleSheet: { create: <T,>(s: T) => s, hairlineWidth: 1, absoluteFill: {}, absoluteFillObject: {}, flatten: (s: any) => s },
  View: 'View', Text: 'Text', ScrollView: 'ScrollView', TouchableOpacity: 'TouchableOpacity', TextInput: 'TextInput', Pressable: 'Pressable',
  StatusBar: 'StatusBar', Modal: ({ visible, children }: any) => (visible ? require('react').createElement('Modal', null, children) : null),
  FlatList: ({ data, renderItem, ListHeaderComponent, ListEmptyComponent, ListFooterComponent, keyExtractor }: any) => require('react').createElement('FlatList', null,
    ListHeaderComponent ?? null,
    ...(data && data.length ? data.slice(0, 30).map((item: any, index: number) => require('react').createElement(require('react').Fragment, { key: keyExtractor ? keyExtractor(item, index) : index }, renderItem({ item, index }))) : [ListEmptyComponent ?? null]),
    ListFooterComponent ?? null),
  ActivityIndicator: 'ActivityIndicator', Image: 'Image', Switch: 'Switch',
  get I18nManager() { return { isRTL: mockRtl?.isRTL ?? false, forceRTL: () => {}, allowRTL: () => {} }; },
  Platform: { OS: 'android', Version: 34, select: (o: any) => o.android ?? o.default },
  Dimensions: { get: () => ({ width: 390, height: 844, scale: 2, fontScale: 1 }), addEventListener: () => ({ remove() {} }) }, useWindowDimensions: () => ({ width: 390, height: 844, scale: 2, fontScale: 1 }),
  Alert: { alert: () => {} }, Linking: { openURL: async () => {}, canOpenURL: async () => true, openSettings: async () => {} }, Keyboard: { dismiss: () => {}, addListener: () => ({ remove() {} }) },
  Animated: { Value: class { setValue() {} interpolate() { return 0; } }, timing: () => ({ start: (cb?: () => void) => cb?.() }), spring: () => ({ start: (cb?: () => void) => cb?.() }), parallel: () => ({ start: (cb?: () => void) => cb?.() }), View: 'Animated.View', Text: 'Animated.Text', createAnimatedComponent: (c: any) => c },
  PixelRatio: { get: () => 2, roundToNearestPixel: (n: number) => n }, AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) }, NativeModules: {},
}));
const mockNav = { navigate: jest.fn(), goBack: jest.fn(), replace: jest.fn(), setParams: jest.fn(), popToTop: jest.fn(), canGoBack: () => true };
let mockParams: any = {};
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNav, useRoute: () => ({ params: mockParams }), useIsFocused: () => true,
  NavigationContainer: mockPass('NavigationContainer'), getFocusedRouteNameFromRoute: () => undefined,
}));
jest.mock('@react-navigation/native-stack', () => ({ createNativeStackNavigator: () => ({ Navigator: mockPass('Navigator'), Screen: mockPass('Screen') }) }));
jest.mock('@react-navigation/bottom-tabs', () => ({ createBottomTabNavigator: () => ({ Navigator: mockPass('TabNavigator'), Screen: mockPass('TabScreen') }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 24, bottom: 16, left: 0, right: 0 }), SafeAreaView: 'SafeAreaView', SafeAreaProvider: mockPass('SafeAreaProvider') }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-camera', () => ({ CameraView: 'CameraView', useCameraPermissions: () => [mockCamera, async () => mockCamera] }));
jest.mock('../theme/responsive', () => ({ fs: (v: number) => v, rs: (v: number) => v, scale: 1, isRTL: false, rowDir: 'row' }));
jest.mock('../theme/useResponsive', () => ({ useResponsive: () => ({ width: 390, height: 844, isTablet: false, isLandscape: false }) }));
jest.mock('../hooks/useKeyboardHeight', () => ({ useKeyboardHeight: () => 0 }));
jest.mock('../i18n', () => {
  const m = require('i18next'); const inst = m.default ?? m;
  return { __esModule: true, default: inst, SUPPORTED_LANGUAGES: ['en', 'ar', 'tr', 'fr', 'es', 'de'], changeLanguage: async () => ({ reloaded: false, rolledBack: false }), initializeLanguage: async () => ({ status: 'ready' }) };
});
jest.mock('../modules/billing/BillingProvider', () => ({ useBilling: () => ({ status: 'not_premium', entitlement: { isPremium: false, packages: [], source: 'unknown' }, purchaseRecoveryPending: false, purchase: async () => ({ success: false, cancelled: true }), restore: async () => ({ success: false }), refresh: async () => {}, retry: async () => {} }), BillingProvider: (p: any) => p.children }));
jest.mock('../components/AppSwitch', () => ({ AppSwitch: 'AppSwitch' }));
jest.mock('../components/HeaderTopBleed', () => ({ HeaderTopBleed: 'HeaderTopBleed' }));
jest.mock('../components/AppTextInput', () => ({ AppTextInput: 'AppTextInput' }));
jest.mock('../components/AppKeyboardScrollView', () => ({ AppKeyboardScrollView: mockPass('AppKeyboardScrollView') }));
jest.mock('../components/AppKeyboardBottomSheet', () => ({ AppKeyboardBottomSheet: ({ visible, children, footer }: any) => (visible ? require('react').createElement('BottomSheet', null, children, footer) : null) }));

import en from '../locales/en.json';
import ar from '../locales/ar.json';
import tr from '../locales/tr.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import de from '../locales/de.json';
import { FIGMA_SCREENS } from '../navigation/screens';
import type { StackParamList } from '../navigation/types';
import { getState, loadStore, resetStoreForTests } from '../state/store';
import { countSetQuantity, pauseCount, startCount } from '../state/actions';
import { loadSampleData } from '../modules/onboarding/sampleData';
import { setImportSession } from '../modules/data/importSession';
import { autoMap, parseCsv, rowsFromTable } from '../modules/data/productImport';
import { setInspection, setStaged } from '../modules/backup/restoreSession';

const LANGS = ['en', 'ar', 'tr', 'fr', 'es', 'de'] as const;
const RAW_KEY = /^[a-z][a-zA-Z]+(\.[a-zA-Z0-9_-]+)+$/;

function params(): Partial<Record<keyof StackParamList, unknown>> {
  const st = getState();
  const product = st.products.find(p => p.barcodes.length > 1) ?? st.products[0];
  const completed = st.sessions.find(s => s.status === 'completed')!;
  return {
    CountSetup: { scope: { type: 'category', categoryId: st.categories[0].id }, scopeLabel: st.categories[0].name },
    QuickQuantity: { productId: product.id },
    UnknownBarcode: { code: '5000112999999', symbology: 'ean13' },
    CreateFromScan: { code: '5000112999999', symbology: 'ean13' },
    Results: { sessionId: completed.id },
    HistoryDetail: { sessionId: completed.id },
    EditFavourite: { favouriteId: st.favourites[0].id },
    ProductDetail: { productId: product.id },
    EditProduct: { productId: product.id },
    Barcodes: { productId: product.id },
    AddBarcode: { productId: product.id },
    CategoryForm: { id: st.categories[0].id },
    SupplierForm: { id: st.suppliers[0].id },
    LocationForm: { id: st.locations[0].id },
    SupplierReorder: { supplierId: st.suppliers[0].id },
    EditReorderTarget: { productId: product.id },
    CountPdfPreview: { sessionId: completed.id },
    ReorderPdfPreview: { supplierId: null },
    CsvPreview: { kind: 'reorder' },
    CsvFieldMapping: { source: 'csv' },
    ImportReview: { source: 'csv' },
    ImportComplete: { added: 118, updated: 0, skipped: 8 },
    BackupSuccess: { fileName: 'TillCount_Backup_20260924_2240.tcb', uri: 'file:///cache/x.tcb', products: 32, counts: 1 },
    RestoreComplete: { products: 32, counts: 1 },
    Pro: { reason: 'products' },
  };
}

async function seed() {
  await AsyncStorage.clear();
  resetStoreForTests();
  await loadStore();
  await loadSampleData();
  const st = getState();
  await startCount({ scope: { type: 'everything' }, scopeLabel: 'Front shop', mode: 'scan', blindCount: false, caseLooseEnabled: true });
  await countSetQuantity(st.products[0].id, 12, 'scan');
  await pauseCount();
  const table = parseCsv('Description,EAN,Department,Supplier,Case Qty\nCoca-Cola Original 500ml,5000112637922,Drinks,Booker,24\n,5000000000017,Snacks,Bestway,12\nSugar 1kg,5000000000024,Grocery,Booker,10');
  setImportSession({ source: 'csv', fileName: 'products.csv', table, mapping: autoMap(table[0]), rows: rowsFromTable(table, autoMap(table[0])) });
  setInspection({ fileName: 'TillCount_Backup_20260924_2240.tcb', encrypted: true, createdAt: '2026-09-24T21:40:00.000Z', entityCounts: {}, raw: {} });
  setStaged({ data: {}, entityCounts: { products: 32, categories: 7, suppliers: 4, locations: 4, completedCounts: 1, openCounts: 0, favourites: 1, settings: 1 }, createdAt: '2026-09-24T21:40:00.000Z' });
}

const allTexts = (r: any): string[] => r.root.findAllByType('Text').flatMap((t: any) => {
  const c = t.props.children;
  const arr = Array.isArray(c) ? c : [c];
  return arr.filter((x: any) => typeof x === 'string' || typeof x === 'number').map((x: any) => String(x).replace(/\u200F/g, ''));
});
const flush = () => new Promise(res => setTimeout(res, 0));

beforeAll(async () => {
  await i18next.use(initReactI18next).init({ lng: 'en', fallbackLng: false, resources: { en: { translation: en }, ar: { translation: ar }, tr: { translation: tr }, fr: { translation: fr }, es: { translation: es }, de: { translation: de } }, interpolation: { escapeValue: false }, returnNull: false });
  await seed();
});

describe('screen walk', () => {
  it('the registry holds exactly the 71 Figma screens, each with a unique route and node', () => {
    expect(FIGMA_SCREENS).toHaveLength(71);
    expect(new Set(FIGMA_SCREENS.map(s => s.route)).size).toBe(71);
    expect(new Set(FIGMA_SCREENS.map(s => s.node)).size).toBe(71);
    expect(FIGMA_SCREENS.map(s => s.n)).toEqual(Array.from({ length: 71 }, (_, i) => i + 1));
  });

  for (const lang of LANGS) {
    it(`${lang}: all 71 screens render with no throw, no raw key, no undefined/NaN`, async () => {
      await i18next.changeLanguage(lang);
      mockRtl.isRTL = lang === 'ar';
      const failures: string[] = [];
      const p = params();
      for (const sc of FIGMA_SCREENS) {
        mockParams = p[sc.route];
        let renderer: any;
        try {
          await act(async () => { renderer = TestRenderer.create(React.createElement(sc.component)); await flush(); await flush(); await flush(); });
          const texts = allTexts(renderer);
          if (texts.length < 2) failures.push(`${sc.route} [${lang}] rendered almost nothing`);
          const raw = texts.filter(t => RAW_KEY.test(t.trim()));
          if (raw.length) failures.push(`${sc.route} [${lang}] raw keys: ${[...new Set(raw)].slice(0, 5).join(', ')}`);
          // "null" is the German word for zero, so only a bare rendered null counts there.
          const bad = texts.filter(t => /\b(undefined|NaN)\b/.test(t) || (lang === 'de' ? /^null$/.test(t.trim()) : /\bnull\b/.test(t)) || /\{\{/.test(t));
          if (bad.length) failures.push(`${sc.route} [${lang}] bad text: ${bad.slice(0, 3).join(' | ')}`);
        } catch (e) {
          failures.push(`${sc.route} [${lang}] threw: ${(e as Error).message.split('\n')[0]}`);
        } finally { await act(async () => { renderer?.unmount?.(); }); }
      }
      expect(failures).toEqual([]);
    });
  }

  it('camera permission refused for good: Scan & Count shows the camera-denied state (Figma state 01)', async () => {
    await i18next.changeLanguage('en');
    mockRtl.isRTL = false;
    mockCamera = { granted: false, canAskAgain: false, status: 'denied' };
    const scan = FIGMA_SCREENS.find(sc => sc.route === 'ScanCount')!;
    mockParams = undefined;
    let renderer: any;
    try {
      await act(async () => { renderer = TestRenderer.create(React.createElement(scan.component)); await flush(); await flush(); });
      expect(renderer.root.findAll((n: any) => n.props?.testID === 'state-camera-denied').length).toBeGreaterThan(0);
    } finally {
      await act(async () => { renderer?.unmount?.(); });
      mockCamera = { granted: true, canAskAgain: true, status: 'granted' };
    }
  });
});
