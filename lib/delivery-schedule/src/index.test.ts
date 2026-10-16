import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDeliverySchedule } from './index';

const cases = [
  ['2026-10-04T12:00:00+01:00', '2026-10-07'],
  ['2026-10-05T12:00:00+01:00', '2026-10-07'],
  ['2026-10-06T17:59:59.999+01:00', '2026-10-07'],
  ['2026-10-06T18:00:00+01:00', '2026-10-10'],
  ['2026-10-07T00:00:00+01:00', '2026-10-10'],
  ['2026-10-08T12:00:00+01:00', '2026-10-10'],
  ['2026-10-09T17:59:59.999+01:00', '2026-10-10'],
  ['2026-10-09T18:00:00+01:00', '2026-10-14'],
  ['2026-10-10T12:00:00+01:00', '2026-10-14'],
  ['2026-10-06T17:00:00Z', '2026-10-10'],
  ['2026-10-09T09:59:59.999-07:00', '2026-10-10'],
  ['2026-10-09T10:00:00-07:00', '2026-10-14'],
  ['2026-12-29T18:00:00+01:00', '2027-01-02'],
  ['2027-01-01T18:00:00+01:00', '2027-01-06'],
];
for (const [paymentTime, deliveryDate] of cases) {
  test(`${paymentTime} schedules ${deliveryDate}`, () => {
    assert.equal(getDeliverySchedule(paymentTime).deliveryDate, deliveryDate);
  });
}
test('provides the date and Nigeria-time cutoff labels', () => {
  const schedule = getDeliverySchedule('2026-10-06T16:00:00Z');
  assert.equal(schedule.deliveryLabel, 'Wednesday, 7 October 2026');
  assert.equal(schedule.cutoffLabel, 'Tuesday, 6 October 2026 at 6pm WAT');
  assert.equal(schedule.cutoffAt, '2026-10-06T17:00:00.000Z');
});
test('rejects missing, invalid, and timezone-ambiguous payment times', () => {
  for (const value of ['', 'invalid', '2026-10-06T17:00:00']) {
    assert.throws(() => getDeliverySchedule(value));
  }
  assert.throws(() => getDeliverySchedule(new Date(NaN)));
});
