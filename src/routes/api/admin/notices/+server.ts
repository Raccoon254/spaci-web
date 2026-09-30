import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { bearerOk } from '$lib/server/analytics';
import { prisma } from '$lib/server/db';
import { toNotice } from '$lib/notices';
import { createNotice, deleteNotice, updateNotice, validId } from '$lib/server/notice-admin';
import type { RequestHandler } from './$types';

// Admin JSON API for scripts. Authorization: Bearer <STATS_SECRET>.
//   GET                          list all notices (any status)
//   POST   { ...notice }         create
//   PATCH  { id, ...fields }     partial update (or ?id=)
//   DELETE ?id=<id>              delete (or { id } in the body)

const noStore = { 'Cache-Control': 'no-store' };

async function authorized(request: Request): Promise<boolean> {
  return bearerOk(request.headers.get('authorization'), env.STATS_SECRET);
}

function unauthorized() {
  return json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: noStore });
}

async function readJson(request: Request): Promise<{ ok: true; body: unknown } | { ok: false }> {
  try {
    const text = await request.text();
    if (text.length > 200_000) return { ok: false };
    return { ok: true, body: text ? JSON.parse(text) : {} };
  } catch {
    return { ok: false };
  }
}

function fail(status: number, errors: string[]) {
  return json({ ok: false, errors }, { status, headers: noStore });
}

function serverError(err: unknown) {
  console.error('admin notices failed:', err instanceof Error ? err.message : 'error');
  return fail(500, ['database error']);
}

export const GET: RequestHandler = async ({ request }) => {
  if (!(await authorized(request))) return unauthorized();
  try {
    const rows = await prisma.notice.findMany({ orderBy: [{ startsAt: 'desc' }, { publishedAt: 'desc' }], take: 500 });
    return json({ ok: true, notices: rows.map(toNotice) }, { headers: noStore });
  } catch (err) {
    return serverError(err);
  }
};

export const POST: RequestHandler = async ({ request }) => {
  if (!(await authorized(request))) return unauthorized();
  const b = await readJson(request);
  if (!b.ok) return fail(400, ['invalid JSON body']);
  try {
    const r = await createNotice(b.body);
    return r.ok ? json({ ok: true, notice: r.notice }, { status: 201, headers: noStore }) : fail(r.status, r.errors);
  } catch (err) {
    return serverError(err);
  }
};

async function patchById(id: unknown, body: unknown) {
  if (!validId(id)) return fail(400, ['id is required']);
  try {
    const r = await updateNotice(id, body);
    return r.ok ? json({ ok: true, notice: r.notice }, { headers: noStore }) : fail(r.status, r.errors);
  } catch (err) {
    return serverError(err);
  }
}

async function deleteById(id: unknown) {
  if (!validId(id)) return fail(400, ['id is required']);
  try {
    const r = await deleteNotice(id);
    return r.ok ? json({ ok: true }, { headers: noStore }) : fail(r.status, ['notice not found']);
  } catch (err) {
    return serverError(err);
  }
}

export const PATCH: RequestHandler = async ({ request, url }) => {
  if (!(await authorized(request))) return unauthorized();
  const b = await readJson(request);
  if (!b.ok) return fail(400, ['invalid JSON body']);
  const body = b.body as Record<string, unknown> | null;
  const id = url.searchParams.get('id') ?? (body && typeof body === 'object' ? body.id : undefined);
  return patchById(id, body);
};

export const DELETE: RequestHandler = async ({ request, url }) => {
  if (!(await authorized(request))) return unauthorized();
  let id: unknown = url.searchParams.get('id');
  if (!id) {
    const b = await readJson(request);
    if (b.ok && b.body && typeof b.body === 'object') id = (b.body as Record<string, unknown>).id;
  }
  return deleteById(id);
};
