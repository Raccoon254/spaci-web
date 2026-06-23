#!/usr/bin/env node
// Print the base64 sha512 and byte size of one or more built installers.
// Paste these into the matching ReleaseFile entries in src/lib/releases.ts so
// the electron-updater feed (/updates/latest-*.yml) can verify downloads.
//
//   node scripts/sha512.mjs ../../dev-cleaner-electron/release/Spaci-1.2.0-arm64.dmg
//
// electron-builder also writes these values into its own latest-*.yml during a
// build, this script is a convenience for filling releases.ts by hand.

import { createHash } from 'node:crypto';
import { createReadStream, statSync } from 'node:fs';
import { basename } from 'node:path';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node scripts/sha512.mjs <installer> [<installer> ...]');
  process.exit(1);
}

for (const f of files) {
  const bytes = statSync(f).size;
  const hash = createHash('sha512');
  await new Promise((resolve, reject) => {
    createReadStream(f).on('data', (d) => hash.update(d)).on('end', resolve).on('error', reject);
  });
  const sha512 = hash.digest('base64');
  console.log(`\n${basename(f)}`);
  console.log(`  bytes:  ${bytes}`);
  console.log(`  sha512: ${sha512}`);
}
console.log('');
