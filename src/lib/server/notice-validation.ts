// Strict validation for notice writes (admin API and admin UI) and lenient
// validation for the rich release fields posted by CI. Pure: no database, no
// SvelteKit imports, so it is unit tested with node's test runner.

import { isHttps, safeHref, safeImageUrl, type Media } from '../blocks';
import { KINDS, PLATFORMS, SEVERITIES, type NoticeKind, type NoticePlatform, type NoticeRow, type Severity } from '../notices';
import { compareSemver, normalizeSemver } from '../semver';

export const LIMITS = {
  title: 80,
  summary: 200,
  body: 20_000,
  mediaItems: 8,
  alt: 300,
  caption: 300,
  ctaLabel: 40,
  url: 2048,
  highlight: 160,
  notes: 50_000,
  links: 20,
  linkLabel: 80,
  endsInDays: 365
} as const;

// What the database stores for a notice (model Notice, minus generated fields).
export interface NoticeData {
  kind: NoticeKind;
  severity: Severity;
  title: string;
  summary: string;
  body: string;
  media: Media[];
  ctaLabel: string | null;
  ctaUrl: string | null;
  version: string | null;
  platforms: NoticePlatform[];
  minVersion: string | null;
  maxVersion: string | null;
  startsAt: Date;
  endsAt: Date | null;
  dismissible: boolean;
}

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const ALLOWED_KEYS = new Set([
  'kind',
  'severity',
  'title',
  'summary',
  'body',
  'media',
  'cta',
  'version',
  'audience',
  'startsAt',
  'endsAt',
  'dismissible'
]);

// Single-line text: no control characters at all (newlines included).
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/;
// Multi-line text: tab and newline allowed.
const CONTROL_ML = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/;

const ISO_RE =
  /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?:T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.\d{1,3})?)?(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d))?$/;

// Strict ISO 8601: a date, or a date-time with seconds optional and an explicit
// offset (Z or +hh:mm). Calendar-invalid dates (Feb 30) are rejected.
export function parseIsoDate(input: unknown): Date | null {
  if (typeof input !== 'string') return null;
  const m = ISO_RE.exec(input);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 2000 || y > 2100) return null;
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function text(
  errors: string[],
  name: string,
  v: unknown,
  opts: { max: number; min?: number; multiline?: boolean }
): string {
  if (typeof v !== 'string') {
    errors.push(`${name} must be a string`);
    return '';
  }
  const s = opts.multiline ? v.replace(/\r\n?/g, '\n') : v.trim();
  if ((opts.multiline ? CONTROL_ML : CONTROL).test(s)) errors.push(`${name} contains control characters`);
  if (s.length < (opts.min ?? 0)) errors.push(opts.min === 1 ? `${name} is required` : `${name} is too short`);
  if (s.length > opts.max) errors.push(`${name} must be at most ${opts.max} characters`);
  return s;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function httpsUrl(errors: string[], name: string, v: unknown): string {
  if (typeof v !== 'string' || v.length > LIMITS.url || !isHttps(v)) {
    errors.push(`${name} must be an https URL`);
    return '';
  }
  return safeHref(v) ?? '';
}

function validateMedia(errors: string[], v: unknown): Media[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) {
    errors.push('media must be an array');
    return [];
  }
  if (v.length > LIMITS.mediaItems) errors.push(`media allows at most ${LIMITS.mediaItems} items`);
  const out: Media[] = [];
  v.slice(0, LIMITS.mediaItems).forEach((m, i) => {
    if (!isObject(m)) {
      errors.push(`media[${i}] must be an object`);
      return;
    }
    const url = safeImageUrl(m.url);
    if (!url) {
      errors.push(
        `media[${i}].url must be an https image on spaci.kentom.co.ke, raw.githubusercontent.com/Raccoon254/ or github.com/Raccoon254/ or github.com/user-attachments/`
      );
    }
    const alt = text(errors, `media[${i}].alt`, m.alt, { max: LIMITS.alt, min: 1 });
    const item: Media = { url: url ?? '', alt };
    if (m.caption !== undefined && m.caption !== null && m.caption !== '') {
      item.caption = text(errors, `media[${i}].caption`, m.caption, { max: LIMITS.caption });
    }
    out.push(item);
  });
  return out;
}

function validateCta(errors: string[], v: unknown): { label: string; url: string } | null {
  if (v === undefined || v === null) return null;
  if (!isObject(v)) {
    errors.push('cta must be an object or null');
    return null;
  }
  const label = text(errors, 'cta.label', v.label, { max: LIMITS.ctaLabel, min: 1 });
  const url = httpsUrl(errors, 'cta.url', v.url);
  return { label, url };
}

function semverField(errors: string[], name: string, v: unknown): string | null {
  if (v === undefined || v === null || v === '') return null;
  const n = normalizeSemver(v);
  if (!n) errors.push(`${name} must be a semver version like 2.3.0`);
  return n;
}

