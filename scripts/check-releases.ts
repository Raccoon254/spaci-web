// Validate src/lib/releases.ts, the static baseline the site falls back to when
// Neon is unreachable.
//
//   npm run check:releases
//
// This exists because the baseline silently went stale: the database served
// 2.0.1 for months while this file still claimed 1.2.0, so any Neon outage would
// have advertised an old version with unverifiable downloads.

import { readFileSync } from 'node:fs';
import { releases, type Release } from '../src/lib/releases';

const errors: string[] = [];
const warnings: string[] = [];
const fail = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const latest: Release | undefined = releases[0];

if (!latest) {
  fail('releases.ts is empty');
} else {
  // The newest entry is what the update feed and download page serve.
  if (pkg.version !== latest.version) {
    fail(`package.json version ${pkg.version} does not match the newest release ${latest.version}`);
  }

  const versions = releases.map((r) => r.version);
  const dupes = versions.filter((v, i) => versions.indexOf(v) !== i);
  if (dupes.length) fail(`duplicate versions: ${[...new Set(dupes)].join(', ')}`);

  for (let i = 1; i < releases.length; i++) {
    if (releases[i].date > releases[i - 1].date) {
      fail(`releases must be newest first: ${releases[i].version} (${releases[i].date}) comes after ${releases[i - 1].version} (${releases[i - 1].date})`);
    }
  }

  const latestTags = releases.filter((r) => r.tag === 'Latest');
  if (latestTags.length > 1) {
    fail(`only the newest release may be tagged "Latest": ${latestTags.map((r) => r.version).join(', ')}`);
  }

  for (const r of releases) {
    if (!/^\d+\.\d+\.\d+$/.test(r.version)) fail(`${r.version}: not a semver version`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) fail(`${r.version}: date must be YYYY-MM-DD`);
    if (!r.summary) fail(`${r.version}: missing summary`);
    if (!r.files.length) fail(`${r.version}: no files`);

    for (const f of r.files) {
      if (!f.file.includes(r.version)) fail(`${r.version}: artifact ${f.file} does not carry the version`);
      if (!(f.bytes > 0)) fail(`${r.version}: ${f.file} has no byte size`);
      if (!f.size) fail(`${r.version}: ${f.file} has no human size`);
      if (!['mac', 'windows', 'linux'].includes(f.platform)) fail(`${r.version}: ${f.file} has unknown platform ${f.platform}`);
    }

    const names = r.files.map((f) => f.file);
    const dupeFiles = names.filter((n, i) => names.indexOf(n) !== i);
    if (dupeFiles.length) fail(`${r.version}: duplicate artifacts ${[...new Set(dupeFiles)].join(', ')}`);
  }

  // Only the newest release is actually served by /updates/latest-*.yml, so it
  // is the one that has to be complete and verifiable.
  for (const platform of ['mac', 'windows', 'linux'] as const) {
    if (!latest.files.some((f) => f.platform === platform)) {
      fail(`${latest.version}: no ${platform} artifact, /updates/latest-${platform === 'windows' ? '' : platform + '-'}yml would 404`);
    }
  }
  if (!latest.files.some((f) => f.platform === 'mac' && /\.zip$/i.test(f.file))) {
    fail(`${latest.version}: macOS auto-update needs a .zip artifact, a .dmg alone cannot be applied by electron-updater`);
  }
  for (const f of latest.files) {
    if (!f.sha512) fail(`${latest.version}: ${f.file} has no sha512, electron-updater cannot verify the download`);
  }
  for (const r of releases.slice(1)) {
    const missing = r.files.filter((f) => !f.sha512).length;
    if (missing) warn(`${r.version}: ${missing} artifact(s) without sha512 (older release, not served by the feed)`);
  }
}

for (const w of warnings) console.warn(`warning  ${w}`);
for (const e of errors) console.error(`error    ${e}`);

if (errors.length) {
  console.error(`\n${errors.length} problem(s) in src/lib/releases.ts`);
  process.exit(1);
}
console.log(`releases.ts is consistent: ${releases.length} releases, newest ${releases[0]?.version}${warnings.length ? `, ${warnings.length} warning(s)` : ''}`);
