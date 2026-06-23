// Push the newest release from src/lib/releases.ts into Neon by POSTing it to
// the running site's /api/releases endpoint. Mirrors what pixen-cloud's
// notify-release.sh does, but writes to our own DB instead of an email API.
//
//   SITE=https://spaci.kentom.co.ke RELEASE_PUBLISH_SECRET=xxx \
//     npx tsx scripts/notify-release.ts
//
// The rendered site reads from releases.ts directly, so this step is only
// needed to keep the DB-backed endpoints (analytics, subscribers) in sync.

import { releases } from '../src/lib/releases';

const site = process.env.SITE || 'http://localhost:5173';
const secret = process.env.RELEASE_PUBLISH_SECRET;
if (!secret) {
  console.error('RELEASE_PUBLISH_SECRET is required');
  process.exit(1);
}

const latest = releases[0];
const res = await fetch(`${site}/api/releases`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-publish-secret': secret },
  body: JSON.stringify(latest)
});

if (!res.ok) {
  console.error(`publish failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
console.log(`published ${latest.version} to ${site}`);
