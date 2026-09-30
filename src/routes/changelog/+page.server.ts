import { markdownToBlocksCached } from '$lib/blocks';
import { getReleases } from '$lib/server/releases-source';
import type { PageServerLoad } from './$types';

// Rich notes are converted to blocks on the server; the page renders them with
// the Block components, never as HTML.
export const load: PageServerLoad = async () => ({
  releases: (await getReleases()).map((r) => ({ ...r, notes: undefined, blocks: markdownToBlocksCached(r.notes) }))
});
