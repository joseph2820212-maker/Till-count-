/**
 * secureRandom.ts — cryptographically secure random bytes on every platform.
 *
 * Hermes (React Native) has no Web Crypto, so `globalThis.crypto.getRandomValues`
 * is absent on device; expo-crypto provides the same call backed by the OS CSPRNG
 * (SecureRandom on Android, SecRandomCopyBytes on iOS). Jest / Node use the built-in
 * Web Crypto. There is deliberately NO Math.random fallback: backup encryption and
 * ids must fail loudly rather than downgrade (docs/DEPENDENCY_DECISIONS.md D-01).
 */
import * as ExpoCrypto from 'expo-crypto';

export function secureRandomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  const g = globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } };
  if (g.crypto && typeof g.crypto.getRandomValues === 'function') {
    g.crypto.getRandomValues(out);
    return out;
  }
  if (typeof ExpoCrypto.getRandomValues === 'function') {
    ExpoCrypto.getRandomValues(out);
    return out;
  }
  throw new Error('No secure random source available.');
}
