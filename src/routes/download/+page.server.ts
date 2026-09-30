import { getReleases, getLatest, withoutNotes } from '$lib/server/releases-source';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
  releases: (await getReleases()).map(withoutNotes),
  latest: withoutNotes(await getLatest())
});
