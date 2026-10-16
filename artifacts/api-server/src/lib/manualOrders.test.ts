import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, test, mock } from 'node:test';
import nodemailer from 'nodemailer';
import { eq } from 'drizzle-orm';
import { db, pool, orderConfirmationTable, type ManualOrder } from '@workspace/db';
import { parseManualOrder, parseManualPayment, deliveryDateFor, manualOrderResult } from './manualOrders';
import { sendOrderConfirmation, sendPaidOrderConfirmation } from './orderConfirmation';

const now = new Date('2026-10-13T18:00:00Z');
const input = () => ({
  requestId: randomUUID(), customerName: 'Manual Test', email: 'manual-test@example.invalid',
  phone: '+2348000000000', address: 'Test address only', state: 'Abuja',
  lineItems: [{ flavor: 'salted-caramel', quantity: 2 }],
  totalNaira: 18500, paymentMethod: 'bank-transfer', paymentStatus: 'paid',
  paidAt: '2026-10-13T17:59:00+01:00', deliveryDate: null, sendConfirmation: true,
});
const references: string[] = [];
const reference = () => { const id = `manual-${randomUUID()}`; references.push(id); return id; };
const proof = () => ({
  reference: reference(), amountKobo: 1850000, customerName: 'Manual Test',
  phone: '+2348000000000', address: 'Test address only', state: 'Abuja', items: '2 × Salted Caramel',
});
after(async () => {
  for (const ref of references) await db.delete(orderConfirmationTable).where(eq(orderConfirmationTable.reference, ref));
  await pool.end();
});

test('manual dates use the actual WAT payment time and exact cutoff', () => {
  assert.equal(parseManualOrder(input(), now).deliveryDate, '2026-10-14');
  assert.equal(parseManualOrder({ ...input(), paidAt: '2026-10-13T18:00:00+01:00' }, now).deliveryDate, '2026-10-17');
  assert.equal(parseManualOrder({ ...input(), deliveryDate: '2026-10-20' }, now).deliveryDate, '2026-10-20');
});

test('pending orders cannot send payment confirmations or carry payment timestamps', () => {
  const pending = { ...input(), paymentStatus: 'pending', paidAt: null, sendConfirmation: false };
  assert.equal(parseManualOrder(pending, now).paidAt, null);
  assert.throws(() => parseManualOrder({ ...pending, sendConfirmation: true }, now), /unpaid/);
  assert.throws(() => parseManualOrder({ ...pending, paidAt: input().paidAt }, now), /unpaid/);
});

test('validates contact details, integer total, quantities, duplicate flavours and unavailable cheese', () => {
  for (const patch of [
    { email: 'invalid' }, { phone: 'not a phone' }, { customerName: '  ' },
    { totalNaira: 0 }, { totalNaira: 1.5 },
    { lineItems: [{ flavor: 'caramel-cheese', quantity: 1 }] },
    { lineItems: [{ flavor: 'peanut-brittle', quantity: 0 }] },
    { lineItems: [{ flavor: 'peanut-brittle', quantity: 1.2 }] },
    { lineItems: [{ flavor: 'peanut-brittle', quantity: 1 }, { flavor: 'peanut-brittle', quantity: 2 }] },
  ]) assert.throws(() => parseManualOrder({ ...input(), ...patch }, now));
});

test('rejects ambiguous, future and invalid calendar dates, and delivery before payment', () => {
  for (const paidAt of ['2026-10-13T18:00', 'bad', '2026-10-14T15:00:00Z', '2026-02-30T12:00:00Z']) {
    assert.throws(() => parseManualOrder({ ...input(), paidAt }, now));
  }
  for (const date of ['2026-02-30', '13/10/2026', '2026-10-12']) {
    assert.throws(() => deliveryDateFor(date, now));
  }
  assert.equal(parseManualPayment({ paidAt: input().paidAt, sendConfirmation: false }, now).paidAt.toISOString(), '2026-10-13T16:59:00.000Z');
});

test('normalizes a draft consistently for idempotent retries', () => {
  const data = input();
  assert.equal(parseManualOrder(data, now).fingerprint, parseManualOrder(data, new Date(now.getTime() + 60000)).fingerprint);
  assert.notEqual(parseManualOrder(data, now).fingerprint, parseManualOrder({ ...data, totalNaira: 20000 }, now).fingerprint);
});

test('outside confirmation uses the agreed delivery date and deduplicates concurrent sends', async () => {
  let sent = 0;
  const stub = mock.method(nodemailer, 'createTransport', () => ({
    sendMail: async (message: { to: string; text: string; html: string }) => {
      sent++;
      assert.match(message.text, /Tuesday, 20 October 2026/);
      assert.match(message.html, /Tuesday, 20 October 2026/);
      return { accepted: [message.to] };
    },
  }));
  try {
    const order = proof();
    const results = await Promise.all([1, 2].map(() =>
      sendOrderConfirmation(order, 'manual-test@example.invalid', input().paidAt!, '2026-10-20')));
    assert.equal(sent, 1);
    assert.ok(results.includes('sent'));
    assert.equal(await sendOrderConfirmation(order, 'manual-test@example.invalid', input().paidAt!, '2026-10-20'), 'already-sent');
    assert.equal(sent, 1);
  } finally { stub.mock.restore(); }
});

test('manual email failure leaves saved order usable and can be retried', async () => {
  let fail = true;
  const stub = mock.method(nodemailer, 'createTransport', () => ({
    sendMail: async (message: { to: string }) => {
      if (fail) throw new Error('Simulated SMTP rejection');
      return { accepted: [message.to] };
    },
  }));
  try {
    const data = input();
    const row: ManualOrder = {
      ...data, reference: reference(), creationFingerprint: 'test', paidAt: new Date(data.paidAt!),
      deliveryDate: '2026-10-20', deliveryDateOverridden: true, createdBy: 'test-only',
      createdAt: now,
    };
    const result = await manualOrderResult(row, true);
    assert.equal(result.emailStatus, 'failed');
    assert.equal(result.order.paymentStatus, 'paid');
    assert.equal(result.order.confirmationStatus, 'failed');
    fail = false;
    assert.equal((await manualOrderResult(row, true)).emailStatus, 'sent');
    assert.equal((await manualOrderResult(row, true)).emailStatus, 'already-sent');
    await assert.rejects(() => manualOrderResult({ ...row, paymentStatus: 'pending', paidAt: null }, true), /payment/);
    assert.equal((await manualOrderResult({ ...row, reference: reference(), paymentStatus: 'pending', paidAt: null }, false)).emailStatus, 'not-requested');
  } finally { stub.mock.restore(); }
});

test('old website transactions remain unenrolled without touching SMTP', async () => {
  const stub = mock.method(nodemailer, 'createTransport', () => { throw new Error('Must not send'); });
  try {
    const order = proof();
    assert.equal(await sendPaidOrderConfirmation({
      reference: order.reference, metadata: {}, currency: 'NGN', amount: order.amountKobo, status: 'success',
    }, order), 'not-enrolled');
  } finally { stub.mock.restore(); }
});
