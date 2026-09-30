import { json } from '@sveltejs/kit';
import { parseClient, selectNotices, toNotice } from '$lib/notices';
import { activeNoticeRows } from '$lib/server/notices-db';
import type { RequestHandler } from './$types';

// GET /api/notices?version=2.3.0&platform=mac
//
// Active notices (startsAt <= now < endsAt) whose audience matches, newest
// first, at most 20. Anonymous by design: only version and platform are read,
// nothing is logged or stored. A missing or invalid version or platform only
// matches notices that do not restrict on it.
export const GET: RequestHandler = async ({ url }) => {
  const client = parseClient(url.searchParams.get('version'), url.searchParams.get('platform'));
  const now = new Date();
  try {
    const rows = await activeNoticeRows(now);
    const notices = selectNotices(rows, client, now).map(toNotice);
    return json({ notices }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (err) {
    console.error('GET /api/notices failed:', err instanceof Error ? err.message : 'error');
    // Not cached, so a database blip never pins an empty list at the edge.
    // Clients keep whatever they already have on a non-200.
    return json({ notices: [], error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
};
