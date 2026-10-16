import { logger } from '../lib/logger';
import { reconcilePaidOrders } from './reconcilePaidOrders';

reconcilePaidOrders().catch(error => {
  logger.error({ err: error }, 'Paid order reconciliation job failed');
  process.exitCode = 1;
});