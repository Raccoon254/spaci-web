import { Prisma } from '@prisma/client';
import { prisma } from '$lib/server/db';
import type { NoticeRow } from '$lib/notices';
import type { NoticeData, ReleaseNoticeSpec } from '$lib/server/notice-validation';
import type { Media } from '$lib/blocks';

// Active notices only (startsAt <= now < endsAt). Audience filtering happens in
// selectNotices, which is pure and unit tested. The take bound keeps the query
// cheap even if many notices are live at once.
export async function activeNoticeRows(now: Date): Promise<NoticeRow[]> {
  return prisma.notice.findMany({
    where: { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    orderBy: [{ startsAt: 'desc' }, { publishedAt: 'desc' }],
    take: 500
  });
}

export function toDbData(v: NoticeData) {
  return { ...v, media: v.media.length ? (v.media as unknown as Prisma.InputJsonValue) : Prisma.DbNull };
}

export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

export function isNotFound(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025';
}

// Creates or updates THE release notice for a version (unique on kind+version),
// so re-running a release sync never creates a duplicate. startsAt and
// publishedAt are kept from the first run; endsAt is recomputed from startsAt.
export async function upsertReleaseNotice(opts: {
  version: string;
  previousVersion: string;
  spec: ReleaseNoticeSpec;
  releaseSummary: string;
  highlight: string | null;
  notes: string | null;
  media: Media[];
  now?: Date;
}): Promise<{ id: string; created: boolean }> {
  const now = opts.now ?? new Date();
  const existing = await prisma.notice.findUnique({
    where: { kind_version: { kind: 'release', version: opts.version } }
  });
  const startsAt = existing?.startsAt ?? now;
  const endsAt = opts.spec.endsInDays ? new Date(startsAt.getTime() + opts.spec.endsInDays * 86_400_000) : null;
  const summary = (opts.spec.summary ?? opts.highlight ?? opts.releaseSummary ?? '').slice(0, 200);
  const data = {
    severity: opts.spec.severity,
    title: opts.spec.title ?? `Spaci ${opts.version} is available`,
    summary,
    body: opts.notes ?? '',
    media: opts.media.length ? (opts.media as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
    ctaLabel: opts.spec.cta?.label ?? null,
    ctaUrl: opts.spec.cta?.url ?? null,
    platforms: [] as string[],
    minVersion: null,
    maxVersion: opts.previousVersion,
    endsAt,
    dismissible: opts.spec.severity !== 'critical'
  };
  const row = await prisma.notice.upsert({
    where: { kind_version: { kind: 'release', version: opts.version } },
    create: { ...data, kind: 'release', version: opts.version, startsAt },
    update: data
  });
  return { id: row.id, created: !existing };
}
