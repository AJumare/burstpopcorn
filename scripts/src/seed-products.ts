import { getUncachableStripeClient } from './stripeClient';

async function seedProducts() {
  const stripe = await getUncachableStripeClient();

  // ── Salted Caramel Pack ─────────────────────────────────────────────────
  const existing = await stripe.products.search({
    query: "name:'Salted Caramel Popcorn' AND active:'true'",
  });

  let packPriceId: string;

  if (existing.data.length > 0) {
    console.log('Salted Caramel Popcorn product already exists, fetching price…');
    const prices = await stripe.prices.list({ product: existing.data[0].id, active: true, limit: 1 });
    packPriceId = prices.data[0].id;
  } else {
    const product = await stripe.products.create({
      name: 'Salted Caramel Popcorn',
      description: 'Small-batch gourmet salted caramel popcorn. One pack.',
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 400,   // $4.00 USD per pack (≈ ₦6,500)
      currency: 'usd',
    });
    packPriceId = price.id;
    console.log(`Created product ${product.id}, price ${price.id}`);
  }

  // ── Abuja Delivery ──────────────────────────────────────────────────────
  const existingDelivery = await stripe.products.search({
    query: "name:'Abuja Delivery' AND active:'true'",
  });

  let deliveryPriceId: string;

  if (existingDelivery.data.length > 0) {
    console.log('Abuja Delivery product already exists, fetching price…');
    const prices = await stripe.prices.list({ product: existingDelivery.data[0].id, active: true, limit: 1 });
    deliveryPriceId = prices.data[0].id;
  } else {
    const deliveryProduct = await stripe.products.create({
      name: 'Abuja Delivery',
      description: 'Flat delivery fee for Abuja (FCT).',
    });
    const deliveryPrice = await stripe.prices.create({
      product: deliveryProduct.id,
      unit_amount: 300,   // $3.00 USD (≈ ₦4,500)
      currency: 'usd',
    });
    deliveryPriceId = deliveryPrice.id;
    console.log(`Created delivery product ${deliveryProduct.id}, price ${deliveryPrice.id}`);
  }

  console.log('\n✓ Done! Set these env vars:\n');
  console.log(`STRIPE_PACK_PRICE_ID=${packPriceId}`);
  console.log(`STRIPE_DELIVERY_PRICE_ID=${deliveryPriceId}`);
}

seedProducts().catch((err) => { console.error(err); process.exit(1); });
