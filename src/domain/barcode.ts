/**
 * barcode.ts — THE barcode normalisation path (handoff §3 rule 7). Ported from the
 * TillCalc donor (src/modules/priceList/utils/barcode.ts @ e7ea8ca) and extended with
 * the scanner-type mapping that lived in the donor ScanScreen. Every lookup,
 * duplicate check, import match and backup validation goes through normalizeBarcode.
 *
 * Rules:
 *  - UPC-A (12 digits) is EAN-13 with a leading zero, so both store as 13 digits.
 *  - UPC-E (8 digits, only when the scanner says upc_e) is expanded to UPC-A → EAN-13.
 *  - An 8-digit code from a keyboard is ambiguous (EAN-8 vs UPC-E) and stays as typed.
 *  - Digit groups separated by spaces ("5000 1594 07236") are joined.
 *  - Non-numeric codes (Code 128) are trimmed and kept as scanned.
 */

export type BarcodeSymbology = 'ean13' | 'ean8' | 'upc_a' | 'upc_e' | 'code128' | 'itf14' | 'unknown';

/** Scanner types TillCount asks the camera for. */
export const SCANNER_BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'itf14'] as const;

export function ean13CheckDigit(first12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10;
}

export function isValidEan13(code: string): boolean {
  return /^\d{13}$/.test(code) && ean13CheckDigit(code.slice(0, 12)) === Number(code[12]);
}

export function expandUpcE(code: string): string | null {
  if (!/^\d{8}$/.test(code)) return null;
  const ns = code[0];
  const body = code.slice(1, 7);
  const check = code[7];
  const last = body[5];
  let manufacturer: string; let product: string;
  switch (last) {
    case '0': case '1': case '2':
      manufacturer = body.slice(0, 2) + last + '00'; product = '00' + body.slice(2, 5); break;
    case '3':
      manufacturer = body.slice(0, 3) + '00'; product = '000' + body.slice(3, 5); break;
    case '4':
      manufacturer = body.slice(0, 4) + '0'; product = '0000' + body[4]; break;
    default:
      manufacturer = body.slice(0, 5); product = '0000' + last;
  }
  return ns + manufacturer + product + check;
}

/** Map an expo-camera barcode type string to our symbology. */
export function symbologyOf(type: string): BarcodeSymbology {
  const t = String(type || '').toLowerCase().replace('org.gs1.', '').replace('org.iso.', '').replace('-', '_');
  if (t.includes('ean13') || t === 'ean_13') return 'ean13';
  if (t.includes('ean8') || t === 'ean_8') return 'ean8';
  if (t.includes('upc_e') || t === 'upce') return 'upc_e';
  if (t.includes('upc_a') || t === 'upca') return 'upc_a';
  if (t.includes('code128') || t === 'code_128') return 'code128';
  if (t.includes('itf14') || t === 'itf_14' || t === 'itf') return 'itf14';
  return 'unknown';
}

/** Canonical form for storage and matching. */
export function normalizeBarcode(raw: string, symbology: BarcodeSymbology | string = 'unknown'): string {
  let trimmed = String(raw ?? '').trim();
  if (!trimmed) return '';
  if (/^[\d ]+$/.test(trimmed)) trimmed = trimmed.replace(/ +/g, '');
  if (!/^\d+$/.test(trimmed)) return trimmed;
  if (trimmed.length === 8 && symbology === 'upc_e') {
    const upcA = expandUpcE(trimmed);
    if (upcA && isValidEan13('0' + upcA)) return '0' + upcA;
    return trimmed;
  }
  if (trimmed.length === 12) return '0' + trimmed;
  return trimmed;
}

export function barcodesEquivalent(a: string, b: string): boolean {
  const na = normalizeBarcode(a);
  return na !== '' && na === normalizeBarcode(b);
}

/** A code we are willing to store: printable, bounded, no control characters. */
export function isAcceptableBarcode(raw: string): boolean {
  const s = String(raw ?? '').trim();
  if (!s || s.length > 64) return false;
  return !/[\u0000-\u001F\u007F]/.test(s);
}
