import { prisma } from '$lib/server/db';
import { noticeStatus } from '$lib/notices';
import type { PageServerLoad } from './$types';

// Auth is enforced for all /admin routes in src/hooks.server.ts.
export const load: PageServerLoad = async () => {
  const now = new Date();
  try {
    const rows = await prisma.notice.findMany({
      orderBy: [{ startsAt: 'desc' }, { publishedAt: 'desc' }],
      take: 500
    });
    return {
      error: false,
      notices: rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        severity: r.severity,
        title: r.title,
        version: r.version,
        status: noticeStatus(r, now),
        startsAt: r.startsAt.toISOString(),
        endsAt: r.endsAt ? r.endsAt.toISOString() : null,
        platforms: r.platforms,
        minVersion: r.minVersion,
        maxVersion: r.maxVersion,
        dismissible: r.dismissible
      }))
    };
  } catch (err) {
    console.error('admin notices failed:', err instanceof Error ? err.message : 'error');
    return { error: true, notices: [] };
  }
};
