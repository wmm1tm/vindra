import * as ExpoCrypto from 'expo-crypto';
import nacl from 'tweetnacl';
import { decodeBase64, encodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';

/** Versleuteling voor partner-sync: de sleutel (sync_key) verlaat dit toestel nooit via
 * de server, alleen optisch via de QR-code die de partner scant. Zonder die sleutel is
 * de data die naar Supabase gaat volledig onleesbare ruis — zie SPEC/plan voor het
 * volledige beveiligingsmodel. */

export function generateSyncKey(): string {
  const bytes = new Uint8Array(nacl.secretbox.keyLength);
  ExpoCrypto.getRandomValues(bytes);
  return encodeBase64(bytes);
}

export function generateSyncId(): string {
  const bytes = new Uint8Array(16);
  ExpoCrypto.getRandomValues(bytes);
  // UUID v4-vormig (routeringscode, niet geheim — hoeft geen echte RFC4122-versie te zijn,
  // alleen voldoende entropie en een geldig `uuid`-kolomformaat voor Postgres).
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Versleutelt een willekeurig JSON-serialiseerbaar object. Resultaat = base64(nonce + ciphertext),
 * één string, klaar om als `ciphertext`-kolom op te slaan. */
export function encryptJson(syncKeyB64: string, value: unknown): string {
  const key = decodeBase64(syncKeyB64);
  const nonce = new Uint8Array(nacl.secretbox.nonceLength);
  ExpoCrypto.getRandomValues(nonce);
  const message = decodeUTF8(JSON.stringify(value));
  const box = nacl.secretbox(message, nonce, key);

  const combined = new Uint8Array(nonce.length + box.length);
  combined.set(nonce);
  combined.set(box, nonce.length);
  return encodeBase64(combined);
}

/** Inverse van encryptJson. Gooit een Error als de sleutel niet klopt of de data
 * gemanipuleerd is (secretbox verifieert integriteit, geen losse checksum nodig). */
export function decryptJson<T>(syncKeyB64: string, blobB64: string): T {
  const key = decodeBase64(syncKeyB64);
  const combined = decodeBase64(blobB64);
  const nonce = combined.slice(0, nacl.secretbox.nonceLength);
  const box = combined.slice(nacl.secretbox.nonceLength);

  const message = nacl.secretbox.open(box, nonce, key);
  if (!message) {
    throw new Error('Kon versleutelde data niet ontsleutelen (verkeerde sleutel of beschadigd bericht).');
  }
  return JSON.parse(encodeUTF8(message)) as T;
}
