export const SESSION_COOKIE_NAME = "wv_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const SESSION_PAYLOAD = "authenticated";

/**
 * Session token = HMAC-SHA256("authenticated", SITE_PASSWORD), hex-encoded.
 * There's no session store — the cookie itself is the proof of knowledge of
 * the shared password. Computed with the Web Crypto API (`crypto.subtle`)
 * rather than `node:crypto` because this same function runs both in
 * `src/middleware.ts` (Edge runtime, no `node:crypto`) and in the Node.js
 * login API route — Web Crypto is the one HMAC implementation available in
 * both, so both sides always produce identical bytes.
 */
export async function computeSessionToken(password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(SESSION_PAYLOAD));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Constant-time comparison of two fixed-length hex digests. `node:crypto`'s
 * `timingSafeEqual` isn't available in the Edge runtime, so this is a small
 * hand-rolled equivalent: it always walks the full string instead of
 * short-circuiting on the first mismatch, which is what protects the
 * password hash from a timing side-channel.
 */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifySessionToken(
  token: string | undefined | null,
  password: string,
): Promise<boolean> {
  if (!token) return false;
  const expected = await computeSessionToken(password);
  return timingSafeEqualHex(token, expected);
}
