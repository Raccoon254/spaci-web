import { json } from '@sveltejs/kit';
import { markdownToBlocksCached } from '$lib/blocks';
import { normalizeSemver } from '$lib/semver';
import { getReleases } from '$lib/server/releases-source';
import type { RequestHandler } from './$types';

// GET /api/releases/<version>/notes -> What's New content for one release.
// { version, date, highlight, body: Block[], media, links }. Markdown is
// converted to blocks here, never shipped raw. Releases published before rich
// notes existed return highlight null and empty body, media and links.
export const GET: RequestHandler = async ({ params }) => {
  const version = normalizeSemver(params.version);
  if (!version) return json({ error: 'Invalid version' }, { status: 400 });

  const releases = await getReleases();
  const r = releases.find((x) => x.version === version);
  if (!r) {
    return json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } });
  }
  return json(
    {
      version: r.version,
      date: r.date,
      highlight: r.highlight ?? null,
      body: markdownToBlocksCached(r.notes),
      media: r.media ?? [],
      links: r.links ?? []
    },
    { headers: { 'Cache-Control': 'public, max-age=300' } }
  );
};
