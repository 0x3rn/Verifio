import assert from 'node:assert/strict';
import {
  buildTextVerifiedRentalPayload,
  type TextVerifiedRentalRequest,
} from '../lib/textverified.ts';
import { TEXTVERIFIED_RENTAL_DURATIONS } from '../lib/types.ts';

const fixedTerm: TextVerifiedRentalRequest = {
  allowBackOrderReservations: false,
  duration: 'threeDay',
  isRenewable: false,
  numberType: 'mobile',
  serviceName: 'discord',
  capability: 'sms',
  alwaysOn: false,
  areaCodeSelectOption: ['212'],
  billingCycleIdToAssignTo: null,
};

assert.deepEqual(buildTextVerifiedRentalPayload(fixedTerm), {
  allowBackOrderReservations: false,
  duration: 'threeDay',
  isRenewable: false,
  numberType: 'mobile',
  serviceName: 'discord',
  capability: 'sms',
  alwaysOn: false,
  areaCodeSelectOption: ['212'],
  billingCycleIdToAssignTo: null,
});

assert.deepEqual(TEXTVERIFIED_RENTAL_DURATIONS.map((item) => item.value), [
  'oneDay', 'threeDay', 'sevenDay', 'fourteenDay', 'thirtyDay', 'ninetyDay', 'oneYear',
]);
assert.deepEqual(TEXTVERIFIED_RENTAL_DURATIONS.filter((item) => !item.renewable).map((item) => item.days), [1, 3, 7, 14]);
assert.deepEqual(TEXTVERIFIED_RENTAL_DURATIONS.filter((item) => item.renewable).map((item) => item.days), [30, 90, 365]);

const allServices: TextVerifiedRentalRequest = { ...fixedTerm, duration: 'thirtyDay', isRenewable: true, serviceName: 'allservices', alwaysOn: true, areaCodeSelectOption: [] };
const allServicesPayload = buildTextVerifiedRentalPayload(allServices);
assert.equal(allServicesPayload.serviceName, 'allservices');
assert.equal(allServicesPayload.isRenewable, true);
assert.equal(allServicesPayload.alwaysOn, true);
assert.equal(allServicesPayload.areaCodeSelectOption, null);

console.log('TextVerified rental contract checks passed.');
