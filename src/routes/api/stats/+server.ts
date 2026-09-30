import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { bearerOk } from '$lib/server/analytics';
import { clampDays, getStats } from '$lib/server/stats';
import type { RequestHandler } from './$types';

// Owner-only analytics. Requires `Authorization: Bearer ${STATS_SECRET}`.
export const GET: RequestHandler = async ({ request, url }) => {
  if (!(await bearerOk(request.headers.get('authorization'), env.STATS_SECRET))) {
    return json({ error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    const stats = await getStats(clampDays(url.searchParams.get('days')));
    return json(stats, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('GET /api/stats failed:', err instanceof Error ? err.message : 'error');
    return json({ error: 'failed' }, { status: 500 });
  }
};
