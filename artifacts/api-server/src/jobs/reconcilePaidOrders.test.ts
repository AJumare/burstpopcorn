import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PaystackTransaction } from '../lib/paystack';
import { reconcilePaidOrders } from './reconcilePaidOrders';

const first = 'burst-00000000-0000-4000-8000-000000000001';
const second = 'burst-00000000-0000-4000-8000-000000000002';
const transaction = (reference: string): PaystackTransaction => ({
  reference, status: 'success', currency: 'NGN', amount: 11000, metadata: {},
});
const order = {
  reference: second, amountKobo: 11000, customerName: 'Customer',
  phone: '08000000000', address: 'Address', state: 'Lagos', items: 'Popcorn',
};

test('scans all pages, skips sent references, and only sends for verified orders', async () => {
  const verified: string[] = [];
  const sent: string[] = [];
  const pages: number[] = [];
  await reconcilePaidOrders({
    async listTransactions(page) {
      pages.push(page);
      return page === 1
        ? { transactions: [transaction(first), transaction('other-payment')], hasMore: true }
        : { transactions: [transaction(second)], hasMore: false };
    },
    async getSentReferences(references) {
      return references.includes(first) ? [first] : [];
    },
    async verifyTransaction(reference) {
      verified.push(reference);
      return transaction(reference);
    },
    verifyOrder(payment) {
      return payment.reference === second ? order : null;
    },
    async sendConfirmation(_payment, confirmedOrder) {
      sent.push(confirmedOrder.reference);
      return 'sent' as const;
    },
  });
  assert.deepEqual(pages, [1, 2]);
  assert.deepEqual(verified, [second]);
  assert.deepEqual(sent, [second]);
});

test('failed sends fail the run so the scheduler alerts and retries next time', async () => {
  let attempts = 0;
  const job = {
    async listTransactions() { return { transactions: [transaction(second)], hasMore: false }; },
    async getSentReferences() { return []; },
    async verifyTransaction() { return transaction(second); },
    verifyOrder() { return order; },
    async sendConfirmation() {
      attempts++;
      if (attempts === 1) throw new Error('Mail server unavailable');
      return 'sent' as const;
    },
  };
  await assert.rejects(reconcilePaidOrders(job), /1 paid order confirmation/);
  await reconcilePaidOrders(job);
  assert.equal(attempts, 2);
});