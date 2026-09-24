/**
 * security.ts
 *
 * Constant-time string comparison for secrets (PINs, recovery keys).
 * PIN/key *lengths* are not secret in this app, so an early length-mismatch
 * return is acceptable.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let acc = 0;
  for (let i = 0; i < a.length; i++) {
    acc |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return acc === 0;
}

// Common 4- and 6-digit PINs (most-used human choices). Rejecting these plus
// repeated/sequential digits removes the handful of PINs that cover a large
// share of real users, so the 5-attempt lockout can't be spent on easy guesses.
const COMMON_PINS = new Set([
  '1234', '1111', '0000', '1212', '7777', '1004', '2000', '4444', '2222', '6969',
  '9999', '3333', '5555', '6666', '1313', '8888', '4321', '2001', '1010', '1122',
  '123456', '654321', '111111', '000000', '121212', '123123', '112233', '159753', '147258',
]);

/** True when a numeric PIN is trivially weak (all-same digit, a sequential run,
 *  or one of the most common PINs). Non-numeric input returns false — callers
 *  enforce the digits-only / length rules separately. */
export function isWeakPin(pin: string): boolean {
  if (!/^\d+$/.test(pin)) return false;
  if (/^(\d)\1+$/.test(pin)) return true;                 // all identical digits
  if ('0123456789'.includes(pin) || '9876543210'.includes(pin)) return true; // ascending/descending run
  return COMMON_PINS.has(pin);
}
