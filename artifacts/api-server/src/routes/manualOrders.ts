import { Router, type IRouter, type Request, type Response } from 'express';
import { getAuth } from '@clerk/express';
import { and, eq } from 'drizzle-orm';
import { db, manualOrderTable } from '@workspace/db';
import { CreateManualOrderResponse, MarkManualOrderPaidResponse, SendManualOrderConfirmationResponse } from '@workspace/api-zod';
import { requireAdmin } from './admin';
import {
  deliveryDateFor, manualOrderResult, manualReferencePattern,
  ManualOrderValidationError, parseManualOrder, parseManualPayment,
} from '../lib/manualOrders';

const router: IRouter = Router();
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'private, no-store'); next(); });

function failure(req: Request, res: Response, error: unknown) {
  if (error instanceof ManualOrderValidationError) {
    res.status(400).json({ error: error.message });
  } else {
    req.log.error({ err: error }, 'Manual order operation failed');
    res.status(503).json({ error: 'Could not complete this operation. Refresh the order list before retrying.' });
  }
}

router.post('/', async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const { data, paidAt, deliveryDate, fingerprint } = parseManualOrder(req.body);
    const reference = `manual-${data.requestId}`;
    await db.insert(manualOrderTable).values({
      reference, creationFingerprint: fingerprint,
      customerName: data.customerName, email: data.email, phone: data.phone,
      address: data.address, state: data.state, lineItems: data.lineItems,
      totalNaira: data.totalNaira, paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus, paidAt, deliveryDate,
      deliveryDateOverridden: Boolean(data.deliveryDate), createdBy: getAuth(req).userId!,
    }).onConflictDoNothing();
    const [order] = await db.select().from(manualOrderTable).where(eq(manualOrderTable.reference, reference));
    if (order.creationFingerprint !== fingerprint) {
      res.status(409).json({ error: 'This draft was already saved with different details. Refresh the list before creating another order.' });
      return;
    }
    res.status(201).json(CreateManualOrderResponse.parse(await manualOrderResult(order, data.sendConfirmation)));
  } catch (error) { failure(req, res, error); }
});

router.patch('/:reference/payment', async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const reference = String(req.params.reference);
  if (!manualReferencePattern.test(reference)) {
    res.status(400).json({ error: 'Invalid manual order reference.' });
    return;
  }
  try {
    const input = parseManualPayment(req.body);
    let [order] = await db.select().from(manualOrderTable).where(eq(manualOrderTable.reference, reference));
    if (!order) { res.status(404).json({ error: 'Manual order not found.' }); return; }
    if (order.paymentStatus === 'pending') {
      const deliveryOverride = input.deliveryDate === null
        ? null
        : input.deliveryDate ?? (order.deliveryDateOverridden ? order.deliveryDate : null);
      await db.update(manualOrderTable).set({
        paymentStatus: 'paid', paidAt: input.paidAt,
        deliveryDate: deliveryDateFor(deliveryOverride, input.paidAt),
        deliveryDateOverridden: Boolean(deliveryOverride),
      }).where(and(eq(manualOrderTable.reference, reference), eq(manualOrderTable.paymentStatus, 'pending')));
      [order] = await db.select().from(manualOrderTable).where(eq(manualOrderTable.reference, reference));
    }
    if (order.paidAt?.getTime() !== input.paidAt.getTime()
      || (input.deliveryDate && input.deliveryDate !== order.deliveryDate)) {
      res.status(409).json({ error: 'This order has already been marked paid with different details. Refresh the list.' });
      return;
    }
    res.json(MarkManualOrderPaidResponse.parse(await manualOrderResult(order, input.sendConfirmation)));
  } catch (error) { failure(req, res, error); }
});

router.post('/:reference/confirmation', async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const reference = String(req.params.reference);
  if (!manualReferencePattern.test(reference)) {
    res.status(400).json({ error: 'Invalid manual order reference.' });
    return;
  }
  try {
    const [order] = await db.select().from(manualOrderTable).where(eq(manualOrderTable.reference, reference));
    if (!order) { res.status(404).json({ error: 'Manual order not found.' }); return; }
    if (order.paymentStatus !== 'paid') {
      res.status(409).json({ error: 'Record received payment before sending a confirmation email.' });
      return;
    }
    res.json(SendManualOrderConfirmationResponse.parse(await manualOrderResult(order, true)));
  } catch (error) { failure(req, res, error); }
});

export default router;
