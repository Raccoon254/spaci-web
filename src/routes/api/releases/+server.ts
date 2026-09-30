import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { type Release } from '$lib/releases';
import { prisma } from '$lib/server/db';
import { getReleases } from '$lib/server/releases-source';
import { releases as staticReleases } from '$lib/releases';
import { Prisma } from '@prisma/client';
import { normalizeSemver, previousVersion } from '$lib/semver';
import { validateReleaseExtras } from '$lib/server/notice-validation';
import { upsertReleaseNotice } from '$lib/server/notices-db';
import { safeEqual } from '$lib/server/analytics';
import type { RequestHandler } from './$types';

// CI publishes each release into Neon (POST) and every read surface serves it
// from there, falling back to the static src/lib/releases.ts baseline when the
// database is unreachable.

export const GET: RequestHandler = async () => {
  // Read through the same DB-first source as the changelog, download page and
  // update feed. Reading the static file here made this endpoint the one place
  // that still advertised an old version after a release.
  const releases = await getReleases();
  return json(
    { releases, latest: releases[0]?.version ?? null },
    {
      headers: {
        // Short caching: the list is effectively static between releases.
        'Cache-Control': 'public, max-age=300'
      }
    }
  );
};

// Publish hook for future CI. POST a Release-shaped JSON body with the shared
// secret header to upsert it into Neon (version unique, files recreated).
export const POST: RequestHandler = async ({ request }) => {
  // Constant-time compare; an unset RELEASE_PUBLISH_SECRET keeps publishing closed.
  const secret = request.headers.get('x-publish-secret');
  const expected = env.RELEASE_PUBLISH_SECRET;
  if (!secret || !expected || !(await safeEqual(secret, expected))) {
    return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: Release;
  try {
    body = (await request.json()) as Release;
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body.version !== 'string' || !Array.isArray(body.files)) {
    return json({ ok: false, error: 'Missing version or files' }, { status: 400 });
  }

  // Optional rich fields (highlight, notes, media, links, notice). Invalid parts
  // are dropped with a warning instead of failing: this request also carries
  // the update feed's files, which must never be blocked by release notes.
  const { value: extras, warnings } = validateReleaseExtras(body as unknown as Record<string, unknown>);
  const rich = {
    highlight: extras.highlight,
    notes: extras.notes,
    media: extras.media.length ? (extras.media as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
    links: extras.links.length ? (extras.links as unknown as Prisma.InputJsonValue) : Prisma.DbNull
  };

  try {
    const date = new Date(body.date);

    const release = await prisma.release.upsert({
      where: { version: body.version },
      create: {
        version: body.version,
        date,
        tag: body.tag ?? '',
        major: body.major ?? false,
        summary: body.summary ?? '',
        added: body.added ?? [],
        improved: body.improved ?? [],
        fixed: body.fixed ?? [],
        ...rich
      },
      update: {
        date,
        tag: body.tag ?? '',
        major: body.major ?? false,
        summary: body.summary ?? '',
        added: body.added ?? [],
        improved: body.improved ?? [],
        fixed: body.fixed ?? [],
        ...rich
      }
    });

    // Recreate the file rows from the posted payload.
    await prisma.releaseFile.deleteMany({ where: { releaseId: release.id } });
    await prisma.releaseFile.createMany({
      data: body.files.map((f) => ({
        releaseId: release.id,
        platform: f.platform,
        arch: f.arch,
        file: f.file,
        size: f.size,
        bytes: f.bytes,
        sha512: f.sha512 ?? ''
      }))
    });

    // One release notice per version, for users on the previous release or
    // older (audience.maxVersion). Upserted, so re-running a sync is safe.
    let notice: { id: string; created: boolean } | null = null;
    if (extras.notice) {
      const version = normalizeSemver(release.version);
      const known = await prisma.release.findMany({ select: { version: true } });
      const prev = version
        ? previousVersion(version, [...known.map((r) => r.version), ...staticReleases.map((r) => r.version)])
        : null;
      if (!version) {
        warnings.push(`version ${release.version} is not semver; notice not created`);
      } else if (!prev) {
        warnings.push('no earlier release found to target; notice not created');
      } else {
        try {
          notice = await upsertReleaseNotice({
            version,
            previousVersion: prev,
            spec: extras.notice,
            releaseSummary: release.summary,
            highlight: extras.highlight,
            notes: extras.notes,
            media: extras.media
          });
        } catch (err) {
          console.error('release notice upsert failed:', err instanceof Error ? err.message : 'error');
          warnings.push('release saved, but the notice could not be saved');
        }
      }
    }

    return json({ ok: true, version: release.version, notice, warnings });
  } catch (err) {
    console.error('POST /api/releases failed:', err);
    return json({ ok: false, error: 'Failed to save release' }, { status: 500 });
  }
};
