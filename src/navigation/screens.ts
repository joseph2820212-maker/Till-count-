/**
 * screens.ts — the route → component registry. Exactly one entry per Figma screen
 * (71): docs/FIGMA_SCREEN_AUDIT.md and the route-map test both read FIGMA_SCREENS.
 */
import type React from 'react';
import type { StackParamList } from './types';
import { HomeScreen } from '../modules/home/HomeScreen';
import {
  ChooseCategoryScreen, ChooseLocationScreen, ChooseSupplierScreen, CountScreen, CountSetupScreen, SelectProductsScreen, StartCountScreen,
} from '../modules/count/screens/CountSetupScreens';
import {
  CountPausedScreen, CreateFromScanScreen, ListCountScreen, QuickQuantityScreen, ScanCountScreen, UnknownBarcodeScreen,
} from '../modules/count/screens/CountingScreens';
import {
  CountHistoryScreen, EditFavouriteScreen, FavouriteCountsScreen, HistoryDetailScreen, ResultsScreen, ReviewScreen,
} from '../modules/count/screens/CompletionScreens';
import {
  AddBarcodeScreen, AddProductScreen, BarcodesScreen, EditProductScreen, ProductDetailScreen, ProductsScreen,
} from '../modules/products/screens/ProductScreens';
import {
  CategoriesScreen, CategoryFormScreen, LocationFormScreen, LocationsScreen, SupplierFormScreen, SuppliersScreen,
} from '../modules/products/screens/NamedRecordScreens';
import { EditReorderTargetScreen, ReorderScreen, SupplierReorderScreen } from '../modules/reorder/ReorderScreens';
import {
  CountPdfPreviewScreen, CsvPreviewScreen, ExportCentreScreen, FamilyExportScreen, ReorderPdfPreviewScreen,
} from '../modules/data/screens/ExportScreens';
import {
  CsvFieldMappingScreen, ImportCentreScreen, ImportCompleteScreen, ImportFromTillCalcScreen, ImportReviewScreen,
} from '../modules/data/screens/ImportScreens';
import {
  CountSettingsScreen, CurrencyScreen, LanguageScreen, MoreScreen, ReorderSettingsScreen, UnitsFormatsScreen,
} from '../modules/more/screens/MoreScreens';
import {
  BackupSuccessScreen, CreateBackupScreen, DataBackupScreen, RestoreCompleteScreen, RestoreFileScreen, RestorePasswordScreen, RestorePreviewScreen,
} from '../modules/backup/BackupScreens';
import {
  AboutScreen, DataStorageScreen, DisclaimerScreen, HelpScreen, LicencesScreen, PrivacyScreen, QuestionsScreen, TermsScreen,
} from '../modules/more/screens/HelpLegalScreens';
import { ProScreen, RestorePurchaseScreen } from '../modules/billing/screens/ProScreens';
import { CameraPermissionScreen, HowItWorksScreen, WelcomeScreen } from '../modules/onboarding/OnboardingScreens';

export interface FigmaScreen { n: number; name: string; node: string; route: keyof StackParamList; component: React.ComponentType }

