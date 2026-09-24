/**
 * schemas.ts — structural validators for every stored record. Storage reads, backup
 * restore and Till-family import all use these, so a malformed record is rejected at
 * the boundary (fail closed) instead of reaching the UI or the engines.
 */
import {
  BARCODE_ROLES, COUNT_UNITS, DEFAULT_SETTINGS,
  type AppSettings, type Category, type CountEntry, type CountScope, type CountSession, type FavouriteCount,
  type OnboardingState, type Product, type ProductBarcode, type ProductCountSnapshot, type StockLocation, type Supplier,
} from '../domain/types';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === 'string';
const optStr = (v: unknown) => v === undefined || typeof v === 'string';
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const optNonNeg = (v: unknown) => v === undefined || (num(v) && v >= 0);
const optBool = (v: unknown) => v === undefined || typeof v === 'boolean';
const iso = (v: unknown) => str(v) && v.length >= 10 && v.length <= 40 && !Number.isNaN(Date.parse(v));
const optIso = (v: unknown) => v === undefined || iso(v);
const id = (v: unknown) => str(v) && v.length > 0 && v.length <= 80;
const optId = (v: unknown) => v === undefined || id(v);
const status = (v: unknown) => v === 'active' || v === 'archived';

export function isProductBarcode(v: unknown): v is ProductBarcode {
  if (!isObj(v)) return false;
  return id(v.id) && str(v.code) && v.code.length <= 64 && str(v.normalizedCode) && v.normalizedCode.length <= 64
    && optStr(v.symbology) && BARCODE_ROLES.includes(v.role as ProductBarcode['role'])
    && num(v.unitsPerBarcode) && (v.unitsPerBarcode as number) > 0;
}

export function isProduct(v: unknown): v is Product {
  if (!isObj(v)) return false;
  return id(v.id) && id(v.familyProductId) && str(v.name) && v.name.length <= 200 && optStr(v.sku)
    && Array.isArray(v.barcodes) && v.barcodes.every(isProductBarcode)
    && optId(v.categoryId) && optId(v.supplierId) && optId(v.locationId)
    && COUNT_UNITS.includes(v.countUnit as Product['countUnit'])
    && (v.caseQuantity === undefined || (num(v.caseQuantity) && (v.caseQuantity as number) > 0))
    && (v.packQuantity === undefined || (num(v.packQuantity) && (v.packQuantity as number) > 0))
    && optNonNeg(v.costPrice) && optNonNeg(v.sellingPrice) && optNonNeg(v.reorderLevel) && optNonNeg(v.targetStock)
    && optStr(v.notes) && status(v.status) && optBool(v.isSample) && iso(v.createdAt) && iso(v.updatedAt);
}

function isNamed(v: unknown): v is Obj {
  return isObj(v) && id(v.id) && str(v.name) && v.name.length <= 200 && status(v.status) && optBool(v.isSample) && iso(v.createdAt) && iso(v.updatedAt);
}
export const isCategory = (v: unknown): v is Category => isNamed(v);
export const isStockLocation = (v: unknown): v is StockLocation => isNamed(v);
export const isSupplier = (v: unknown): v is Supplier => isNamed(v) && optStr((v as Obj).reference);

export function isCountScope(v: unknown): v is CountScope {
  if (!isObj(v)) return false;
  if (!['everything', 'category', 'supplier', 'location', 'selected'].includes(v.type as string)) return false;
  if (!optId(v.categoryId) || !optId(v.supplierId) || !optId(v.locationId)) return false;
  if (v.selectedProductIds !== undefined && !(Array.isArray(v.selectedProductIds) && v.selectedProductIds.every(id))) return false;
  return true;
}

export function isCountEntry(v: unknown): v is CountEntry {
  if (!isObj(v)) return false;
  return id(v.productId) && str(v.productName) && optStr(v.sku) && optStr(v.categoryName) && optStr(v.supplierName) && optStr(v.locationName)
    && COUNT_UNITS.includes(v.countUnit as CountEntry['countUnit']) && optNonNeg(v.costPriceAtCount)
    && num(v.quantityBase) && (v.quantityBase as number) >= 0
    && optNonNeg(v.caseCount) && optNonNeg(v.packCount) && optNonNeg(v.looseCount)
    && iso(v.countedAt) && ['scan', 'list', 'keypad', 'manual'].includes(v.source as string);
}

