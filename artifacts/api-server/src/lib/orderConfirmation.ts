import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import { and, eq, lt, or } from 'drizzle-orm';
import { db, orderConfirmationTable } from '@workspace/db';
import type { PaystackOrderProof, PaystackTransaction } from './paystack';

const SENDER = 'hello@burstpopcorn.com';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] ?? char);
}

export function orderConfirmationMessage(order: PaystackOrderProof) {
  const total = new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
  }).format(order.amountKobo / 100);
  const text = [
    `Hi ${order.customerName},`,
    '',
    'Your Burst Popcorn payment is confirmed. Thank you for your order!',
    '',
    `Order: ${order.reference}`,
    `Items: ${order.items}`,
    `Total paid: ${total} (including delivery)`,
    `Delivery to: ${order.address}, ${order.state}`,
    '',
    'If you have a question about your order, reply to this email.',
    'Burst Popcorn Co.',
  ].join('\n');
  const html = `<!doctype html><html><body style="margin:0;padding:32px 16px;background:#2b1f15;font-family:Arial,sans-serif;color:#2b1f15">
    <div style="max-width:560px;margin:auto;background:#faf6ee;border-radius:16px;padding:32px">
      <p style="color:#925b11;font-size:12px;letter-spacing:3px;font-weight:bold">BURST POPCORN CO.</p>
      <h1 style="font-family:Georgia,serif;font-size:32px">Your order is confirmed</h1>
      <p>Hi ${escapeHtml(order.customerName)},</p>
      <p>Your payment is confirmed. Thank you for your order!</p>
      <div style="border-top:1px solid #dac8ac;border-bottom:1px solid #dac8ac;padding:16px 0">
        <p><strong>Order</strong><br>${escapeHtml(order.reference)}</p>
        <p><strong>Items</strong><br>${escapeHtml(order.items)}</p>
        <p><strong>Total paid</strong><br>${escapeHtml(total)} (including delivery)</p>
        <p><strong>Delivery to</strong><br>${escapeHtml(order.address)}, ${escapeHtml(order.state)}</p>
      </div>
      <p>If you have a question about your order, reply to this email.</p>
      <p style="color:#925b11">Burst Popcorn Co.</p>
    </div></body></html>`;
  return { text, html };
}

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
  const password = process.env.BURST_EMAIL_APP_PASSWORD;
  if (!password) throw new Error('BURST_EMAIL_APP_PASSWORD is not configured');
  const recipient = transaction.customer?.email?.trim();
  if (!recipient || recipient.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error('Verified payment has no usable customer email');
  }

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
      ...orderConfirmationMessage(order),
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