// Minimal semver parsing and comparison (semver.org 2.0.0 precedence).
// Pure, no dependencies. Build metadata is accepted and ignored.

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  pre: (string | number)[];
}

const RE =
  /^v?(0|[1-9]\d{0,8})\.(0|[1-9]\d{0,8})\.(0|[1-9]\d{0,8})(?:-((?:0|[1-9]\d{0,8}|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d{0,8}|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export function parseSemver(input: unknown): SemVer | null {
  if (typeof input !== 'string' || input.length > 64) return null;
  const m = RE.exec(input.trim());
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    pre: m[4] ? m[4].split('.').map((p) => (/^\d+$/.test(p) ? Number(p) : p)) : []
  };
}

export function isSemver(input: unknown): boolean {
  return parseSemver(input) !== null;
}

// Canonical string without a leading v or build metadata.
export function normalizeSemver(input: unknown): string | null {
  const v = parseSemver(input);
  if (!v) return null;
  return `${v.major}.${v.minor}.${v.patch}${v.pre.length ? '-' + v.pre.join('.') : ''}`;
}

function cmpNum(a: number, b: number): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function compareParsed(a: SemVer, b: SemVer): number {
  const core = cmpNum(a.major, b.major) || cmpNum(a.minor, b.minor) || cmpNum(a.patch, b.patch);
  if (core) return core;
  // A version without prerelease has higher precedence than one with.
  if (!a.pre.length && !b.pre.length) return 0;
  if (!a.pre.length) return 1;
  if (!b.pre.length) return -1;
  const n = Math.max(a.pre.length, b.pre.length);
  for (let i = 0; i < n; i++) {
    const x = a.pre[i];
    const y = b.pre[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    if (x === y) continue;
    const xn = typeof x === 'number';
    const yn = typeof y === 'number';
    if (xn && yn) return cmpNum(x as number, y as number);
    // Numeric identifiers have lower precedence than alphanumeric ones.
    if (xn) return -1;
    if (yn) return 1;
    return (x as string) < (y as string) ? -1 : 1;
  }
  return 0;
}

// Compares two version strings. Throws on invalid input so callers must
// validate first; use parseSemver for untrusted values.
export function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) throw new Error(`invalid semver: ${!pa ? a : b}`);
  return compareParsed(pa, pb);
}

// The highest version in `versions` strictly lower than `version`, or null.
export function previousVersion(version: string, versions: string[]): string | null {
  const target = parseSemver(version);
  if (!target) return null;
  let best: { s: string; v: SemVer } | null = null;
  for (const s of versions) {
    const v = parseSemver(s);
    if (!v || compareParsed(v, target) >= 0) continue;
    if (!best || compareParsed(v, best.v) > 0) best = { s: normalizeSemver(s)!, v };
  }
  return best?.s ?? null;
}