export const FIGMA_SCREENS: FigmaScreen[] = [
  { n: 1, name: 'Home', node: '17:112', route: 'Home', component: HomeScreen },
  { n: 2, name: 'Start Count', node: '17:184', route: 'StartCount', component: StartCountScreen },
  { n: 3, name: 'Choose Scope', node: '17:230', route: 'ChooseLocation', component: ChooseLocationScreen },
  { n: 4, name: 'Scan & Count', node: '17:270', route: 'ScanCount', component: ScanCountScreen },
  { n: 5, name: 'Review', node: '17:308', route: 'Review', component: ReviewScreen },
  { n: 6, name: 'Results', node: '17:348', route: 'Results', component: ResultsScreen },
  { n: 7, name: 'Reorder', node: '17:386', route: 'Reorder', component: ReorderScreen },
  { n: 8, name: 'Count', node: '21:187', route: 'Count', component: CountScreen },
  { n: 9, name: 'Count setup', node: '21:251', route: 'CountSetup', component: CountSetupScreen },
  { n: 10, name: 'Choose category', node: '21:283', route: 'ChooseCategory', component: ChooseCategoryScreen },
  { n: 11, name: 'Choose supplier', node: '21:327', route: 'ChooseSupplier', component: ChooseSupplierScreen },
  { n: 12, name: 'Select products', node: '21:371', route: 'SelectProducts', component: SelectProductsScreen },
  { n: 13, name: 'List count', node: '21:414', route: 'ListCount', component: ListCountScreen },
  { n: 14, name: 'Quick quantity', node: '21:471', route: 'QuickQuantity', component: QuickQuantityScreen },
  { n: 15, name: 'Unknown barcode', node: '22:370', route: 'UnknownBarcode', component: UnknownBarcodeScreen },
  { n: 16, name: 'Create from scan', node: '22:392', route: 'CreateFromScan', component: CreateFromScanScreen },
  { n: 17, name: 'Count paused', node: '22:425', route: 'CountPaused', component: CountPausedScreen },
  { n: 18, name: 'Count history', node: '22:447', route: 'CountHistory', component: CountHistoryScreen },
  { n: 19, name: 'History detail', node: '22:489', route: 'HistoryDetail', component: HistoryDetailScreen },
  { n: 20, name: 'Favourite counts', node: '22:534', route: 'FavouriteCounts', component: FavouriteCountsScreen },
  { n: 21, name: 'Edit favourite', node: '22:572', route: 'EditFavourite', component: EditFavouriteScreen },
  { n: 22, name: 'Products', node: '23:507', route: 'Products', component: ProductsScreen },
  { n: 23, name: 'Product detail', node: '23:578', route: 'ProductDetail', component: ProductDetailScreen },
  { n: 24, name: 'Add product', node: '23:631', route: 'AddProduct', component: AddProductScreen },
  { n: 25, name: 'Edit product', node: '23:668', route: 'EditProduct', component: EditProductScreen },
  { n: 26, name: 'Barcodes', node: '23:705', route: 'Barcodes', component: BarcodesScreen },
  { n: 27, name: 'Add barcode', node: '23:740', route: 'AddBarcode', component: AddBarcodeScreen },
  { n: 28, name: 'Categories', node: '23:769', route: 'Categories', component: CategoriesScreen },
  { n: 29, name: 'Category form', node: '24:718', route: 'CategoryForm', component: CategoryFormScreen },
  { n: 30, name: 'Suppliers', node: '24:740', route: 'Suppliers', component: SuppliersScreen },
  { n: 31, name: 'Supplier form', node: '24:778', route: 'SupplierForm', component: SupplierFormScreen },
  { n: 32, name: 'Locations', node: '24:804', route: 'Locations', component: LocationsScreen },
  { n: 33, name: 'Location form', node: '24:842', route: 'LocationForm', component: LocationFormScreen },
  { n: 34, name: 'Supplier reorder', node: '24:867', route: 'SupplierReorder', component: SupplierReorderScreen },
  { n: 35, name: 'Edit reorder target', node: '24:908', route: 'EditReorderTarget', component: EditReorderTargetScreen },
  { n: 36, name: 'Export Centre', node: '25:829', route: 'ExportCentre', component: ExportCentreScreen },
  { n: 37, name: 'Count PDF preview', node: '25:868', route: 'CountPdfPreview', component: CountPdfPreviewScreen },
  { n: 38, name: 'Reorder PDF preview', node: '25:892', route: 'ReorderPdfPreview', component: ReorderPdfPreviewScreen },
  { n: 39, name: 'CSV preview', node: '25:917', route: 'CsvPreview', component: CsvPreviewScreen },
  { n: 40, name: 'Import Centre', node: '25:942', route: 'ImportCentre', component: ImportCentreScreen },
  { n: 41, name: 'CSV field mapping', node: '25:974', route: 'CsvFieldMapping', component: CsvFieldMappingScreen },
  { n: 42, name: 'Import review', node: '25:1009', route: 'ImportReview', component: ImportReviewScreen },
  { n: 43, name: 'Import complete', node: '26:928', route: 'ImportComplete', component: ImportCompleteScreen },
  { n: 44, name: 'Import from TillCalc', node: '26:957', route: 'ImportFromTillCalc', component: ImportFromTillCalcScreen },
  { n: 45, name: 'Family export', node: '26:983', route: 'FamilyExport', component: FamilyExportScreen },
  { n: 46, name: 'More', node: '26:1018', route: 'More', component: MoreScreen },
  { n: 47, name: 'Count settings', node: '26:1100', route: 'CountSettings', component: CountSettingsScreen },
  { n: 48, name: 'Reorder settings', node: '26:1141', route: 'ReorderSettings', component: ReorderSettingsScreen },
  { n: 49, name: 'Units & formats', node: '26:1173', route: 'UnitsFormats', component: UnitsFormatsScreen },
  { n: 50, name: 'Currency', node: '27:1168', route: 'Currency', component: CurrencyScreen },
  { n: 51, name: 'Language', node: '27:1213', route: 'Language', component: LanguageScreen },
  { n: 52, name: 'Data & backup', node: '27:1261', route: 'DataBackup', component: DataBackupScreen },
  { n: 53, name: 'Create backup', node: '27:1306', route: 'CreateBackup', component: CreateBackupScreen },
  { n: 54, name: 'Backup success', node: '27:1334', route: 'BackupSuccess', component: BackupSuccessScreen },
  { n: 55, name: 'Restore file', node: '27:1354', route: 'RestoreFile', component: RestoreFileScreen },
  { n: 56, name: 'Restore password', node: '27:1380', route: 'RestorePassword', component: RestorePasswordScreen },
  { n: 57, name: 'Restore preview', node: '28:1264', route: 'RestorePreview', component: RestorePreviewScreen },
  { n: 58, name: 'Restore complete', node: '28:1310', route: 'RestoreComplete', component: RestoreCompleteScreen },
  { n: 59, name: 'Help', node: '28:1328', route: 'Help', component: HelpScreen },
  { n: 60, name: 'Questions', node: '28:1382', route: 'Questions', component: QuestionsScreen },
  { n: 61, name: 'About TillCount', node: '28:1409', route: 'About', component: AboutScreen },
  { n: 62, name: 'Privacy policy', node: '28:1466', route: 'Privacy', component: PrivacyScreen },
  { n: 63, name: 'Terms', node: '28:1491', route: 'Terms', component: TermsScreen },
  { n: 64, name: 'Data storage', node: '29:1399', route: 'DataStorage', component: DataStorageScreen },
  { n: 65, name: 'Disclaimer', node: '29:1424', route: 'Disclaimer', component: DisclaimerScreen },
  { n: 66, name: 'Licences', node: '29:1449', route: 'Licences', component: LicencesScreen },
  { n: 67, name: 'TillCount Pro', node: '29:1492', route: 'Pro', component: ProScreen },
  { n: 68, name: 'Restore purchase', node: '29:1526', route: 'RestorePurchase', component: RestorePurchaseScreen },
  { n: 69, name: 'Welcome', node: '29:1546', route: 'Welcome', component: WelcomeScreen },
  { n: 70, name: 'How it works', node: '29:1566', route: 'HowItWorks', component: HowItWorksScreen },
  { n: 71, name: 'Camera permission', node: '30:1473', route: 'CameraPermission', component: CameraPermissionScreen },
];

export const ONBOARDING_ROUTES: (keyof StackParamList)[] = ['Welcome', 'HowItWorks', 'CameraPermission'];
export const TAB_ROOT_ROUTES: (keyof StackParamList)[] = ['Home', 'Count', 'Products', 'Reorder', 'More'];

/** Every screen that can be pushed inside any tab's stack. */
export const SHARED_SCREENS = FIGMA_SCREENS.filter(s => !ONBOARDING_ROUTES.includes(s.route) && !TAB_ROOT_ROUTES.includes(s.route));
