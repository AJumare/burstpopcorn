import { createHmac, timingSafeEqual } from 'node:crypto';

const PAYSTACK_API_URL = 'https://api.paystack.co';

export class PaystackConfigurationError extends Error {
  constructor(message = 'Payment configuration is incomplete') {
    super(message);
  }
}

export class PaystackApiError extends Error {
  constructor(public readonly statusCode: number) {
    super(`Paystack API returned status ${statusCode}`);
  }
}

type PaystackEnvelope<T> = {
  status: boolean;
  data?: T;
  meta?: {
    pageCount?: number;
  };
};

function getSecretKey(): string {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new PaystackConfigurationError('PAYSTACK_SECRET_KEY is not configured');
  return secretKey;
}

function getOrderSigningKeys(): string[] {
  const current = process.env.SESSION_SECRET;
  if (!current) throw new PaystackConfigurationError('SESSION_SECRET is not configured');
  const previous = process.env.PAYSTACK_PREVIOUS_ORDER_SIGNING_KEY;
  return previous ? [current, previous] : [current];
}

export type PaystackOrderProof = {
  reference: string;
  amountKobo: number;
  customerName: string;
  phone: string;
  address: string;
  state: string;
  items: string;
};

function orderSignature(order: PaystackOrderProof, key: string): Buffer {
  return createHmac('sha256', key)
    .update('burst-popcorn-order-v1\0')
    .update(JSON.stringify(order))
    .digest();
}

export function signPaystackOrder(order: PaystackOrderProof): string {
  return `v1.${orderSignature(order, getOrderSigningKeys()[0]).toString('hex')}`;
}

export function verifyPaystackOrder(order: PaystackOrderProof, signature: string): boolean {
  if (!/^v1\.[a-f0-9]{64}$/.test(signature)) return false;
  const submitted = Buffer.from(signature.slice(3), 'hex');
  let valid = false;
  for (const key of getOrderSigningKeys()) {
    valid = timingSafeEqual(orderSignature(order, key), submitted) || valid;
  }
  return valid;
}

async function requestPaystack<T>(path: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
  const response = await fetch(`${PAYSTACK_API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new PaystackApiError(response.status);
  const result = await response.json() as PaystackEnvelope<T>;
  if (!result.status || !result.data) throw new PaystackApiError(response.status);
  return result.data;
}

export type PaystackTransaction = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  metadata: unknown;
  paid_at?: string | null;
  customer?: { email?: string | null };
};

export async function listPaystackTransactions(page: number) {
  const response = await fetch(
    `${PAYSTACK_API_URL}/transaction?status=success&perPage=40&page=${page}`,
    {
      headers: { Authorization: `Bearer ${getSecretKey()}` },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok) throw new PaystackApiError(response.status);
  const result = await response.json() as PaystackEnvelope<PaystackTransaction[]>;
  if (!result.status || !Array.isArray(result.data)) throw new PaystackApiError(response.status);
  return {
    transactions: result.data,
    hasMore: typeof result.meta?.pageCount === 'number'
      ? page < result.meta.pageCount
      : result.data.length === 40,
  };
}

export function initializePaystackTransaction(body: unknown) {
  return requestPaystack<{ authorization_url: string; reference: string }>(
    '/transaction/initialize',
    'POST',
    body,
  );
}

export function verifyPaystackTransaction(reference: string) {
  return requestPaystack<PaystackTransaction>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    'GET',
  );
}