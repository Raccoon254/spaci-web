import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isActive, matchesAudience, noticeStatus, parseClient, selectNotices, toNotice, type NoticeRow } from '../src/lib/notices';

const NOW = new Date('2026-10-01T12:00:00Z');
let n = 0;
function row(p: Partial<NoticeRow> = {}): NoticeRow {
  n++;
  return {
    id: `id${String(n).padStart(4, '0')}`,
    kind: 'announcement',
    severity: 'info',
    title: `Notice ${n}`,
    summary: '',
    body: '',
    media: null,
    ctaLabel: null,
    ctaUrl: null,
    version: null,
    platforms: [],
    minVersion: null,
    maxVersion: null,
    startsAt: new Date('2026-09-01T00:00:00Z'),
    endsAt: null,
    dismissible: true,
    publishedAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-09-01T00:00:00Z'),
    ...p
  };
}
const c = (v: string | null, p: string | null) => parseClient(v, p);

test('active window is startsAt <= now < endsAt', () => {
  assert.ok(isActive(row({ startsAt: NOW }), NOW));
  assert.ok(!isActive(row({ startsAt: new Date(NOW.getTime() + 1) }), NOW));
  assert.ok(!isActive(row({ endsAt: NOW }), NOW));
  assert.ok(isActive(row({ endsAt: new Date(NOW.getTime() + 1) }), NOW));
  assert.equal(noticeStatus(row({ startsAt: new Date('2027-01-01T00:00:00Z') }), NOW), 'scheduled');
  assert.equal(noticeStatus(row(), NOW), 'live');
  assert.equal(noticeStatus(row({ endsAt: new Date('2026-09-15T00:00:00Z') }), NOW), 'expired');
});

test('platform filtering', () => {
  const mac = row({ platforms: ['mac'] });
  assert.ok(matchesAudience(mac, c('2.3.0', 'mac')));
  assert.ok(matchesAudience(mac, c('2.3.0', 'MAC')));
  assert.ok(!matchesAudience(mac, c('2.3.0', 'windows')));
  assert.ok(!matchesAudience(mac, c('2.3.0', null)));
  assert.ok(!matchesAudience(mac, c('2.3.0', 'amiga')));
  assert.ok(matchesAudience(row(), c(null, null)), 'unrestricted matches unknown clients');
});

test('version range is inclusive with prerelease precedence', () => {
  const r = row({ minVersion: '2.1.0', maxVersion: '2.2.0' });
  assert.ok(matchesAudience(r, c('2.1.0', 'mac')));
  assert.ok(matchesAudience(r, c('2.2.0', 'mac')));
  assert.ok(matchesAudience(r, c('v2.1.5', 'mac')));
  assert.ok(!matchesAudience(r, c('2.0.9', 'mac')));
  assert.ok(!matchesAudience(r, c('2.2.1', 'mac')));
  // Prereleases sort before their release.
  assert.ok(!matchesAudience(r, c('2.1.0-beta.1', 'mac')));
  assert.ok(matchesAudience(r, c('2.2.0-rc.1', 'mac')));
  assert.ok(!matchesAudience(r, c('2.2.1-beta.1', 'mac')), '2.2.1-beta.1 is above 2.2.0');
  // Unknown or invalid client versions never match a bounded notice.
  assert.ok(!matchesAudience(r, c(null, 'mac')));
  assert.ok(!matchesAudience(r, c('garbage', 'mac')));
  // A stored bound that does not parse fails closed.
  assert.ok(!matchesAudience(row({ maxVersion: 'nope' }), c('1.0.0', 'mac')));
});

test('release notice targets users on the previous release or older', () => {
  const r = row({ kind: 'release', version: '2.3.0', maxVersion: '2.2.0' });
  assert.ok(matchesAudience(r, c('2.2.0', 'linux')));
  assert.ok(matchesAudience(r, c('1.0.0', 'windows')));
  assert.ok(!matchesAudience(r, c('2.3.0', 'mac')));
  assert.ok(!matchesAudience(r, c('2.3.0-beta.2', 'mac')), 'beta testers of 2.3.0 are past 2.2.0');
});

test('selectNotices: active, matching, newest first, capped at 20', () => {
  const rows: NoticeRow[] = [];
  for (let i = 0; i < 30; i++) rows.push(row({ startsAt: new Date(Date.UTC(2026, 8, 1 + i)) }));
  rows.push(row({ startsAt: new Date('2026-12-01T00:00:00Z') })); // scheduled
  rows.push(row({ endsAt: new Date('2026-09-02T00:00:00Z') })); // expired
  rows.push(row({ platforms: ['windows'] }));
  const out = selectNotices(rows, c('2.3.0', 'mac'), NOW);
  assert.equal(out.length, 20);
  assert.equal(out[0].startsAt.toISOString(), '2026-09-30T00:00:00.000Z');
  for (let i = 1; i < out.length; i++) assert.ok(out[i - 1].startsAt >= out[i].startsAt);
  assert.ok(out.every((r) => r.platforms.length === 0));
});

test('toNotice re-sanitizes on the way out', () => {
  const out = toNotice(
    row({
      body: '# Hi\n\n<script>alert(1)</script>[x](javascript:alert(1))',
      media: [{ url: 'https://evil.com/a.png', alt: 'x' }, { url: 'https://spaci.kentom.co.ke/a.png', alt: 'ok' }],
      ctaLabel: 'Go',
      ctaUrl: 'http://insecure.example',
      platforms: ['mac', 'bogus'],
      maxVersion: '2.2.0'
    })
  );
  assert.deepEqual(out.body[0], { t: 'h', level: 2, c: [{ t: 'text', v: 'Hi' }] });
  assert.ok(!JSON.stringify(out.body).includes('javascript'));
  assert.ok(!JSON.stringify(out.body).includes('script'));
  assert.deepEqual(out.media, [{ url: 'https://spaci.kentom.co.ke/a.png', alt: 'ok' }]);
  assert.equal(out.cta, null);
  assert.deepEqual(out.audience, { platforms: ['mac'], maxVersion: '2.2.0' });
  assert.equal(typeof out.startsAt, 'string');
  assert.equal(out.endsAt, null);
});
