import { redirect } from '@sveltejs/kit';
import { createNotice } from '$lib/server/notice-admin';
import { formFail, readPayload } from '$lib/server/notice-form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
  initial: { kind: 'announcement', severity: 'info', startsAt: new Date().toISOString(), media: [], audience: {} }
});

export const actions: Actions = {
  save: async ({ request }) => {
    const p = await readPayload(request);
    if (!p.ok) return formFail(400, ['the form could not be read'], p.raw);
    let r;
    try {
      r = await createNotice(p.input);
    } catch (err) {
      console.error('create notice failed:', err instanceof Error ? err.message : 'error');
      return formFail(500, ['database error, try again'], p.raw);
    }
    if (!r.ok) return formFail(r.status, r.errors, p.raw);
    redirect(303, '/admin/notices');
  }
};
