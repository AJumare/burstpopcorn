import { randomUUID } from 'node:crypto';
import { Router, type IRouter } from 'express';
import {
  CreatePaystackCheckoutBody,
  CreatePaystackCheckoutResponse,
  VerifyPaystackTransactionParams,
  VerifyPaystackTransactionResponse,
} from '@workspace/api-zod';
import {
  initializePaystackTransaction,
  PaystackApiError,
  PaystackConfigurationError,
  type PaystackOrderProof,
  type PaystackTransaction,
  signPaystackOrder,
  verifyPaystackTransaction,
  verifyPaystackOrder,
} from '../lib/paystack';
import { sendPaidOrderConfirmation } from '../lib/orderConfirmation';

const router: IRouter = Router();

const DELIVERY_FEE_NAIRA = 3500;
const MAX_PACKS = 20;
const UNCONFIRMED_PAYMENT_MESSAGE = 'Payment has not been confirmed yet. If you were charged, wait a moment and check again.';
const PRODUCTS = {
  'salted-caramel': { label: 'Salted Caramel', priceNaira: 7500, available: true },
  'peanut-brittle': { label: 'Peanut Brittle', priceNaira: 7800, available: true },
  'caramel-cheese': { label: 'Caramel & Cheese Mix', priceNaira: 5800, available: false },
} as const;

function allowedCallbackOrigins(): Set<string> {
  const origins = new Set<string>();
  const replitDomains = [
    ...(process.env.REPLIT_DOMAINS ?? '').split(','),
    process.env.REPLIT_DEV_DOMAIN ?? '',
  ];
  for (const domain of replitDomains) {
    if (/^[a-zA-Z0-9.-]+$/.test(domain.trim())) origins.add(`https://${domain.trim()}`);
  }
  for (const configuredOrigin of (process.env.PAYSTACK_ALLOWED_ORIGINS ?? '').split(',')) {
    if (!configuredOrigin.trim()) continue;
    try {
      const url = new URL(configuredOrigin.trim());
      if (url.protocol === 'https:' && url.pathname === '/' && !url.search && !url.hash) {
        origins.add(url.origin);
      }
    } catch {
      // An invalid configured origin never becomes an allowed callback.
    }
  }
  return origins;
}

function isAllowedCallbackPath(path: string): boolean {
  const configured = (process.env.PAYSTACK_CALLBACK_PATHS ?? '/')
    .split(',')
    .map(value => value.trim());
  return configured.includes(path) || /^\/[a-z0-9-]+\/$/.test(path);
}

export function verifiedOrderMetadata(metadata: unknown, reference: string): PaystackOrderProof | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const fields = metadata as Record<string, unknown>;
  if (
    fields.source !== 'burst-popcorn' ||
    typeof fields.amount_kobo !== 'number' ||
    !Number.isSafeInteger(fields.amount_kobo) ||
    fields.amount_kobo <= 0 ||
    typeof fields.customer_name !== 'string' ||
    typeof fields.phone !== 'string' ||
    typeof fields.delivery_address !== 'string' ||
    typeof fields.delivery_state !== 'string' ||
    typeof fields.order_items !== 'string' ||
    typeof fields.order_proof !== 'string'
  ) return null;

  const order: PaystackOrderProof = {
    reference,
    amountKobo: fields.amount_kobo,
    customerName: fields.customer_name,
    phone: fields.phone,
    address: fields.delivery_address,
    state: fields.delivery_state,
    items: fields.order_items,
  };
  return verifyPaystackOrder(order, fields.order_proof) ? order : null;
}

export function verifiedPaidOrder(transaction: PaystackTransaction, reference: string): PaystackOrderProof | null {
  let metadata: unknown = transaction.metadata;
  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata) as unknown;
    } catch {
      return null;
    }
  }
  const order = verifiedOrderMetadata(metadata, reference);
  return transaction.status === 'success'
    && transaction.reference === reference
    && transaction.currency === 'NGN'
    && order
    && transaction.amount === order.amountKobo
    ? order : null;
}

function respondToPaystackError(req: { log: { error: (context: object, message: string) => void } }, res: {
  status: (code: number) => { json: (body: object) => void };
}, error: unknown, action: string) {
  if (error instanceof PaystackConfigurationError) {
    res.status(503).json({ error: 'Paystack checkout is not configured yet.' });
    return;
  }
  req.log.error({ err: error }, `Paystack ${action} failed`);
  res.status(502).json({ error: `Could not ${action} with Paystack. Please try again.` });
}

