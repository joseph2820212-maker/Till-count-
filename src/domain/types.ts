/**
 * types.ts — the TillCount domain model (handoff §7). Records, not screen-shaped blobs.
 *
 * Quantities are always held in the product's count unit ("base unit"). A pack or
 * case barcode carries how many base units one scan represents.
 */

export type ProductStatus = 'active' | 'archived';
export type CountUnit = 'each' | 'kg' | 'g' | 'l' | 'ml';
export type BarcodeRole = 'single' | 'pack' | 'case';
export type RecordStatus = 'active' | 'archived';

export const COUNT_UNITS: readonly CountUnit[] = ['each', 'kg', 'g', 'l', 'ml'];
export const BARCODE_ROLES: readonly BarcodeRole[] = ['single', 'pack', 'case'];

export interface ProductBarcode {
  id: string;
  code: string;
  normalizedCode: string;
  symbology?: string;
  role: BarcodeRole;
  /** Base units one scan of this barcode represents. Always > 0; 1 for a single. */
  unitsPerBarcode: number;
}

export interface Product {
  id: string;
  /** Stable identity across Till-family apps. Never changes after creation. */
  familyProductId: string;
  name: string;
  sku?: string;
  barcodes: ProductBarcode[];
  categoryId?: string;
  supplierId?: string;
  locationId?: string;
  countUnit: CountUnit;
  /** Base units in one case / one pack when no case / pack barcode carries it (DECISIONS D-07). */
  caseQuantity?: number;
  packQuantity?: number;
  costPrice?: number;
  sellingPrice?: number;
  reorderLevel?: number;
  targetStock?: number;
  notes?: string;
  status: ProductStatus;
  /** True only for the optional, removable review sample data (handoff §30). */
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  status: RecordStatus;
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  reference?: string;
  status: RecordStatus;
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockLocation {
  id: string;
  name: string;
  status: RecordStatus;
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CountScopeType = 'everything' | 'category' | 'supplier' | 'location' | 'selected';
export type CountMode = 'scan' | 'list';
export type CountSessionStatus = 'active' | 'paused' | 'completed';
export type CountEntrySource = 'scan' | 'list' | 'keypad' | 'manual';

export interface CountScope {
  type: CountScopeType;
  categoryId?: string;
  supplierId?: string;
  locationId?: string;
  selectedProductIds?: string[];
}

/** Immutable history snapshot of one counted product (names copied at count time). */
export interface CountEntry {
  productId: string;
  productName: string;
  sku?: string;
  categoryName?: string;
  supplierName?: string;
  locationName?: string;
  countUnit: CountUnit;
  costPriceAtCount?: number;
  quantityBase: number;
  caseCount?: number;
  packCount?: number;
  looseCount?: number;
  countedAt: string;
  source: CountEntrySource;
}

export interface CountSession {
  id: string;
  status: CountSessionStatus;
  scope: CountScope;
  /** Display name of the scope at start (e.g. the category name), frozen with the session. */
  scopeLabel?: string;
  mode: CountMode;
  blindCount: boolean;
  caseLooseEnabled: boolean;
  productIdsSnapshot: string[];
  startedAt: string;
  pausedAt?: string;
  completedAt?: string;
  entries: CountEntry[];
  /** Out / low totals for the counted products, frozen when the count completed. */
  attentionAtCompletion?: { out: number; low: number };
  isSample?: boolean;
}

/** Latest COMPLETED count per product. Reorder reads only this. */
export interface ProductCountSnapshot {
  productId: string;
  quantityBase: number;
  countedAt: string;
  countSessionId: string;
}

export interface FavouriteCount {
  id: string;
  name: string;
  scope: CountScope;
  mode: CountMode;
  blindCount: boolean;
  caseLooseEnabled: boolean;
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WeekStart = 'monday' | 'sunday' | 'saturday';
export type DateFormat = 'dmy' | 'mdy' | 'ymd';
export type NumberFormat = 'auto' | 'comma-dot' | 'dot-comma' | 'space-comma';
export type WeightUnit = 'kg' | 'g';
export type VolumeUnit = 'l' | 'ml';
export type WithoutTarget = 'needsSetup' | 'hide';

export interface AppSettings {
  version: 1;
  defaultCountMode: CountMode;
  blindCount: boolean;
  repeatedScanAddsOne: boolean;
  caseLooseEnabled: boolean;
  haptics: boolean;
  /** Reorder: show suggested order (target − latest counted quantity). */
  reorderShowSuggestions: boolean;
  /** Reorder: default view grouped by supplier. */
  reorderGroupBySupplier: boolean;
  /** Reorder: how products with no target stock are shown. */
  productsWithoutTarget: WithoutTarget;
  defaultCountUnit: CountUnit;
  weightUnit: WeightUnit;
  volumeUnit: VolumeUnit;
  numberFormat: NumberFormat;
  dateFormat: DateFormat;
  weekStart: WeekStart;
}

export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  defaultCountMode: 'scan',
  blindCount: false,
  repeatedScanAddsOne: true,
  caseLooseEnabled: false,
  haptics: true,
  reorderShowSuggestions: true,
  reorderGroupBySupplier: true,
  productsWithoutTarget: 'needsSetup',
  defaultCountUnit: 'each',
  weightUnit: 'kg',
  volumeUnit: 'l',
  numberFormat: 'auto',
  dateFormat: 'dmy',
  weekStart: 'monday',
};

export interface OnboardingState {
  version: 1;
  completedAt?: string;
  cameraExplainedAt?: string;
}
