import { Router } from 'express';
import { getWhopClient } from '../whopClient';

const router = Router();

const COMPANY_ID = process.env.WHOP_COMPANY_ID!;
const PRODUCT_ID = 'prod_DUQN43JUWm31x';

// Pricing in USD (Whop charges in USD)
// ₦6,500/pack ≈ $4.00 | ₦4,500 delivery ≈ $3.00
const PRICE_PER_PACK_USD = 4.00;
const DELIVERY_USD = 3.00;

// POST /api/whop/checkout
// Creates a one-time Whop plan for this order and returns the purchase URL
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

    const qty = Math.max(1, Math.min(20, Number(quantity)));
    const subtotalUSD = parseFloat((qty * PRICE_PER_PACK_USD).toFixed(2));
    const totalUSD = parseFloat((subtotalUSD + DELIVERY_USD).toFixed(2));

    const client = await getWhopClient();

    // Create a one-time plan for this specific order total
    const plan = await client.plans.create({
      product_id: PRODUCT_ID,
      plan_type: 'one_time',
      initial_price: totalUSD,
      currency: 'usd',
      internal_notes: `Order: ${qty}x ${flavor} | Customer: ${name} | Phone: ${phone} | Address: ${address}`,
      visibility: 'hidden',
    });

    // Build redirect URL back to the site
    const host = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : req.headers.origin || 'https://replit.dev';
    const redirectUrl = `${host}/?order=success&name=${encodeURIComponent(name)}`;

    // Create hosted checkout config
    const checkout = await client.checkoutConfigurations.create({
      plan_id: plan.id,
      redirect_url: redirectUrl,
      metadata: { qty: String(qty), flavor, name, phone, address },
    });

    return res.json({ purchase_url: checkout.purchase_url });
  } catch (err: any) {
    console.error('Whop checkout error:', err);
    return res.status(500).json({ error: err?.message ?? 'Checkout failed' });
  }
});

export default router;
