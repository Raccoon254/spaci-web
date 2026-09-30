import { clampDays, getStats } from '$lib/server/stats';
import type { PageServerLoad } from './$types';

// Auth is enforced for all /admin routes in src/hooks.server.ts.
export const load: PageServerLoad = async ({ url }) => {
  try {
    return { stats: await getStats(clampDays(url.searchParams.get('days'))), error: false };
  } catch (err) {
    console.error('admin stats failed:', err instanceof Error ? err.message : 'error');
    return { stats: null, error: true };
  }
};