router.post('/checkout', async (req, res): Promise<void> => {
  const parsed = CreatePaystackCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Please check your order and contact details.' });
    return;
  }

  const order = parsed.data;
  const seen = new Set<string>();
  let subtotalNaira = 0;
  let totalPacks = 0;
  const itemLabels: string[] = [];

  for (const item of order.items) {
    const product = PRODUCTS[item.flavor];
    if (!product.available || seen.has(item.flavor) || !Number.isInteger(item.quantity)) {
      res.status(400).json({ error: 'One of the selected flavours is unavailable or invalid.' });
      return;
    }
    seen.add(item.flavor);
    totalPacks += item.quantity;
    subtotalNaira += item.quantity * product.priceNaira;
    itemLabels.push(`${item.quantity} × ${product.label}`);
  }

  if (totalPacks > MAX_PACKS) {
    res.status(400).json({ error: `Orders are limited to ${MAX_PACKS} packs.` });
    return;
  }

  let callbackUrl: URL;
  try {
    callbackUrl = new URL(order.callbackUrl);
  } catch {
    res.status(400).json({ error: 'Invalid return URL.' });
    return;
  }
  if (
    !req.get('origin') ||
    callbackUrl.origin !== req.get('origin') ||
    callbackUrl.protocol !== 'https:' ||
    !isAllowedCallbackPath(callbackUrl.pathname) ||
    callbackUrl.username ||
    callbackUrl.password ||
    callbackUrl.search ||
    callbackUrl.hash
  ) {
    res.status(400).json({ error: 'Invalid return URL.' });
    return;
  }

  let returnUrl = callbackUrl;
  if (!allowedCallbackOrigins().has(callbackUrl.origin)) {
    try {
      returnUrl = new URL(process.env.PAYSTACK_FALLBACK_CALLBACK_URL ?? '');
    } catch {
      res.status(400).json({ error: 'Checkout is not available from this storefront.' });
      return;
    }
    if (
      returnUrl.protocol !== 'https:' ||
      !allowedCallbackOrigins().has(returnUrl.origin) ||
      !isAllowedCallbackPath(returnUrl.pathname) ||
      returnUrl.username ||
      returnUrl.password ||
      returnUrl.search ||
      returnUrl.hash
    ) {
      res.status(400).json({ error: 'Checkout is not available from this storefront.' });
      return;
    }
  }

  const totalNaira = subtotalNaira + DELIVERY_FEE_NAIRA;
  const amountKobo = totalNaira * 100;
  const name = order.name.trim();
  const phone = order.phone.trim();
  const address = order.address.trim();
  if (!name || phone.length < 7 || address.length < 5) {
    res.status(400).json({ error: 'Please check your name, phone number and delivery address.' });
    return;
  }
  const itemsDescription = itemLabels.join(', ');
  const reference = `burst-${randomUUID()}`;
  const orderProof: PaystackOrderProof = {
    reference,
    amountKobo,
    customerName: name,
    phone,
    address,
    state: order.state,
    items: itemsDescription,
  };

  try {
    const session = await initializePaystackTransaction({
      reference,
      email: order.email.trim().toLowerCase(),
      amount: String(amountKobo),
      currency: 'NGN',
      callback_url: returnUrl.toString(),
      metadata: {
        source: 'burst-popcorn',
        confirmation_email: 'v1',
        amount_kobo: amountKobo,
        customer_name: name,
        phone,
        delivery_address: address,
        delivery_state: order.state,
        order_items: itemsDescription,
        order_proof: signPaystackOrder(orderProof),
        custom_fields: [
          { display_name: 'Items', variable_name: 'order_items', value: itemsDescription },
          { display_name: 'Name', variable_name: 'customer_name', value: name },
          { display_name: 'Phone', variable_name: 'phone', value: phone },
          { display_name: 'Delivery address', variable_name: 'delivery_address', value: address },
        ],
      },
    });
    const hostedUrl = new URL(session.authorization_url);
    if (
      hostedUrl.protocol !== 'https:' ||
      hostedUrl.hostname !== 'checkout.paystack.com' ||
      session.reference !== reference
    ) {
      throw new Error('Unexpected Paystack checkout URL');
    }
    res.json(CreatePaystackCheckoutResponse.parse({
      authorizationUrl: hostedUrl.toString(),
      reference: session.reference,
    }));
  } catch (error) {
    respondToPaystackError(req, res, error, 'start checkout');
  }
});

router.get('/verify/:reference', async (req, res): Promise<void> => {
  const parsed = VerifyPaystackTransactionParams.safeParse(req.params);
  if (!parsed.success || !/^[A-Za-z0-9_.=-]{3,100}$/.test(parsed.data.reference)) {
    res.status(400).json({ error: 'Invalid transaction reference.' });
    return;
  }

  try {
    const transaction = await verifyPaystackTransaction(parsed.data.reference);
    const order = verifiedPaidOrder(transaction, parsed.data.reference);
    if (!order) {
      res.status(409).json({ error: UNCONFIRMED_PAYMENT_MESSAGE });
      return;
    }

    try {
      const result = await sendPaidOrderConfirmation(transaction, order);
      if (result === 'sent') req.log.info({ reference: order.reference }, 'Paid order confirmation sent');
    } catch (error) {
      // Email failure cannot undo a completed payment or change its success response.
      req.log.error({ err: error, reference: order.reference }, 'Could not send paid order confirmation');
    }
    res.json(VerifyPaystackTransactionResponse.parse({
      verified: true,
      customerName: order.customerName,
      totalNaira: order.amountKobo / 100,
    }));
  } catch (error) {
    if (error instanceof PaystackApiError && [200, 400, 404].includes(error.statusCode)) {
      res.status(409).json({ error: UNCONFIRMED_PAYMENT_MESSAGE });
      return;
    }
    respondToPaystackError(req, res, error, 'verify payment');
  }
});

export default router;