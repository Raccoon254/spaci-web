import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import type { RequestHandler } from './$types';

// Best-effort download analytics. The client POSTs { version, platform, file }
// when an installer is fetched. Never throws on a DB error: analytics must not
// break the user-facing flow.

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { version, platform, file } = body ?? {};

    if (
      typeof version === 'string' &&
      typeof platform === 'string' &&
      typeof file === 'string'
    ) {
      await prisma.downloadEvent.create({ data: { version, platform, file } });
    }
  } catch (err) {
    console.error('POST /api/track failed:', err);
    // Swallow: this endpoint always reports ok so the client never blocks.
  }

  return json({ ok: true });
};
