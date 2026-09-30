import { fail } from '@sveltejs/kit';

// Parses the single JSON `payload` field posted by NoticeForm.svelte.
export async function readPayload(request: Request): Promise<{ ok: true; input: unknown; raw: string } | { ok: false; raw: string }> {
  const form = await request.formData();
  const raw = String(form.get('payload') ?? '');
  if (!raw || raw.length > 200_000) return { ok: false, raw: '' };
  try {
    return { ok: true, input: JSON.parse(raw), raw };
  } catch {
    return { ok: false, raw: '' };
  }
}

export function formFail(status: number, errors: string[], raw: string) {
  return fail(status, { errors, payload: raw });
}
