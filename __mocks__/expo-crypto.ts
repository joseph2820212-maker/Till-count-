/** Jest mock for expo-crypto: Node's Web Crypto provides the same CSPRNG call. */
import { webcrypto } from 'crypto';

export function getRandomValues(array: Uint8Array): Uint8Array {
  webcrypto.getRandomValues(array as Uint8Array<ArrayBuffer>);
  return array;
}

export default { getRandomValues };