// Validates a full notice. For PATCH, merge the patch onto noticeToInput(row)
// first and validate the result, so cross-field rules see the final state.
export function validateNotice(input: unknown, now: Date = new Date()): Result<NoticeData> {
  const errors: string[] = [];
  if (!isObject(input)) return { ok: false, errors: ['body must be a JSON object'] };
  for (const k of Object.keys(input)) if (!ALLOWED_KEYS.has(k)) errors.push(`unknown field: ${k}`);

  const kind = input.kind === undefined ? 'announcement' : input.kind;
  if (!(KINDS as readonly unknown[]).includes(kind)) errors.push(`kind must be one of ${KINDS.join(', ')}`);

  const severity = input.severity;
  if (!(SEVERITIES as readonly unknown[]).includes(severity)) errors.push(`severity must be one of ${SEVERITIES.join(', ')}`);

  const title = text(errors, 'title', input.title, { max: LIMITS.title, min: 1 });
  const summary = input.summary === undefined ? '' : text(errors, 'summary', input.summary, { max: LIMITS.summary });
  const body =
    input.body === undefined || input.body === null
      ? ''
      : text(errors, 'body', input.body, { max: LIMITS.body, multiline: true });
  const media = validateMedia(errors, input.media);
  const cta = validateCta(errors, input.cta);

  const version = semverField(errors, 'version', input.version);
  if (kind === 'release' && !version && !errors.some((e) => e.startsWith('version'))) {
    errors.push('version is required for a release notice');
  }
  if (kind === 'announcement' && version) errors.push('version must be empty for an announcement');

  let platforms: NoticePlatform[] = [];
  let minVersion: string | null = null;
  let maxVersion: string | null = null;
  const aud = input.audience;
  if (aud !== undefined && aud !== null) {
    if (!isObject(aud)) {
      errors.push('audience must be an object');
    } else {
      for (const k of Object.keys(aud)) {
        if (!['platforms', 'minVersion', 'maxVersion'].includes(k)) errors.push(`unknown field: audience.${k}`);
      }
      if (aud.platforms !== undefined && aud.platforms !== null) {
        if (!Array.isArray(aud.platforms) || !aud.platforms.every((p) => (PLATFORMS as readonly unknown[]).includes(p))) {
          errors.push(`audience.platforms must be a list of ${PLATFORMS.join(', ')}`);
        } else {
          platforms = [...new Set(aud.platforms as NoticePlatform[])];
        }
      }
      minVersion = semverField(errors, 'audience.minVersion', aud.minVersion);
      maxVersion = semverField(errors, 'audience.maxVersion', aud.maxVersion);
      if (minVersion && maxVersion && compareSemver(minVersion, maxVersion) > 0) {
        errors.push('audience.minVersion must not be greater than audience.maxVersion');
      }
    }
  }

  let startsAt: Date | null = now;
  if (input.startsAt !== undefined && input.startsAt !== null) {
    startsAt = parseIsoDate(input.startsAt);
    if (!startsAt) errors.push('startsAt must be an ISO 8601 date, for example 2026-10-01T09:00:00Z');
  }
  let endsAt: Date | null = null;
  if (input.endsAt !== undefined && input.endsAt !== null && input.endsAt !== '') {
    endsAt = parseIsoDate(input.endsAt);
    if (!endsAt) errors.push('endsAt must be an ISO 8601 date or null');
  }
  if (startsAt && endsAt && endsAt.getTime() <= startsAt.getTime()) errors.push('endsAt must be after startsAt');

  let dismissible = severity !== 'critical';
  if (input.dismissible !== undefined) {
    if (typeof input.dismissible !== 'boolean') errors.push('dismissible must be true or false');
    else dismissible = input.dismissible;
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      kind: kind as NoticeKind,
      severity: severity as Severity,
      title,
      summary,
      body,
      media,
      ctaLabel: cta?.label ?? null,
      ctaUrl: cta?.url ?? null,
      version,
      platforms,
      minVersion,
      maxVersion,
      startsAt: startsAt!,
      endsAt,
      dismissible
    }
  };
}

// A stored row back to the API input shape (used to merge PATCH bodies).
export function noticeToInput(row: NoticeRow): Record<string, unknown> {
  const audience: Record<string, unknown> = {};
  if (row.platforms.length) audience.platforms = row.platforms;
  if (row.minVersion) audience.minVersion = row.minVersion;
  if (row.maxVersion) audience.maxVersion = row.maxVersion;
  return {
    kind: row.kind,
    severity: row.severity,
    title: row.title,
    summary: row.summary,
    body: row.body,
    media: Array.isArray(row.media) ? row.media : [],
    cta: row.ctaLabel && row.ctaUrl ? { label: row.ctaLabel, url: row.ctaUrl } : null,
    version: row.version,
    audience,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt ? row.endsAt.toISOString() : null,
    dismissible: row.dismissible
  };
}

