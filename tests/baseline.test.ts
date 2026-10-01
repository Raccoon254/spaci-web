import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyToSource, filesFromFeeds, parseYml, summaryFrom } from '../scripts/baseline-lib';
import type { Release } from '../src/lib/releases';

const mac = `version: 2.3.0
files:
  - url: Spaci-2.3.0-arm64-mac.zip
    sha512: AAA==
    size: 93173187
  - url: Spaci-2.3.0-arm64-mac.zip.blockmap
    sha512: BBB==
    size: 10
path: Spaci-2.3.0-arm64-mac.zip
sha512: AAA==
`;

test('feed files are classified and blockmaps dropped', () => {
  assert.equal(parseYml(mac).version, '2.3.0');
  const files = filesFromFeeds([mac]);
  assert.deepEqual(files, [
    { platform: 'mac', arch: 'Apple Silicon', file: 'Spaci-2.3.0-arm64-mac.zip', size: '89 MB', bytes: 93173187, sha512: 'AAA==' }
  ]);
});

test('summary skips headings and strips emphasis', () => {
  assert.equal(summaryFrom({ tag_name: 'v1.0.0', name: 'Spaci 1.0.0', body: '**One confirm.**\n\n# Spaci 1' }), 'One confirm.');
  assert.equal(summaryFrom({ tag_name: 'v1.0.0', name: 'Spaci 1.0.0', body: '' }), 'Spaci 1.0.0');
});

test('applyToSource prepends and demotes Latest', () => {
  const src = "x\nexport const releases: Release[] = [\n  {\n    version: '1.0.0',\n    tag: 'Latest',\n  }\n];\n";
  const r: Release = { version: "2.0.0", date: '2026-01-01', tag: 'x', major: false, summary: "it's new", added: [], improved: [], fixed: [], files: filesFromFeeds([mac]) };
  const out = applyToSource(src, [r]);
  assert.match(out, /version: '2\.0\.0'[\s\S]*tag: 'Latest'[\s\S]*version: '1\.0\.0',\n    tag: 'Release'/);
  assert.match(out, /summary: 'it\\'s new'/);
  assert.equal(applyToSource(src, []), src);
});
