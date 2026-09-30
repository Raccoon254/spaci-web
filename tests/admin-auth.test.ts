import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAdminRequest } from '../src/lib/server/admin-path';
import { basicOk, bearerOk } from '../src/lib/server/analytics';

test('isAdminRequest: plain admin paths', () => {
  assert.equal(isAdminRequest('/admin', null), true);
  assert.equal(isAdminRequest('/admin/notices', '/admin/notices'), true);
  assert.equal(isAdminRequest('/admin/notices/abc/__data.json', '/admin/notices/[id]'), true);
  assert.equal(isAdminRequest('/', '/'), false);
  assert.equal(isAdminRequest('/changelog', '/changelog'), false);
  assert.equal(isAdminRequest('/api/admin/notices', '/api/admin/notices'), false);
});

test('isAdminRequest: encoded and odd paths cannot skip the check', () => {
  // The router decodes %61 to a, so this reaches /admin/notices.
  assert.equal(isAdminRequest('/%61dmin/notices', '/admin/notices'), true);
  // Even without a matched route, the decoded path is checked.
  assert.equal(isAdminRequest('/%61dmin/notices', null), true);
  assert.equal(isAdminRequest('/%41DMIN/stats', null), true);
  assert.equal(isAdminRequest('//admin/notices', null), true);
  assert.equal(isAdminRequest('/%2fadmin', null), true);
  // Undecodable: fail closed.
  assert.equal(isAdminRequest('/%E0%A4%A', null), true);
});

const b64 = (s: string) => Buffer.from(s).toString('base64');

test('basicOk and bearerOk: right secret only, closed when unset', async () => {
  assert.equal(await basicOk(`Basic ${b64('any:s3cret')}`, 's3cret'), true);
  assert.equal(await basicOk(`Basic ${b64('any:wrong')}`, 's3cret'), false);
  assert.equal(await basicOk(`Basic ${b64('s3cret')}`, 's3cret'), false);
  assert.equal(await basicOk(`Basic ${b64('any:')}`, ''), false);
  assert.equal(await basicOk(`Basic ${b64('any:x')}`, undefined), false);
  assert.equal(await basicOk(`Bearer s3cret`, 's3cret'), false);
  assert.equal(await bearerOk('Bearer s3cret', 's3cret'), true);
  assert.equal(await bearerOk('Bearer s3cre', 's3cret'), false);
  assert.equal(await bearerOk('Bearer ', ''), false);
  assert.equal(await bearerOk(`Basic ${b64('any:s3cret')}`, 's3cret'), false);
  assert.equal(await bearerOk(null, 's3cret'), false);
});