/** A stored session header: a session without its entries (entries live in their own collection). */
export type CountSessionHeader = Omit<CountSession, 'entries'> & { entryCount: number };

export function isCountSessionHeader(v: unknown): v is CountSessionHeader {
  if (!isObj(v)) return false;
  return id(v.id) && ['active', 'paused', 'completed'].includes(v.status as string) && isCountScope(v.scope) && optStr(v.scopeLabel)
    && (v.mode === 'scan' || v.mode === 'list') && typeof v.blindCount === 'boolean' && typeof v.caseLooseEnabled === 'boolean'
    && Array.isArray(v.productIdsSnapshot) && v.productIdsSnapshot.every(id)
    && iso(v.startedAt) && optIso(v.pausedAt) && optIso(v.completedAt)
    && (v.status !== 'completed' || iso(v.completedAt))
    && Number.isInteger(v.entryCount) && (v.entryCount as number) >= 0 && optBool(v.isSample)
    && (v.attentionAtCompletion === undefined || (isObj(v.attentionAtCompletion) && Number.isInteger(v.attentionAtCompletion.out) && Number.isInteger(v.attentionAtCompletion.low)));
}

export function isSnapshotMap(v: unknown): v is Record<string, ProductCountSnapshot> {
  if (!isObj(v)) return false;
  for (const [k, s] of Object.entries(v)) {
    if (!isObj(s) || s.productId !== k || !num(s.quantityBase) || (s.quantityBase as number) < 0 || !iso(s.countedAt) || !id(s.countSessionId)) return false;
  }
  return true;
}

export function isFavourite(v: unknown): v is FavouriteCount {
  if (!isObj(v)) return false;
  return id(v.id) && str(v.name) && v.name.length <= 200 && isCountScope(v.scope) && (v.mode === 'scan' || v.mode === 'list')
    && typeof v.blindCount === 'boolean' && typeof v.caseLooseEnabled === 'boolean' && optBool(v.isSample) && iso(v.createdAt) && iso(v.updatedAt);
}

export function isSettings(v: unknown): v is AppSettings {
  if (!isObj(v) || v.version !== 1) return false;
  const bools = ['blindCount', 'repeatedScanAddsOne', 'caseLooseEnabled', 'haptics', 'reorderShowSuggestions', 'reorderGroupBySupplier'];
  return (v.defaultCountMode === 'scan' || v.defaultCountMode === 'list') && bools.every(b => typeof v[b] === 'boolean')
    && COUNT_UNITS.includes(v.defaultCountUnit as AppSettings['defaultCountUnit'])
    && (v.productsWithoutTarget === 'needsSetup' || v.productsWithoutTarget === 'hide')
    && (v.weightUnit === 'kg' || v.weightUnit === 'g') && (v.volumeUnit === 'l' || v.volumeUnit === 'ml')
    && ['auto', 'comma-dot', 'dot-comma', 'space-comma'].includes(v.numberFormat as string)
    && ['dmy', 'mdy', 'ymd'].includes(v.dateFormat as string) && ['monday', 'sunday', 'saturday'].includes(v.weekStart as string);
}

export function isOnboarding(v: unknown): v is OnboardingState {
  return isObj(v) && v.version === 1 && optIso(v.completedAt) && optIso(v.cameraExplainedAt);
}

export const isSchemaVersion = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 1;

/**
 * Settings are low-risk preferences: a missing field (older build) or an invalid value
 * falls back to its default instead of blocking the app. Operational records never do this.
 */
export function normalizeSettings(raw: unknown): AppSettings {
  const base: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  if (isObj(raw)) {
    for (const k of Object.keys(DEFAULT_SETTINGS)) {
      if (k in raw) {
        const candidate = { ...base, [k]: raw[k], version: 1 };
        if (isSettings(candidate)) base[k] = raw[k];
      }
    }
  }
  return base as unknown as AppSettings;
}

export const isSettingsDoc = (v: unknown): v is Record<string, unknown> => isObj(v);
