import { prisma } from '$lib/server/db';
import { toNotice, type Notice } from '$lib/notices';
import { mergePatch, validateNotice } from '$lib/server/notice-validation';
import { isNotFound, isUniqueViolation, toDbData } from '$lib/server/notices-db';

// Shared by the admin JSON API (/api/admin/notices) and the admin UI form
// actions (/admin/notices), so both enforce exactly the same validation.

export type AdminResult =
  | { ok: true; notice: Notice }
  | { ok: false; status: number; errors: string[] };

const DUPLICATE = 'a release notice for this version already exists';

export async function createNotice(input: unknown): Promise<AdminResult> {
  const v = validateNotice(input);
  if (!v.ok) return { ok: false, status: 400, errors: v.errors };
  try {
    const row = await prisma.notice.create({ data: toDbData(v.value) });
    return { ok: true, notice: toNotice(row) };
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, status: 409, errors: [DUPLICATE] };
    throw err;
  }
}

export async function updateNotice(id: string, patch: unknown): Promise<AdminResult> {
  const row = await prisma.notice.findUnique({ where: { id } });
  if (!row) return { ok: false, status: 404, errors: ['notice not found'] };
  const merged = mergePatch(row, patch);
  if (!merged) return { ok: false, status: 400, errors: ['body must be a JSON object'] };
  // Keep the stored startsAt when the patch does not set one (validateNotice
  // would otherwise default a missing startsAt to now).
  const v = validateNotice(merged, row.startsAt);
  if (!v.ok) return { ok: false, status: 400, errors: v.errors };
  try {
    const updated = await prisma.notice.update({ where: { id }, data: toDbData(v.value) });
    return { ok: true, notice: toNotice(updated) };
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, status: 409, errors: [DUPLICATE] };
    if (isNotFound(err)) return { ok: false, status: 404, errors: ['notice not found'] };
    throw err;
  }
}

// Ends a notice now. A scheduled notice that never started is moved to start
// and end now as well, so endsAt stays after startsAt.
export async function expireNotice(id: string, now = new Date()): Promise<AdminResult> {
  const row = await prisma.notice.findUnique({ where: { id } });
  if (!row) return { ok: false, status: 404, errors: ['notice not found'] };
  const startsAt = row.startsAt.getTime() >= now.getTime() ? new Date(now.getTime() - 1000) : row.startsAt;
  const updated = await prisma.notice.update({ where: { id }, data: { startsAt, endsAt: now } });
  return { ok: true, notice: toNotice(updated) };
}

export async function deleteNotice(id: string): Promise<{ ok: boolean; status: number }> {
  try {
    await prisma.notice.delete({ where: { id } });
    return { ok: true, status: 200 };
  } catch (err) {
    if (isNotFound(err)) return { ok: false, status: 404 };
    throw err;
  }
}

// Ids are cuids; reject anything else before it reaches the database.
export function validId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-z0-9]{8,40}$/i.test(id);
}
