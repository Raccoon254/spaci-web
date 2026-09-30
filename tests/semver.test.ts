import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareSemver, normalizeSemver, parseSemver, previousVersion } from '../src/lib/semver';

test('parse and normalize', () => {
  assert.equal(normalizeSemver('v2.3.0'), '2.3.0');
  assert.equal(normalizeSemver('2.3.0-beta.1+build.5'), '2.3.0-beta.1');
  for (const bad of ['2.3', '2.3.0.1', '02.3.0', '2.3.0-', '2.3.0-01', 'latest', '', ' ', '1.2.3-a..b'])
    assert.equal(parseSemver(bad), null, bad);
  assert.equal(parseSemver(undefined), null);
});

test('ordering follows semver precedence', () => {
  const sorted = [
    '1.0.0-alpha',
    '1.0.0-alpha.1',
    '1.0.0-alpha.beta',
    '1.0.0-beta',
    '1.0.0-beta.2',
    '1.0.0-beta.11',
    '1.0.0-rc.1',
    '1.0.0',
    '1.0.1',
    '1.2.0',
    '1.10.0',
    '2.0.0'
  ];
  for (let i = 0; i < sorted.length - 1; i++) {
    assert.equal(compareSemver(sorted[i], sorted[i + 1]), -1, `${sorted[i]} < ${sorted[i + 1]}`);
    assert.equal(compareSemver(sorted[i + 1], sorted[i]), 1);
  }
  assert.equal(compareSemver('2.3.0', 'v2.3.0+meta'), 0);
  assert.throws(() => compareSemver('x', '1.0.0'));
});

test('previousVersion picks the highest lower version', () => {
  const vs = ['2.1.0', '2.0.1', '2.0.0', '1.2.0', 'junk', '2.3.0', '2.2.0-beta.1'];
  assert.equal(previousVersion('2.3.0', vs), '2.2.0-beta.1');
  assert.equal(previousVersion('2.2.0', vs), '2.2.0-beta.1');
  assert.equal(previousVersion('2.1.0', vs), '2.0.1');
  assert.equal(previousVersion('1.2.0', vs), null);
  assert.equal(previousVersion('bad', vs), null);
});
