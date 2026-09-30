import { getLatest, withoutNotes } from '$lib/server/releases-source';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ latest: withoutNotes(await getLatest()) });
