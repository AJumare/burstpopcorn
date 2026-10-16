import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import { and, eq, lt, or } from 'drizzle-orm';
import { db, orderConfirmationTable } from '@workspace/db';
import type { PaystackOrderProof, PaystackTransaction } from './paystack';
import { orderConfirmationMessage } from './orderConfirmationTemplate';

export { orderConfirmationMessage } from './orderConfirmationTemplate';

const SENDER = 'hello@burstpopcorn.com';

/** Claims a payment reference before SMTP delivery to avoid duplicate webhook/return emails. */
export async function sendPaidOrderConfirmation(
  transaction: PaystackTransaction,
  order: PaystackOrderProof,
): Promise<'sent' | 'already-sent' | 'in-progress' | 'not-enrolled'> {
  let metadata: unknown = transaction.metadata;
  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata) as unknown;
    } catch {
      return 'not-enrolled';
    }
  }
  // Older paid orders still verify successfully, but do not receive a surprise late email.
  if (!metadata || typeof metadata !== 'object'
    || (metadata as Record<string, unknown>).confirmation_email !== 'v1') {
    return 'not-enrolled';
  }
  return sendOrderConfirmation(order, transaction.customer?.email ?? '', transaction.paid_at ?? '');
}

/** Shared transport and reference-based dedupe; callers must establish payment first. */
export async function sendOrderConfirmation(
  order: PaystackOrderProof,
  email: string,
  paidAt: Date | string,
  deliveryDate?: string,
): Promise<'sent' | 'already-sent' | 'in-progress'> {
  const password = process.env.BURST_EMAIL_APP_PASSWORD;
  if (!password) throw new Error('BURST_EMAIL_APP_PASSWORD is not configured');
  const recipient = email.trim();
  if (!recipient || recipient.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error('Verified payment has no usable customer email');
  }
  // Derive from the actual payment time, never the webhook/retry/send time.
  // Missing payment timestamps fail explicitly instead of promising a wrong date.
  const message = orderConfirmationMessage(order, paidAt, deliveryDate);

  const now = new Date();
  const attemptId = randomUUID();
  const [inserted] = await db.insert(orderConfirmationTable)
    .values({ reference: order.reference, status: 'sending', attemptId, attemptedAt: now })
    .onConflictDoNothing()
    .returning({ reference: orderConfirmationTable.reference });
  if (!inserted) {
    const [claimed] = await db.update(orderConfirmationTable)
      .set({ status: 'sending', attemptId, attemptedAt: now })
      .where(and(
        eq(orderConfirmationTable.reference, order.reference),
        or(
          eq(orderConfirmationTable.status, 'failed'),
          and(
            eq(orderConfirmationTable.status, 'sending'),
            lt(orderConfirmationTable.attemptedAt, new Date(now.getTime() - 10 * 60_000)),
          ),
        ),
      ))
      .returning({ reference: orderConfirmationTable.reference });
    if (!claimed) {
      const [existing] = await db.select({ status: orderConfirmationTable.status })
        .from(orderConfirmationTable)
        .where(eq(orderConfirmationTable.reference, order.reference))
        .limit(1);
      return existing?.status === 'sent' ? 'already-sent' : 'in-progress';
    }
  }

  try {
    const transport = nodemailer.createTransport({
      host: 'mail.privateemail.com',
      port: 465,
      secure: true,
      auth: { user: SENDER, pass: password },
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 10000,
    });
    const result = await transport.sendMail({
      from: { name: 'Burst Popcorn Co.', address: SENDER },
      to: recipient,
      subject: 'Your Burst Popcorn order is confirmed',
      ...message,
    });
    if (!result.accepted.some(address => address.toLowerCase() === recipient.toLowerCase())) {
      throw new Error('SMTP did not accept recipient');
    }
    const [recorded] = await db.update(orderConfirmationTable)
      .set({ status: 'sent', sentAt: new Date() })
      .where(and(
        eq(orderConfirmationTable.reference, order.reference),
        eq(orderConfirmationTable.attemptId, attemptId),
      ))
      .returning({ reference: orderConfirmationTable.reference });
    return recorded ? 'sent' : 'in-progress';
  } catch (error) {
    await db.update(orderConfirmationTable)
      .set({ status: 'failed' })
      .where(and(
        eq(orderConfirmationTable.reference, order.reference),
        eq(orderConfirmationTable.attemptId, attemptId),
      ));
    throw error;
  }
}