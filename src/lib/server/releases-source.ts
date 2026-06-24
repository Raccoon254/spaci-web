import { releases as staticReleases, latest as staticLatest, type Release, type Platform } from '$lib/releases';
import { prisma } from '$lib/server/db';

// Returns all releases newest-first. Reads from Neon when available, and falls
// back to the static releases.ts baseline if the DB is empty or unreachable, so
// the changelog, download page and update feed can never hard-fail.
export async function getReleases(): Promise<Release[]> {
  try {
    const rows = await prisma.release.findMany({
      include: { files: true },
      // Order by release date, then createdAt as a tiebreaker so two releases
      // cut on the same day (e.g. 2.0.0 and 2.0.1) resolve to the newer one.
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
    });
    if (!rows.length) return staticReleases;
    return rows.map((r) => ({
      version: r.version,
      date: r.date.toISOString().slice(0, 10),
      tag: r.tag,
      major: r.major,
      summary: r.summary,
      added: r.added,
      improved: r.improved,
      fixed: r.fixed,
      files: r.files.map((f) => ({
        platform: f.platform as Platform,
        arch: f.arch,
        file: f.file,
        size: f.size,
        bytes: f.bytes,
        sha512: f.sha512
      }))
    }));
  } catch {
    return staticReleases;
  }
}

export async function getLatest(): Promise<Release> {
  const all = await getReleases();
  return all[0] ?? staticLatest;
}
