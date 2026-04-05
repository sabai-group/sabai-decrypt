/**
 * AES-256-GCM decryption compatible with BYOS relay.ts.
 *
 * Wire format (base64-encoded): 12-byte IV || ciphertext || 16-byte GCM auth tag
 * Key derivation: SHA-256(secret) → 32-byte AES key
 *
 * Uses the Web Crypto API so the raw key material stays inside the browser's
 * crypto subsystem and is never exposed to page JavaScript.
 */

const PREFIX = "\u2301ENC:";

let cachedKey: { secret: string; key: CryptoKey } | null = null;

async function deriveKey(secret: string): Promise<CryptoKey> {
  if (cachedKey && cachedKey.secret === secret) return cachedKey.key;
  const encoded = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  const key = await crypto.subtle.importKey("raw", hash, "AES-GCM", false, [
    "decrypt",
  ]);
  cachedKey = { secret, key };
  return key;
}

export async function decrypt(
  secret: string,
  ciphertextB64: string,
): Promise<string> {
  const key = await deriveKey(secret);
  const raw = atob(ciphertextB64);
  const data = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) data[i] = raw.charCodeAt(i);
  const iv = data.slice(0, 12);
  // Web Crypto expects ciphertext+tag concatenated (which matches BYOS encoding)
  const ciphertext = data.slice(12);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plain);
}

export function hasPrefix(text: string): boolean {
  return text.includes(PREFIX);
}

export function extractTokens(
  text: string,
): { full: string; ciphertext: string; start: number; end: number }[] {
  const results: { full: string; ciphertext: string; start: number; end: number }[] = [];
  let idx = 0;
  while (idx < text.length) {
    const pos = text.indexOf(PREFIX, idx);
    if (pos === -1) break;
    const ctStart = pos + PREFIX.length;
    // Base64 characters: A-Z a-z 0-9 + / = (no whitespace)
    let ctEnd = ctStart;
    while (ctEnd < text.length && /[A-Za-z0-9+/=]/.test(text[ctEnd])) ctEnd++;
    if (ctEnd > ctStart) {
      results.push({
        full: text.slice(pos, ctEnd),
        ciphertext: text.slice(ctStart, ctEnd),
        start: pos,
        end: ctEnd,
      });
    }
    idx = ctEnd;
  }
  return results;
}

export function clearKeyCache(): void {
  cachedKey = null;
}

export { PREFIX };
