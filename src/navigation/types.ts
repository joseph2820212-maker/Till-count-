/**
 * types.ts — the TillCount route contract (handoff §20). Every Figma screen has its own
 * route name (docs/FIGMA_SCREEN_AUDIT.md maps them 1:1). Tab roots: Home / Count /
 * Products / Reorder / More; every other screen lives in the current tab's stack so
 * Back always returns to the flow it came from.
 */
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { CountMode, CountScope } from '../domain/types';

export type ImportSource = 'csv' | 'tillcalcCsv' | 'familyTransfer';
export type CsvKind = 'reorder' | 'products';

export type StackParamList = {
  // Tab roots
  Home: undefined;
  Count: undefined;
  Products: { filter?: 'low' | 'out' | 'notCounted'; query?: string } | undefined;
  Reorder: undefined;
  More: undefined;
  // Count flow
  StartCount: undefined;
  ChooseLocation: undefined;
  ChooseCategory: undefined;
  ChooseSupplier: undefined;
  SelectProducts: undefined;
  CountSetup: { scope: CountScope; scopeLabel?: string; favouriteId?: string };
  ScanCount: { openManual?: boolean } | undefined;
  ListCount: undefined;
  QuickQuantity: { productId: string };
  UnknownBarcode: { code: string; symbology?: string };
  CreateFromScan: { code: string; symbology?: string };
  CountPaused: undefined;
  Review: undefined;
  Results: { sessionId: string };
  CountHistory: undefined;
  HistoryDetail: { sessionId: string };
  FavouriteCounts: undefined;
  EditFavourite: { favouriteId?: string } | undefined;
  // Products
  ProductDetail: { productId: string };
  AddProduct: { barcode?: string; symbology?: string; name?: string } | undefined;
  EditProduct: { productId: string };
  Barcodes: { productId: string };
  AddBarcode: { productId: string };
  Categories: undefined;
  CategoryForm: { id?: string } | undefined;
  Suppliers: undefined;
  SupplierForm: { id?: string } | undefined;
  Locations: undefined;
  LocationForm: { id?: string } | undefined;
  // Reorder
  SupplierReorder: { supplierId: string | null };
  EditReorderTarget: { productId: string };
  // Import / export / reports
  ExportCentre: undefined;
  CountPdfPreview: { sessionId?: string } | undefined;
  ReorderPdfPreview: { supplierId?: string | null } | undefined;
  CsvPreview: { kind: CsvKind; supplierId?: string | null };
  ImportCentre: undefined;
  CsvFieldMapping: { source: ImportSource };
  ImportReview: { source: ImportSource };
  ImportComplete: { added: number; updated: number; skipped: number };
  ImportFromTillCalc: undefined;
  FamilyExport: undefined;
  // More
  CountSettings: undefined;
  ReorderSettings: undefined;
  UnitsFormats: undefined;
  Currency: undefined;
  Language: undefined;
  DataBackup: undefined;
  CreateBackup: undefined;
  BackupSuccess: { fileName: string; uri: string; products: number; counts: number };
  RestoreFile: undefined;
  RestorePassword: undefined;
  RestorePreview: undefined;
  RestoreComplete: { products: number; counts: number };
  Help: undefined;
  Questions: undefined;
  About: undefined;
  Privacy: undefined;
  Terms: undefined;
  DataStorage: undefined;
  Disclaimer: undefined;
  Licences: undefined;
  Pro: { reason?: string } | undefined;
  RestorePurchase: undefined;
  // Onboarding (root stack, before the tabs)
  Welcome: undefined;
  HowItWorks: undefined;
  CameraPermission: undefined;
};

export type TabParamList = {
  HomeTab: NavigatorScreenParams<StackParamList> | undefined;
  CountTab: NavigatorScreenParams<StackParamList> | undefined;
  ProductsTab: NavigatorScreenParams<StackParamList> | undefined;
  ReorderTab: NavigatorScreenParams<StackParamList> | undefined;
  MoreTab: NavigatorScreenParams<StackParamList> | undefined;
};

export type RootParamList = StackParamList & { Tabs: NavigatorScreenParams<TabParamList> | undefined };

export type TabRoot = 'Home' | 'Count' | 'Products' | 'Reorder' | 'More';
export const TAB_ROOTS: readonly TabRoot[] = ['Home', 'Count', 'Products', 'Reorder', 'More'];
export const TAB_OF: Record<TabRoot, keyof TabParamList> = { Home: 'HomeTab', Count: 'CountTab', Products: 'ProductsTab', Reorder: 'ReorderTab', More: 'MoreTab' };

export type CountStartParams = { scope: CountScope; mode: CountMode };
