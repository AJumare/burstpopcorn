import { Router, type IRouter } from 'express';
import healthRouter from './health';
import stripeRouter from './stripe';
import paystackRouter from './paystack';
import adminRouter from './admin';

const router: IRouter = Router();

router.use(healthRouter);
router.use('/stripe', stripeRouter);
router.use('/paystack', paystackRouter);
router.use('/admin', adminRouter);

export default router;
