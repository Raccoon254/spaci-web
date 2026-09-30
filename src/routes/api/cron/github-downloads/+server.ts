import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { prisma } from '$lib/server/db';
import { bearerOk, utcDay } from '$lib/server/analytics';
import type { RequestHandler } from './$types';

// Daily cron (see vercel.json). Snapshots GitHub's per-asset download_count,
// the authoritative count for direct GitHub downloads. Vercel sends
// `Authorization: Bearer ${CRON_SECRET}` on cron invocations.

const RELEASES_URL = 'https://api.github.com/repos/Raccoon254/spaci/releases?per_page=100';

export const GET: RequestHandler = async ({ request }) => {
  if (!(await bearerOk(request.headers.get('authorization'), env.CRON_SECRET))) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'spaci-web-cron'
    };
    if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;

    const res = await fetch(RELEASES_URL, { headers });
    if (!res.ok) return json({ error: `github ${res.status}` }, { status: 502 });

    const releases = (await res.json()) as Array<{
      tag_name: string;
      assets?: Array<{ name: string; download_count: number }>;
    }>;

    const day = utcDay();
    let stored = 0;
    for (const r of releases) {
      for (const a of r.assets ?? []) {
        // Blockmaps are update metadata, not downloads people chose to make.
        if (a.name.endsWith('.blockmap')) continue;
        await prisma.githubDownloadSnapshot.upsert({
          where: { day_tag_asset: { day, tag: r.tag_name, asset: a.name } },
          create: { day, tag: r.tag_name, asset: a.name, count: a.download_count },
          update: { count: a.download_count }
        });
        stored++;
      }
    }
    return json({ ok: true, stored });
  } catch (err) {
    console.error('cron github-downloads failed:', err instanceof Error ? err.message : 'error');
    return json({ error: 'failed' }, { status: 500 });
  }
};
