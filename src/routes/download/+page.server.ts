import { getReleases, getLatest } from '$lib/server/releases-source';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
  releases: await getReleases(),
  latest: await getLatest()
});
