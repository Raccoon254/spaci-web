import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergePatch, parseIsoDate, validateNotice, validateReleaseExtras } from '../src/lib/server/notice-validation';
import type { NoticeRow } from '../src/lib/notices';

const NOW = new Date('2026-10-01T12:00:00Z');
const base = { severity: 'info', title: 'Hello' };
const errs = (input: unknown) => {
  const r = validateNotice(input, NOW);
  return r.ok ? [] : r.errors;
};
const has = (input: unknown, re: RegExp) => assert.ok(errs(input).some((e) => re.test(e)), `${JSON.stringify(input)} -> ${errs(input)}`);

test('minimal notice gets defaults', () => {
  const r = validateNotice(base, NOW);
  assert.ok(r.ok);
  assert.equal(r.value.kind, 'announcement');
  assert.equal(r.value.startsAt.getTime(), NOW.getTime());
  assert.equal(r.value.endsAt, null);
  assert.equal(r.value.dismissible, true);
  assert.deepEqual(r.value.platforms, []);
});

test('critical is not dismissible by default but can be overridden', () => {
  const r = validateNotice({ ...base, severity: 'critical' }, NOW);
  assert.ok(r.ok && r.value.dismissible === false);
  const r2 = validateNotice({ ...base, severity: 'critical', dismissible: true }, NOW);
  assert.ok(r2.ok && r2.value.dismissible === true);
});

test('enums, lengths and types', () => {
  has({ ...base, severity: 'urgent' }, /severity/);
  has({ ...base, kind: 'promo' }, /kind/);
  has({ ...base, title: '' }, /title is required/);
  has({ ...base, title: '   ' }, /title is required/);
  has({ ...base, title: 'x'.repeat(81) }, /title must be at most 80/);
  has({ ...base, title: 'a\nb' }, /control/);
  has({ ...base, summary: 'x'.repeat(201) }, /summary/);
  has({ ...base, body: 'x'.repeat(50_001) }, /body/);
  has({ ...base, body: 42 }, /body must be a string/);
  has({ ...base, dismissible: 'yes' }, /dismissible/);
  has({ ...base, extra: 1 }, /unknown field: extra/);
  has(null, /JSON object/);
  has([], /JSON object/);
});

test('cta must be https', () => {
  has({ ...base, cta: { label: 'Go', url: 'http://example.com' } }, /cta.url/);
  has({ ...base, cta: { label: 'Go', url: 'javascript:alert(1)' } }, /cta.url/);
  has({ ...base, cta: { label: '', url: 'https://example.com' } }, /cta.label/);
  has({ ...base, cta: 'https://example.com' }, /cta must be/);
  const r = validateNotice({ ...base, cta: { label: 'Go', url: 'https://example.com' } }, NOW);
  assert.ok(r.ok && r.value.ctaUrl === 'https://example.com/' && r.value.ctaLabel === 'Go');
});

test('media must be allowlisted https with alt text', () => {
  has({ ...base, media: [{ url: 'https://evil.com/a.png', alt: 'x' }] }, /media\[0\].url/);
  has({ ...base, media: [{ url: 'data:image/png;base64,AA', alt: 'x' }] }, /media\[0\].url/);
  has({ ...base, media: [{ url: 'https://spaci.kentom.co.ke/a.png' }] }, /media\[0\].alt/);
  has({ ...base, media: 'x' }, /media must be an array/);
  has({ ...base, media: Array(13).fill({ url: 'https://spaci.kentom.co.ke/a.png', alt: 'a' }) }, /at most 12/);
  assert.ok(validateNotice({ ...base, media: [{ url: 'https://spaci.kentom.co.ke/a.png', alt: 'a' }] }, NOW).ok);
});

test('version rules by kind', () => {
  has({ ...base, kind: 'release' }, /version is required/);
  has({ ...base, kind: 'release', version: '2.3' }, /version must be a semver/);
  has({ ...base, version: '2.3.0' }, /empty for an announcement/);
  const r = validateNotice({ ...base, kind: 'release', version: 'v2.3.0' }, NOW);
  assert.ok(r.ok && r.value.version === '2.3.0');
});

test('audience validation', () => {
  has({ ...base, audience: { platforms: ['mac', 'amiga'] } }, /platforms/);
  has({ ...base, audience: { platforms: 'mac' } }, /platforms/);
  has({ ...base, audience: { minVersion: 'x' } }, /minVersion/);
  has({ ...base, audience: { minVersion: '2.3.0', maxVersion: '2.2.0' } }, /not be greater/);
  has({ ...base, audience: { os: 'mac' } }, /audience.os/);
  const r = validateNotice({ ...base, audience: { platforms: ['mac', 'mac', 'linux'], minVersion: '2.0.0-beta.1', maxVersion: '2.2.0' } }, NOW);
  assert.ok(r.ok);
  assert.deepEqual(r.value.platforms, ['mac', 'linux']);
});

test('ISO dates and window order', () => {
  assert.ok(parseIsoDate('2026-10-01'));
  assert.ok(parseIsoDate('2026-10-01T09:00:00Z'));
  assert.ok(parseIsoDate('2026-10-01T09:00:00.123+03:00'));
  assert.ok(parseIsoDate('2026-10-01T09:00Z'));
  for (const bad of ['2026-10-01T09:00:00', '2026-02-30', '2026-13-01', '10/01/2026', 'tomorrow', '2026-10-01 09:00:00Z', '1999-01-01', ''])
    assert.equal(parseIsoDate(bad), null, bad);
  has({ ...base, startsAt: 'soon' }, /startsAt/);
  has({ ...base, endsAt: '2026-10-01T09:00:00' }, /endsAt must be an ISO/);
  has({ ...base, startsAt: '2026-10-02T00:00:00Z', endsAt: '2026-10-01T00:00:00Z' }, /endsAt must be after/);
  has({ ...base, startsAt: '2026-10-02T00:00:00Z', endsAt: '2026-10-02T00:00:00Z' }, /endsAt must be after/);
  const r = validateNotice({ ...base, startsAt: '2026-10-02T00:00:00Z', endsAt: '2026-10-03T00:00:00+03:00' }, NOW);
  assert.ok(r.ok && r.value.endsAt!.toISOString() === '2026-10-02T21:00:00.000Z');
});

