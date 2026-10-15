// Session cookie signing with Web Crypto only, so it runs in the Edge middleware and in route handlers.
export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const MIN_SECRET_LENGTH = 32;

const encoder = new TextEncoder();

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function usableSecret(secret: string | undefined): secret is string {
  return typeof secret === "string" && secret.length >= MIN_SECRET_LENGTH;
}

/** Token format: `<expiresAtMs>.<hex HMAC of expiresAtMs>`. */
export async function signSession(secret: string | undefined, nowMs: number): Promise<string> {
  if (!usableSecret(secret)) throw new Error("SESSION_SECRET must be set and at least 32 characters");
  const expires = String(nowMs + SESSION_MAX_AGE_SECONDS * 1000);
  return `${expires}.${await hmac(secret, expires)}`;
}

export async function verifySession(
  token: string | undefined,
  secret: string | undefined,
  nowMs: number,
): Promise<boolean> {
  if (!token || !usableSecret(secret)) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expires, sig] = parts;
  if (!/^\d+$/.test(expires)) return false;
  if (!safeEqual(sig, await hmac(secret, expires))) return false;
  return Number(expires) > nowMs;
}

/** Compares via SHA-256 digests so the comparison does not depend on password length. */
export async function passwordMatches(input: string, expected: string | undefined): Promise<boolean> {
  if (!expected) return false;
  const [a, b] = await Promise.all(
    [input, expected].map(async (s) => toHex(await crypto.subtle.digest("SHA-256", encoder.encode(s)))),
  );
  return safeEqual(a, b);
}
