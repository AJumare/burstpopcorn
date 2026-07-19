import { Router } from 'express';
import { getUncachableStripeClient } from '../stripeClient';

const router = Router();

// Pricing — set after running seed-products script
const PACK_PRICE_ID = process.env.STRIPE_PACK_PRICE_ID ?? '';
const DELIVERY_PRICE_ID = process.env.STRIPE_DELIVERY_PRICE_ID ?? '';

// POST /api/stripe/checkout
// Creates a Stripe Checkout Session for a popcorn order and returns the URL
router.post('/checkout', async (req, res) => {
  try {
    const { quantity, flavor, name, phone, address } = req.body as {
      quantity: number;
      flavor: string;
      name: string;
      phone: string;
      address: string;
    };

    if (!quantity || !name || !phone || !address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!PACK_PRICE_ID || !DELIVERY_PRICE_ID) {
      return res.status(500).json({ error: 'Stripe prices not yet configured. Run the seed script first.' });
    }

    const qty = Math.max(1, Math.min(20, Number(quantity)));
    const stripe = await getUncachableStripeClient();

    const host = req.headers.origin
      ?? (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'https://replit.dev');
    const successUrl = `${host}/?order=success&name=${encodeURIComponent(name)}`;
    const cancelUrl = `${host}/#order`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        { price: PACK_PRICE_ID, quantity: qty },
        { price: DELIVERY_PRICE_ID, quantity: 1 },
      ],
      metadata: { flavor, name, phone, address, qty: String(qty) },
      customer_email: undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return res.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err?.message ?? 'Checkout failed' });
  }
});

export default router;
