import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadAdminOrderDeliveryStatuses } from './adminOrderDeliveryStatus';

test('keeps confirmed orders available when delivery status storage is unavailable', async () => {
  const orders = [{ reference: 'burst-one', customerName: 'Sharon' }];
  const result = await loadAdminOrderDeliveryStatuses(orders, async () => {
    throw new Error('database unavailable');
  });

  assert.equal(result.deliveryTrackingAvailable, false);
  assert.equal(result.orders.length, 1);
  assert.equal(result.orders[0].customerName, 'Sharon');
  assert.equal(result.orders[0].deliveredAt, null);
  assert.match(String(result.error), /database unavailable/);
});

test('maps persisted delivery dates onto confirmed orders', async () => {
  const paidAt = new Date('2026-09-30T12:00:00.000Z');
  const result = await loadAdminOrderDeliveryStatuses(
    [{ reference: 'burst-one' }],
    async () => [{ reference: 'burst-one', deliveredAt: paidAt }],
  );

  assert.equal(result.deliveryTrackingAvailable, true);
  assert.equal(result.orders[0].deliveredAt, paidAt.toISOString());
  assert.equal(result.error, null);
});