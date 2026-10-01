// Bring src/lib/releases.ts (and package.json "version") up to the newest
// published release of the app, read from the public GitHub Releases API. No
// token is needed.
//
//   npm run refresh:baseline
//
// Runs as `prebuild`, so every deploy ships a baseline that matches the app's
// latest release. It never fails the build: if GitHub is unreachable or rate
// limited it says so and leaves the committed file as it is.

import { readFileSync, writeFileSync } from 'node:fs';
import { compareSemver } from '../src/lib/semver';
import { releases } from '../src/lib/releases';
import { applyToSource, fetchPublished, toRelease, GitHubUnavailable } from './baseline-lib';

const releasesPath = new URL('../src/lib/releases.ts', import.meta.url);
const pkgPath = new URL('../package.json', import.meta.url);

try {
  const known = releases[0].version;
  const newer = (await fetchPublished()).filter((r) => compareSemver(r.tag_name.replace(/^v/, ''), known) > 0);
  if (!newer.length) {
    console.log(`baseline is current (${known})`);
  } else {
    const fresh = [];
    for (const r of newer) fresh.push(await toRelease(r));
    // A release whose feed files are not uploaded yet would produce an entry
    // the check rejects, so wait for the next run instead of writing it.
    const complete = fresh.filter((r) => r.files.length > 0);
    if (complete.length !== fresh.length) console.warn('skipping release(s) without feed files yet');
    if (complete.length) {
      writeFileSync(releasesPath, applyToSource(readFileSync(releasesPath, 'utf8'), complete));
      const pkg = readFileSync(pkgPath, 'utf8');
      writeFileSync(pkgPath, pkg.replace(/("version":\s*")[^"]+(")/, `$1${complete[0].version}$2`));
      console.log(`baseline refreshed: ${known} -> ${complete[0].version} (${complete.length} release(s) added)`);
    }
  }
} catch (e) {
  if (e instanceof GitHubUnavailable) console.warn(`baseline refresh skipped, keeping the committed file: ${e.message}`);
  else throw e;
}
