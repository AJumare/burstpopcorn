import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { logger } from '../lib/logger';
import { verifyPaystackTransaction } from '../lib/paystack';
import { sendPaidOrderConfirmation } from '../lib/orderConfirmation';
import { verifiedPaidOrder } from './paystack';

export async function paystackWebhook(req: Request, res: Response): Promise<void> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    res.status(503).json({ error: 'Payment provider is not configured' });
    return;
  }
  const header = req.get('x-paystack-signature');
  const body: unknown = req.body;
  if (!Buffer.isBuffer(body) || !header || !/^[a-f0-9]{128}$/i.test(header)) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }
  const signature = Buffer.from(header, 'hex');
  const expected = createHmac('sha512', key).update(body).digest();
  if (!timingSafeEqual(signature, expected)) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  let event: unknown;
  try {
    event = JSON.parse(body.toString('utf8')) as unknown;
  } catch {
    res.status(400).json({ error: 'Invalid webhook payload' });
    return;
  }
  if (!event || typeof event !== 'object') {
    res.sendStatus(200);
    return;
  }
  const payload = event as { event?: unknown; data?: { reference?: unknown } };
  if (payload.event !== 'charge.success'
    || typeof payload.data?.reference !== 'string'
    || !/^burst-[0-9a-f-]{36}$/.test(payload.data.reference)) {
    res.sendStatus(200);
    return;
  }

  const reference = payload.data.reference;
  try {
    // Never trust the webhook's claimed amount, recipient, or order contents.
    const transaction = await verifyPaystackTransaction(reference);
    const order = verifiedPaidOrder(transaction, reference);
    if (order) {
      const result = await sendPaidOrderConfirmation(transaction, order);
      if (result === 'in-progress') {
        res.status(503).json({ error: 'Order confirmation is still processing' });
        return;
      }
      if (result === 'sent') logger.info({ reference }, 'Paid order confirmation sent');
    }
    res.sendStatus(200);
  } catch (error) {
    logger.error({ err: error, reference }, 'Paystack order confirmation failed');
    // Paystack retries non-200 webhook responses. A failed SMTP send is retryable.
    res.status(503).json({ error: 'Could not process payment confirmation' });
  }
}