test('PATCH merges onto the stored row before validating', () => {
  const stored: NoticeRow = {
    id: 'abc12345',
    kind: 'announcement',
    severity: 'info',
    title: 'Old',
    summary: '',
    body: '',
    media: null,
    ctaLabel: null,
    ctaUrl: null,
    version: null,
    platforms: ['mac'],
    minVersion: null,
    maxVersion: null,
    startsAt: new Date('2026-10-05T00:00:00Z'),
    endsAt: new Date('2026-10-10T00:00:00Z'),
    dismissible: true,
    publishedAt: NOW,
    updatedAt: NOW
  };
  const ok = validateNotice(mergePatch(stored, { id: 'abc12345', title: 'New' }), NOW);
  assert.ok(ok.ok && ok.value.title === 'New' && ok.value.platforms[0] === 'mac');
  assert.equal(ok.ok && ok.value.startsAt.toISOString(), '2026-10-05T00:00:00.000Z');
  const bad = validateNotice(mergePatch(stored, { endsAt: '2026-10-04T00:00:00Z' }), NOW);
  assert.ok(!bad.ok && bad.errors.some((e) => /after startsAt/.test(e)));
  assert.equal(mergePatch(stored, 'x'), null);
});

test('release extras: valid fields kept, invalid dropped with warnings', () => {
  const { value, warnings } = validateReleaseExtras({
    highlight: 'Faster scans',
    notes: '# 2.3.0\n\nText',
    media: [
      { src: 'https://raw.githubusercontent.com/Raccoon254/spaci/v2.3.0/changelog/media/a.png', alt: 'A' },
      { src: 'changelog/media/b.png', alt: 'not rewritten' },
      { src: 'https://raw.githubusercontent.com/Raccoon254/spaci/v2.3.0/c.png' }
    ],
    links: [
      { label: 'Docs', url: 'https://spaci.kentom.co.ke/docs' },
      { label: 'Bad', url: 'http://x.example' },
      { label: 'Js', url: 'javascript:alert(1)' }
    ],
    notice: { severity: 'update', endsInDays: 14 }
  });
  assert.equal(value.highlight, 'Faster scans');
  assert.equal(value.notes, '# 2.3.0\n\nText');
  assert.equal(value.media.length, 1);
  assert.deepEqual(value.links, [{ label: 'Docs', url: 'https://spaci.kentom.co.ke/docs' }]);
  assert.deepEqual(value.notice, { severity: 'update', title: null, summary: null, cta: null, endsInDays: 14 });
  assert.equal(warnings.length, 4, warnings.join('\n'));
});

test('release extras: bad highlight and notice are dropped, never thrown', () => {
  const { value, warnings } = validateReleaseExtras({
    highlight: 'x'.repeat(161),
    notice: { severity: 'loud', endsInDays: 0, cta: { label: 'Go', url: 'http://x' } }
  });
  assert.equal(value.highlight, null);
  assert.equal(value.notice, null);
  assert.ok(warnings.some((w) => /highlight/.test(w)));
  assert.ok(warnings.some((w) => /notice.severity/.test(w)));
  assert.ok(warnings.some((w) => /endsInDays/.test(w)));
  assert.ok(warnings.some((w) => /cta.url/.test(w)));
  assert.deepEqual(validateReleaseExtras({}), { value: { highlight: null, notes: null, media: [], links: [], notice: null }, warnings: [] });
});

// The desktop release validator (scripts/changelog-lib.mjs) accepts up to 12
// media, CTA labels up to 80 chars and a notes file up to 200 KB. Whatever it
// accepts must publish here, since sync-feed does not print warnings.
test('release extras: limits match the desktop release validator', () => {
  const media = Array.from({ length: 12 }, (_, i) => ({
    src: `https://raw.githubusercontent.com/Raccoon254/spaci/v2.3.0/changelog/media/${i}.png`,
    alt: `shot ${i}`
  }));
  const { value, warnings } = validateReleaseExtras({
    media,
    notes: '# Notes\n\n' + 'word '.repeat(12_000),
    notice: { severity: 'update', cta: { label: 'L'.repeat(80), url: 'https://spaci.kentom.co.ke/download' } }
  });
  assert.equal(value.media.length, 12);
  assert.ok(value.notice && value.notice.cta && value.notice.cta.label.length === 80);
  assert.ok(value.notes && value.notes.length === 50_000, 'long notes are truncated, not dropped');
  assert.deepEqual(warnings, ['notes longer than 50000 characters; truncated']);
});

test('admin notices accept an 80 char CTA label and a 50,000 char body', () => {
  const r = validateNotice(
    { ...base, body: 'x'.repeat(50_000), cta: { label: 'L'.repeat(80), url: 'https://spaci.kentom.co.ke/' } },
    NOW
  );
  assert.ok(r.ok, r.ok ? '' : r.errors.join(', '));
  has({ ...base, cta: { label: 'L'.repeat(81), url: 'https://spaci.kentom.co.ke/' } }, /cta.label must be at most 80/);
});
