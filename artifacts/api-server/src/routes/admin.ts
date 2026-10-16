import { Router, type IRouter, type Request, type Response } from 'express';
import { clerkClient, getAuth } from '@clerk/express';
import { db, adminOrderDeliveryTable, manualOrderTable } from '@workspace/db';
import { eq, inArray } from 'drizzle-orm';
import {
  ListAdminOrdersQueryParams,
  ListAdminOrdersResponse,
  UpdateAdminOrderDeliveryBody,
  UpdateAdminOrderDeliveryParams,
  UpdateAdminOrderDeliveryResponse,
} from '@workspace/api-zod';
import {
  listPaystackTransactions,
  PaystackApiError,
  PaystackConfigurationError,
  type PaystackTransaction,
  verifyPaystackTransaction,
} from '../lib/paystack';
import { loadAdminOrderDeliveryStatuses } from '../lib/adminOrderDeliveryStatus';
import { verifiedOrderMetadata } from './paystack';
import { listManualOrders, manualReferencePattern } from '../lib/manualOrders';
import { getDeliverySchedule } from '@workspace/delivery-schedule';

const router: IRouter = Router();

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store');
  next();
});

export async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: 'Please sign in to view orders.' });
    return false;
  }
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    res.status(503).json({ error: 'Admin access has not been configured.' });
    return false;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const primaryEmail = user.primaryEmailAddress;
    if (
      primaryEmail?.emailAddress.toLowerCase() !== adminEmail ||
      primaryEmail.verification?.status !== 'verified'
    ) {
      res.status(403).json({ error: 'This account does not have access to shop orders.' });
      return false;
    }
  } catch (error) {
    req.log.error({ err: error }, 'Could not confirm admin identity');
    res.status(503).json({ error: 'Could not check admin access. Please try again.' });
    return false;
  }
  return true;
}

function verifiedBurstOrder(transaction: PaystackTransaction) {
  if (
    transaction.status !== 'success' ||
    transaction.currency !== 'NGN' ||
    typeof transaction.reference !== 'string' ||
    !transaction.reference.startsWith('burst-')
  ) return null;
  let metadata = transaction.metadata;
  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata) as unknown;
    } catch {
      return null;
    }
  }
  const order = verifiedOrderMetadata(metadata, transaction.reference);
  return order && transaction.amount === order.amountKobo ? order : null;
}

router.get('/orders', async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const parsed = ListAdminOrdersQueryParams.safeParse(req.query);
  if (!parsed.success || !Number.isSafeInteger(parsed.data.page)) {
    res.status(400).json({ error: 'Invalid page number.' });
    return;
  }
  const page = parsed.data.page ?? 1;
  if (parsed.data.source === 'manual') {
    try {
      const result = await listManualOrders(page);
      const delivery = await loadAdminOrderDeliveryStatuses(result.orders, async references =>
        db.select().from(adminOrderDeliveryTable).where(inArray(adminOrderDeliveryTable.reference, references)));
      res.json(ListAdminOrdersResponse.parse({
        orders: delivery.orders, page, hasMore: result.hasMore,
        deliveryTrackingAvailable: delivery.error ? false : delivery.deliveryTrackingAvailable,
      }));
    } catch (error) {
      req.log.error({ err: error }, 'Could not load manual orders');
      res.status(503).json({ error: 'Could not load manual orders. Please try again.' });
    }
    return;
  }

  let result;
  try {
    result = await listPaystackTransactions(page);
  } catch (error) {
    if (error instanceof PaystackConfigurationError) {
      res.status(503).json({ error: 'Paystack is not configured.' });
      return;
    }
    req.log.error({ err: error }, 'Could not list Paystack orders');
    res.status(502).json({ error: 'Could not load orders from Paystack. Please try again.' });
    return;
  }

  const orders = result.transactions.flatMap((transaction) => {
    const order = verifiedBurstOrder(transaction);
    if (!order) return [];
    return [{
      source: 'website' as const,
      paymentStatus: 'paid' as const,
      deliveryDate: transaction.paid_at ? getDeliverySchedule(transaction.paid_at).deliveryDate : null,
      reference: transaction.reference,
      customerName: order.customerName,
      email: transaction.customer?.email ?? null,
      phone: order.phone,
      address: order.address,
      state: order.state,
      items: order.items,
      totalNaira: order.amountKobo / 100,
      paidAt: transaction.paid_at ?? null,
    }];
  });
  const delivery = await loadAdminOrderDeliveryStatuses(orders, async references =>
    db.select().from(adminOrderDeliveryTable)
      .where(inArray(adminOrderDeliveryTable.reference, references)));
  if (delivery.error) {
    req.log.error({ err: delivery.error }, 'Could not load order delivery statuses');
  }
  res.json(ListAdminOrdersResponse.parse({
    orders: delivery.orders,
    page,
    hasMore: result.hasMore,
    deliveryTrackingAvailable: delivery.deliveryTrackingAvailable,
  }));
});

router.patch('/orders/:reference/delivery', async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const params = UpdateAdminOrderDeliveryParams.safeParse(req.params);
  const body = UpdateAdminOrderDeliveryBody.safeParse(req.body);
  const reference = params.success ? params.data.reference : '';
  const isManual = manualReferencePattern.test(reference);
  if (!body.success || (!isManual && !/^burst-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(reference))) {
    res.status(400).json({ error: 'Invalid delivery update.' });
    return;
  }

  try {
    if (isManual) {
      const [manual] = await db.select().from(manualOrderTable).where(eq(manualOrderTable.reference, reference));
      if (!manual) {
        res.status(404).json({ error: 'Manual order not found.' });
        return;
      }
      if (manual.paymentStatus !== 'paid') {
        res.status(409).json({ error: 'Record received payment before marking this order delivered.' });
        return;
      }
    } else {
      const transaction = await verifyPaystackTransaction(reference);
      if (transaction.reference !== reference || !verifiedBurstOrder(transaction)) {
        res.status(404).json({ error: 'Confirmed Burst order not found.' });
        return;
      }
    }
  } catch (error) {
    if (error instanceof PaystackApiError && error.statusCode === 404) {
      res.status(404).json({ error: 'Confirmed Burst order not found.' });
      return;
    }
    if (error instanceof PaystackConfigurationError) {
      res.status(503).json({ error: 'Paystack is not configured.' });
      return;
    }
    req.log.error({ err: error }, 'Could not verify order before updating delivery');
    res.status(502).json({ error: 'Could not confirm payment. Please try again.' });
    return;
  }

  try {
    let deliveredAt: Date | null = null;
    if (body.data.delivered) {
      await db.insert(adminOrderDeliveryTable).values({ reference }).onConflictDoNothing();
      const [status] = await db.select({ deliveredAt: adminOrderDeliveryTable.deliveredAt })
        .from(adminOrderDeliveryTable).where(eq(adminOrderDeliveryTable.reference, reference));
      deliveredAt = status.deliveredAt;
    } else {
      await db.delete(adminOrderDeliveryTable).where(eq(adminOrderDeliveryTable.reference, reference));
    }
    res.json(UpdateAdminOrderDeliveryResponse.parse({ reference, deliveredAt }));
  } catch (error) {
    req.log.error({ err: error }, 'Could not update order delivery status');
    res.status(503).json({ error: 'Could not save delivery status. Please try again.' });
  }
});

export default router;