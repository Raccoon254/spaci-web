// Uses Web Crypto (available in the Node 20 runtime) so no extra type
// packages or dependencies are needed.

const enc = new TextEncoder();

async function sha256(input: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(input)));
}

function hex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

// Salted SHA-256 of the install ID. The raw ID is never stored. Returns null
// when TELEMETRY_SALT is not configured, so we never store an unsalted hash.
export async function hashInstallId(installId: string, salt: string | undefined): Promise<string | null> {
  if (!salt) return null;
  return hex(await sha256(`${salt}:${installId.toLowerCase()}`));
}

// UTC midnight of the given moment, used as the @db.Date day bucket.
export function utcDay(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000);
}

// Constant-time comparison: hash both sides to a fixed length, then XOR all bytes.
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

// True when the Authorization header is `Bearer <secret>` and secret is set.
export async function bearerOk(header: string | null, secret: string | undefined): Promise<boolean> {
  if (!secret || !header) return false;
  const m = /^Bearer (.+)$/.exec(header);
  return !!m && (await safeEqual(m[1], secret));
}

// True when the Authorization header is HTTP Basic with the secret as the
// password (any username).
export async function basicOk(header: string | null, secret: string | undefined): Promise<boolean> {
  if (!secret || !header) return false;
  const m = /^Basic (.+)$/.exec(header);
  if (!m) return false;
  let decoded: string;
  try {
    decoded = new TextDecoder().decode(Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0)));
  } catch {
    return false;
  }
  const i = decoded.indexOf(':');
  if (i < 0) return false;
  return safeEqual(decoded.slice(i + 1), secret);
}
