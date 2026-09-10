import assert from 'node:assert/strict';
import { calculateProxyExtensionPrice, calculateProxyPricing } from '../lib/smspool.ts';

assert.deepEqual(calculateProxyPricing(12, 5), { displayPrice: 18, ratePerGb: 3.6 });
assert.deepEqual(calculateProxyPricing(2, 0.5), { displayPrice: 3, ratePerGb: 6 });
assert.equal(calculateProxyExtensionPrice(18), 9);
assert.equal(calculateProxyExtensionPrice(4.5), 2.25);
assert.throws(() => calculateProxyPricing(0, 1), /base price/i);
assert.throws(() => calculateProxyPricing(12, 0), /bandwidth/i);
assert.throws(() => calculateProxyPricing(Number.NaN, 1), /base price/i);
assert.throws(() => calculateProxyExtensionPrice(0), /package price/i);
assert.throws(() => calculateProxyExtensionPrice(Number.NaN), /package price/i);

console.log(JSON.stringify({ ok: true, fiveGbProviderTotal: 12, fiveGbVerifioTotal: 18, fiveGbVerifioRate: 3.6, fiveGbExtensionPrice: 9 }));