export function mergePatch(row: NoticeRow, patch: unknown): Record<string, unknown> | null {
  if (!isObject(patch)) return null;
  const { id: _id, ...rest } = patch;
  return { ...noticeToInput(row), ...rest };
}

// ---------------------------------------------------------------------------
// Rich release fields posted by CI (POST /api/releases).
//
// Lenient on purpose: the same request carries the update feed's file list, so
// a bad optional field must never block a release. Invalid parts are dropped
// and reported back as warnings (sync-feed prints them).

export interface ReleaseNoticeSpec {
  severity: Severity;
  title: string | null;
  summary: string | null;
  cta: { label: string; url: string } | null;
  endsInDays: number | null;
}

export interface ReleaseExtras {
  highlight: string | null;
  notes: string | null;
  media: Media[];
  links: { label: string; url: string }[];
  notice: ReleaseNoticeSpec | null;
}

export function validateReleaseExtras(body: Record<string, unknown>): { value: ReleaseExtras; warnings: string[] } {
  const warnings: string[] = [];
  const value: ReleaseExtras = { highlight: null, notes: null, media: [], links: [], notice: null };

  if (body.highlight !== undefined && body.highlight !== null && body.highlight !== '') {
    const e: string[] = [];
    const h = text(e, 'highlight', body.highlight, { max: LIMITS.highlight });
    if (e.length) warnings.push(...e.map((m) => `${m}; highlight dropped`));
    else if (h) value.highlight = h;
  }

  if (body.notes !== undefined && body.notes !== null && body.notes !== '') {
    const e: string[] = [];
    const n = text(e, 'notes', body.notes, { max: LIMITS.notes, multiline: true });
    if (e.length) warnings.push(...e.map((m) => `${m}; notes dropped`));
    else value.notes = n;
  }

  if (body.media !== undefined && body.media !== null) {
    if (!Array.isArray(body.media)) warnings.push('media must be an array; media dropped');
    else {
      body.media.forEach((m, i) => {
        if (value.media.length >= LIMITS.mediaItems) {
          warnings.push(`media[${i}] dropped: at most ${LIMITS.mediaItems} items`);
          return;
        }
        const r = isObject(m) ? m : {};
        // The changelog uses `src`; the notice shape uses `url`. Accept both.
        const e: string[] = [];
        const one = validateMedia(e, [{ url: r.url ?? r.src, alt: r.alt, caption: r.caption }]);
        if (e.length) warnings.push(...e.map((x) => `${x.replace('media[0]', `media[${i}]`)}; item dropped`));
        else value.media.push(one[0]);
      });
    }
  }

  if (body.links !== undefined && body.links !== null) {
    if (!Array.isArray(body.links)) warnings.push('links must be an array; links dropped');
    else {
      body.links.forEach((l, i) => {
        const r = isObject(l) ? l : {};
        const e: string[] = [];
        const label = text(e, `links[${i}].label`, r.label, { max: LIMITS.linkLabel, min: 1 });
        const url = httpsUrl(e, `links[${i}].url`, r.url);
        if (value.links.length >= LIMITS.links) e.push(`links[${i}]: at most ${LIMITS.links} links`);
        if (e.length) warnings.push(...e.map((x) => `${x}; link dropped`));
        else value.links.push({ label, url });
      });
    }
  }

  if (body.notice !== undefined && body.notice !== null) {
    const e: string[] = [];
    const n = isObject(body.notice) ? body.notice : null;
    if (!n) e.push('notice must be an object');
    else {
      if (!(SEVERITIES as readonly unknown[]).includes(n.severity)) e.push(`notice.severity must be one of ${SEVERITIES.join(', ')}`);
      const title = n.title === undefined || n.title === null ? null : text(e, 'notice.title', n.title, { max: LIMITS.title, min: 1 });
      const summary =
        n.summary === undefined || n.summary === null ? null : text(e, 'notice.summary', n.summary, { max: LIMITS.summary });
      const cta = validateCta(e, n.cta);
      let endsInDays: number | null = null;
      if (n.endsInDays !== undefined && n.endsInDays !== null) {
        if (!Number.isInteger(n.endsInDays) || (n.endsInDays as number) < 1 || (n.endsInDays as number) > LIMITS.endsInDays) {
          e.push(`notice.endsInDays must be a whole number from 1 to ${LIMITS.endsInDays}`);
        } else endsInDays = n.endsInDays as number;
      }
      if (!e.length) {
        value.notice = { severity: n.severity as Severity, title, summary: summary || null, cta, endsInDays };
      }
    }
    if (e.length) warnings.push(...e.map((m) => `${m}; notice not created`));
  }

  return { value, warnings };
}
