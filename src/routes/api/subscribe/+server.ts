import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import type { RequestHandler } from './$types';

// Backs a "notify me on new releases" form. Idempotent on email.

// Simple, permissive email shape check. Real validation happens at confirm time.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: RequestHandler = async ({ request }) => {
  let email: unknown;
  try {
    const body = await request.json();
    email = body?.email;
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return json({ ok: false, error: 'Invalid email' }, { status: 400 });
  }

  const normalized = email.trim().toLowerCase();

  try {
    await prisma.subscriber.upsert({
      where: { email: normalized },
      create: { email: normalized },
      update: {} // Already subscribed: no-op, stays idempotent.
    });
    return json({ ok: true });
  } catch (err) {
    console.error('POST /api/subscribe failed:', err);
    return json({ ok: false }, { status: 500 });
  }
};
