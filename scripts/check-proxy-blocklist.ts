import assert from 'node:assert/strict';
import { checkProxyBlocklist, normalizeProxyBlocklistTarget } from '../lib/proxyapp.ts';

assert.equal(normalizeProxyBlocklistTarget('  example.com  '), 'example.com');
assert.equal(normalizeProxyBlocklistTarget('https://example.com/login'), 'https://example.com/login');
assert.throws(() => normalizeProxyBlocklistTarget(''), /domain or URL/i);
assert.throws(() => normalizeProxyBlocklistTarget('ftp://example.com'), /http\(s\) URL/i);
assert.throws(() => normalizeProxyBlocklistTarget('https://user:pass@example.com'), /http\(s\) URL/i);

const result = await checkProxyBlocklist('example.com');
assert.equal(typeof result.blocked, 'boolean');
assert.equal(result.domain, 'example.com');
assert.equal(typeof result.message, 'string');

console.log(JSON.stringify({ ok: true, domain: result.domain, blocked: result.blocked }));
