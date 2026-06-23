import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { releases, latest, type Release } from '$lib/releases';
import { prisma } from '$lib/server/db';
import type { RequestHandler } from './$types';

// The static src/lib/releases.ts stays the canonical list for the rendered site.
// This endpoint serves that list as JSON (GET) and lets a CI release script push
// new releases into Neon without a redeploy (POST), feeding the DB-backed pieces.

export const GET: RequestHandler = async () => {
  return json(
    { releases, latest: latest.version },
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
  const secret = request.headers.get('x-publish-secret');
  if (!secret || secret !== env.RELEASE_PUBLISH_SECRET) {
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
        fixed: body.fixed ?? []
      },
      update: {
        date,
        tag: body.tag ?? '',
        major: body.major ?? false,
        summary: body.summary ?? '',
        added: body.added ?? [],
        improved: body.improved ?? [],
        fixed: body.fixed ?? []
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

    return json({ ok: true, version: release.version });
  } catch (err) {
    console.error('POST /api/releases failed:', err);
    return json({ ok: false, error: 'Failed to save release' }, { status: 500 });
  }
};
