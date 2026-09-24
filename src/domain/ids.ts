/**
 * ids.ts — record identifiers. Uses the platform secure random source (see
 * utils/secureRandom) so ids from two devices never collide in a Till-family transfer.
 */
import { secureRandomBytes } from '../utils/secureRandom';

const HEX = '0123456789abcdef';

function hex(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += HEX[bytes[i] >> 4] + HEX[bytes[i] & 15];
  return s;
}

/** RFC 4122 version-4 UUID. */
export function uuid(): string {
  const b = secureRandomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = hex(b);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Short prefixed id for local records ("p_…", "c_…"). */
export function newId(prefix: string): string {
  return `${prefix}_${hex(secureRandomBytes(10))}`;
}
