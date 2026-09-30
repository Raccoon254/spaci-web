// Notice shape, audience matching and serialization. Pure (no database, no
// SvelteKit imports) so it is unit tested with node's test runner.

import { markdownToBlocksCached, sanitizeMedia, safeHref, isHttps, plainText, type Block, type Media } from './blocks';
import { compareParsed, parseSemver, type SemVer } from './semver';

export const KINDS = ['release', 'announcement'] as const;
export const SEVERITIES = ['info', 'update', 'important', 'critical'] as const;
export const PLATFORMS = ['mac', 'windows', 'linux'] as const;

export type NoticeKind = (typeof KINDS)[number];
export type Severity = (typeof SEVERITIES)[number];
export type NoticePlatform = (typeof PLATFORMS)[number];

export interface Audience {
  platforms?: NoticePlatform[];
  minVersion?: string;
  maxVersion?: string;
}

export interface Notice {
  id: string;
  kind: NoticeKind;
  severity: Severity;
  title: string;
  summary: string;
  body: Block[];
  media: Media[];
  cta: { label: string; url: string } | null;
  version: string | null;
  audience: Audience;
  startsAt: string;
  endsAt: string | null;
  dismissible: boolean;
  publishedAt: string;
  updatedAt: string;
}

// The stored row, as Prisma returns it (see model Notice in prisma/schema.prisma).
export interface NoticeRow {
  id: string;
  kind: string;
  severity: string;
  title: string;
  summary: string;
  body: string;
  media: unknown;
  ctaLabel: string | null;
  ctaUrl: string | null;
  version: string | null;
  platforms: string[];
  minVersion: string | null;
  maxVersion: string | null;
  startsAt: Date;
  endsAt: Date | null;
  dismissible: boolean;
  publishedAt: Date;
  updatedAt: Date;
}

export const MAX_NOTICES = 20;

// startsAt <= now < endsAt (endsAt null means open-ended).
export function isActive(row: Pick<NoticeRow, 'startsAt' | 'endsAt'>, now: Date): boolean {
  const t = now.getTime();
  return row.startsAt.getTime() <= t && (row.endsAt === null || t < row.endsAt.getTime());
}

export type NoticeStatus = 'scheduled' | 'live' | 'expired';

export function noticeStatus(row: Pick<NoticeRow, 'startsAt' | 'endsAt'>, now: Date): NoticeStatus {
  if (row.startsAt.getTime() > now.getTime()) return 'scheduled';
  return isActive(row, now) ? 'live' : 'expired';
}

export interface Client {
  version: SemVer | null;
  platform: NoticePlatform | null;
}

// Parses the query parameters. Unknown or invalid values become null, which
// only matches notices that do not restrict on that dimension.
export function parseClient(version: string | null, platform: string | null): Client {
  const p = (platform ?? '').toLowerCase();
  return {
    version: parseSemver(version ?? ''),
    platform: (PLATFORMS as readonly string[]).includes(p) ? (p as NoticePlatform) : null
  };
}

// Audience rules:
//   platforms: when non-empty, the client platform must be listed.
//   minVersion / maxVersion: inclusive bounds using semver precedence, so a
//   prerelease sorts before its release (2.3.0-beta.1 < 2.3.0). A client whose
//   version is unknown never matches a notice with a version bound. A bound that
//   fails to parse makes the notice match nobody (fail closed).
export function matchesAudience(row: Pick<NoticeRow, 'platforms' | 'minVersion' | 'maxVersion'>, client: Client): boolean {
  if (row.platforms.length) {
    if (!client.platform || !row.platforms.includes(client.platform)) return false;
  }
  if (row.minVersion) {
    const min = parseSemver(row.minVersion);
    if (!min || !client.version || compareParsed(client.version, min) < 0) return false;
  }
  if (row.maxVersion) {
    const max = parseSemver(row.maxVersion);
    if (!max || !client.version || compareParsed(client.version, max) > 0) return false;
  }
  return true;
}

// Active, matching, newest first (by startsAt, then publishedAt), capped.
export function selectNotices<T extends NoticeRow>(rows: T[], client: Client, now: Date, cap = MAX_NOTICES): T[] {
  return rows
    .filter((r) => isActive(r, now) && matchesAudience(r, client))
    .sort(
      (a, b) =>
        b.startsAt.getTime() - a.startsAt.getTime() ||
        b.publishedAt.getTime() - a.publishedAt.getTime() ||
        (a.id < b.id ? 1 : -1)
    )
    .slice(0, cap);
}

// Row to the public Notice shape. Everything is re-sanitized on the way out
// (defense in depth): body converted to blocks, media re-checked against the
// image allowlist, CTA re-checked as https.
export function toNotice(row: NoticeRow): Notice {
  const audience: Audience = {};
  const platforms = row.platforms.filter((p): p is NoticePlatform => (PLATFORMS as readonly string[]).includes(p));
  if (platforms.length) audience.platforms = platforms;
  if (row.minVersion) audience.minVersion = row.minVersion;
  if (row.maxVersion) audience.maxVersion = row.maxVersion;
  const ctaUrl = row.ctaUrl && isHttps(row.ctaUrl) ? safeHref(row.ctaUrl) : null;
  return {
    id: row.id,
    kind: (KINDS as readonly string[]).includes(row.kind) ? (row.kind as NoticeKind) : 'announcement',
    severity: (SEVERITIES as readonly string[]).includes(row.severity) ? (row.severity as Severity) : 'info',
    title: plainText(row.title, 80),
    summary: plainText(row.summary, 200),
    body: markdownToBlocksCached(row.body),
    media: sanitizeMedia(row.media),
    cta: ctaUrl && row.ctaLabel ? { label: plainText(row.ctaLabel, 80), url: ctaUrl } : null,
    version: row.version,
    audience,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt ? row.endsAt.toISOString() : null,
    dismissible: row.dismissible,
    publishedAt: row.publishedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}
