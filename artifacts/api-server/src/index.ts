import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripeClient';
import app from './app';
import { logger } from './lib/logger';

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required for Stripe');

  logger.info('Running Stripe migrations…');
  await runMigrations({ databaseUrl });
  logger.info('Stripe schema ready');

  const stripeSync = await getStripeSync();

  const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
  await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
  logger.info('Webhook configured');

  // Run backfill in background — don't block startup
  stripeSync.syncBackfill()
    .then(() => logger.info('Stripe backfill complete'))
    .catch((err) => logger.error({ err }, 'Stripe backfill error'));
}

const rawPort = process.env['PORT'];
if (!rawPort) throw new Error('PORT environment variable is required');
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: "${rawPort}"`);

await initStripe();

app.listen(port, (err) => {
  if (err) { logger.error({ err }, 'Error starting server'); process.exit(1); }
  logger.info({ port }, 'Server listening');
});
