import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Guard against restoring the unpaid-checkout SMTP side effect.
// Paths are relative to the API package, where this check runs.
test('checkout-start alerts are absent while paid confirmation handlers remain', () => {
  const checkout = readFileSync('src/routes/paystack.ts', 'utf8');
  const webhook = readFileSync('src/routes/paystackWebhook.ts', 'utf8');
  const reconciliation = readFileSync('src/jobs/reconcilePaidOrders.ts', 'utf8');

  assert.doesNotMatch(checkout, /checkoutAlert|sendCheckoutStartedAlert|sendMail/);
  assert.match(checkout, /initializePaystackTransaction/);
  assert.match(checkout, /authorizationUrl: hostedUrl\.toString\(\)/);
  assert.match(checkout, /await sendPaidOrderConfirmation\(transaction, order\)/);
  assert.match(webhook, /await sendPaidOrderConfirmation\(transaction, order\)/);
  assert.match(reconciliation, /sendConfirmation: sendPaidOrderConfirmation/);
});