import { and, eq, inArray } from 'drizzle-orm';
import { db, orderConfirmationTable } from '@workspace/db';
import { logger } from '../lib/logger';
import { listPaystackTransactions, verifyPaystackTransaction } from '../lib/paystack';
import { sendPaidOrderConfirmation } from '../lib/orderConfirmation';
import { verifiedPaidOrder } from '../routes/paystack';

const PAGE_SIZE = 40;
const MAX_PAGES = 250;
const BURST_REFERENCE = /^burst-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

const dependencies = {
  listTransactions: listPaystackTransactions,
  verifyTransaction: verifyPaystackTransaction,
  verifyOrder: verifiedPaidOrder,
  sendConfirmation: sendPaidOrderConfirmation,
  async getSentReferences(references: string[]): Promise<string[]> {
    if (!references.length) return [];
    const rows = await db.select({ reference: orderConfirmationTable.reference })
      .from(orderConfirmationTable)
      .where(and(
        inArray(orderConfirmationTable.reference, references),
        eq(orderConfirmationTable.status, 'sent'),
      ));
    return rows.map(row => row.reference);
  },
};

/**
 * Reconcile the same confirmed Paystack transactions shown in Paid Orders.
 * The database claim inside sendPaidOrderConfirmation makes concurrent callback,
 * webhook, and scheduled runs safe from ordinary duplicate sends.
 */
export async function reconcilePaidOrders(job = dependencies): Promise<void> {
  let checked = 0;
  let sent = 0;
  let failures = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await job.listTransactions(page);
    const references = result.transactions
      .map(transaction => transaction.reference)
      .filter(reference => typeof reference === 'string' && BURST_REFERENCE.test(reference));
    const sentReferences = new Set(await job.getSentReferences(references));

    for (const transaction of result.transactions) {
      const reference = transaction.reference;
      if (typeof reference !== 'string' || !BURST_REFERENCE.test(reference)
        || sentReferences.has(reference)) continue;
      checked++;
      try {
        // Do not trust list data alone: fetch the transaction directly and
        // verify its signed order proof, currency, reference, and amount.
        const verified = await job.verifyTransaction(reference);
        const order = job.verifyOrder(verified, reference);
        if (!order) continue;
        const outcome = await job.sendConfirmation(verified, order);
        if (outcome === 'sent') sent++;
        if (outcome === 'in-progress') {
          // An in-flight send will be reconsidered on the next scheduled run.
          logger.warn({ reference }, 'Paid order confirmation is still in progress');
        }
      } catch (error) {
        failures++;
        logger.error({ err: error, reference }, 'Scheduled paid order confirmation failed');
      }
    }

    if (!result.hasMore) {
      logger.info({ checked, sent, failures, pages: page }, 'Paid order reconciliation finished');
      if (failures) throw new Error(`${failures} paid order confirmation(s) failed; retry on the next run`);
      return;
    }
    if (page === MAX_PAGES) {
      throw new Error(`Paystack returned more than ${MAX_PAGES * PAGE_SIZE} transactions; reconciliation was incomplete`);
    }
  }
}