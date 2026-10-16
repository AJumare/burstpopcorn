import { createHash } from 'node:crypto';
import { desc, eq, inArray } from 'drizzle-orm';
import { db, manualOrderTable, orderConfirmationTable, type ManualOrder } from '@workspace/db';
import { CreateManualOrderBody, MarkManualOrderPaidBody } from '@workspace/api-zod';
import { formatDeliveryDate, getDeliverySchedule } from '@workspace/delivery-schedule';
import { sendOrderConfirmation } from './orderConfirmation';
import { logger } from './logger';

const labels: Record<string, string> = { 'salted-caramel': 'Salted Caramel', 'peanut-brittle': 'Peanut Brittle' };
export const manualReferencePattern = /^manual-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export class ManualOrderValidationError extends Error {}

export function paymentTimestamp(value: string | null | undefined, now = new Date()): Date {
  if (!value || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/i.test(value)) {
    throw new ManualOrderValidationError('Enter the actual payment date and time in WAT.');
  }
  try { formatDeliveryDate(value.slice(0, 10)); } catch {
    throw new ManualOrderValidationError('Payment date is invalid.');
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.getTime() > now.getTime() + 60_000) {
    throw new ManualOrderValidationError('Payment time must be valid and cannot be in the future.');
  }
  return date;
}

export function deliveryDateFor(value: string | null | undefined, basis: Date) {
  const automatic = getDeliverySchedule(basis).deliveryDate;
  if (!value) return automatic;
  try { formatDeliveryDate(value); } catch {
    throw new ManualOrderValidationError('Enter a valid delivery date.');
  }
  const paymentDay = new Date(basis.getTime() + 3600_000).toISOString().slice(0, 10);
  if (value < paymentDay) throw new ManualOrderValidationError('Delivery cannot be before payment or order creation.');
  return value;
}

export function parseManualOrder(value: unknown, now = new Date()) {
  const result = CreateManualOrderBody.safeParse(value);
  if (!result.success) throw new ManualOrderValidationError('Check the customer details, quantities and total amount.');
  const data = result.data;
  const cleaned = {
    ...data,
    customerName: data.customerName.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    address: data.address.trim(),
    state: data.state.trim(),
    lineItems: [...data.lineItems].sort((a, b) => a.flavor.localeCompare(b.flavor)),
    paidAt: data.paidAt ?? null,
    deliveryDate: data.deliveryDate || null,
  };
  if (cleaned.customerName.length < 2 || cleaned.address.length < 5 || cleaned.state.length < 2
    || !/^\+?[\d\s()-]{7,30}$/.test(cleaned.phone)
    || cleaned.phone.replace(/\D/g, '').length < 7
    || !Number.isSafeInteger(data.totalNaira)
    || data.lineItems.some(i => !Number.isSafeInteger(i.quantity))
    || new Set(data.lineItems.map(i => i.flavor)).size !== data.lineItems.length) {
    throw new ManualOrderValidationError('Check the customer details and enter each flavour only once.');
  }
  if (data.paymentStatus === 'pending' && (data.sendConfirmation || data.paidAt)) {
    throw new ManualOrderValidationError('An unpaid order cannot have a payment time or payment confirmation email.');
  }
  const paidAt = data.paymentStatus === 'paid' ? paymentTimestamp(data.paidAt, now) : null;
  const deliveryDate = deliveryDateFor(data.deliveryDate, paidAt ?? now);
  const fingerprint = createHash('sha256').update(JSON.stringify(cleaned)).digest('hex');
  return { data: cleaned, paidAt, deliveryDate, fingerprint };
}

export function parseManualPayment(value: unknown, now = new Date()) {
  const result = MarkManualOrderPaidBody.safeParse(value);
  if (!result.success) throw new ManualOrderValidationError('Enter payment details.');
  const paidAt = paymentTimestamp(result.data.paidAt, now);
  if (result.data.deliveryDate) deliveryDateFor(result.data.deliveryDate, paidAt);
  return { ...result.data, paidAt };
}

export function manualOrderView(order: ManualOrder, confirmationStatus: string | null = null) {
  return {
    reference: order.reference,
    source: 'manual' as const,
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
    address: order.address,
    state: order.state,
    items: order.lineItems.map(i => `${i.quantity} × ${labels[i.flavor] ?? i.flavor}`).join(', '),
    totalNaira: order.totalNaira,
    paymentStatus: order.paymentStatus as 'pending' | 'paid',
    paymentMethod: order.paymentMethod,
    paidAt: order.paidAt?.toISOString() ?? null,
    deliveryDate: order.deliveryDate,
    deliveryDateOverridden: order.deliveryDateOverridden,
    confirmationStatus,
    createdAt: order.createdAt.toISOString(),
    deliveredAt: null as Date | null,
  };
}

export async function listManualOrders(page: number) {
  const rows = await db.select().from(manualOrderTable)
    .orderBy(desc(manualOrderTable.createdAt), desc(manualOrderTable.reference))
    .limit(41).offset((page - 1) * 40);
  const confirmations = rows.length ? await db.select().from(orderConfirmationTable)
    .where(inArray(orderConfirmationTable.reference, rows.map(row => row.reference))) : [];
  return {
    orders: rows.slice(0, 40).map(row => manualOrderView(row,
      confirmations.find(c => c.reference === row.reference)?.status ?? null)),
    hasMore: rows.length > 40,
  };
}

export async function manualOrderResult(order: ManualOrder, send: boolean) {
  let emailStatus: 'not-requested' | 'sent' | 'already-sent' | 'in-progress' | 'failed' = 'not-requested';
  let emailError: string | null = null;
  if (send) {
    if (order.paymentStatus !== 'paid' || !order.paidAt) {
      throw new ManualOrderValidationError('Record received payment before sending a confirmation.');
    }
    const view = manualOrderView(order);
    try {
      emailStatus = await sendOrderConfirmation({
        reference: view.reference, customerName: view.customerName, phone: view.phone,
        address: view.address, state: view.state, items: view.items, amountKobo: view.totalNaira * 100,
      }, order.email, order.paidAt, order.deliveryDate);
    } catch (error) {
      // Saving an order has already succeeded. Report email failure separately.
      logger.error({ err: error, reference: order.reference }, 'Manual order confirmation failed');
      emailStatus = 'failed';
      emailError = 'Order saved, but email delivery could not be confirmed. Check with the customer before retrying.';
    }
  }
  const [confirmation] = await db.select().from(orderConfirmationTable)
    .where(eq(orderConfirmationTable.reference, order.reference)).limit(1);
  return { order: manualOrderView(order, emailStatus === 'failed' ? 'failed' : confirmation?.status ?? null), emailStatus, emailError };
}
