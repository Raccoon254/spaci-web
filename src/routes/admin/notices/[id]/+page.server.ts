import { error, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { deleteNotice, expireNotice, updateNotice, validId } from '$lib/server/notice-admin';
import { formFail, readPayload } from '$lib/server/notice-form';
import { noticeToInput } from '$lib/server/notice-validation';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  if (!validId(params.id)) error(404, 'Notice not found');
  const row = await prisma.notice.findUnique({ where: { id: params.id } });
  if (!row) error(404, 'Notice not found');
  return { id: row.id, initial: noticeToInput(row) };
};

export const actions: Actions = {
  save: async ({ request, params }) => {
    if (!validId(params.id)) error(404, 'Notice not found');
    const p = await readPayload(request);
    if (!p.ok) return formFail(400, ['the form could not be read'], p.raw);
    let r;
    try {
      r = await updateNotice(params.id, p.input);
    } catch (err) {
      console.error('update notice failed:', err instanceof Error ? err.message : 'error');
      return formFail(500, ['database error, try again'], p.raw);
    }
    if (!r.ok) return formFail(r.status, r.errors, p.raw);
    redirect(303, '/admin/notices');
  },
  expire: async ({ params }) => {
    if (!validId(params.id)) error(404, 'Notice not found');
    const r = await expireNotice(params.id);
    if (!r.ok) error(r.status, r.errors.join(', '));
    redirect(303, '/admin/notices');
  },
  delete: async ({ params }) => {
    if (!validId(params.id)) error(404, 'Notice not found');
    await deleteNotice(params.id);
    redirect(303, '/admin/notices');
  }
};
