import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '234XXXXXXXXXX';

const PRODUCT = {
  name: 'Salted Caramel',
  tagline: 'Rich caramel glaze. Hand-crafted in small batches. Perfectly balanced sweet and salty.',
  price: 'Price on request',
  image: '/gen/salted-caramel_2.jpg',
};

export default function Order() {
  const [quantity, setQuantity] = useState(1);

  const decrement = () => setQuantity((q) => Math.max(1, q - 1));
  const increment = () => setQuantity((q) => Math.min(10, q + 1));

  const handleOrder = () => {
    const message = `Hello Burst Popcorn Co.! 🍿\n\nI'd like to place an order:\n\n• Product: ${PRODUCT.name}\n• Quantity: ${quantity} pack${quantity > 1 ? 's' : ''}\n\nCould you please confirm the price, availability, and delivery details? Thank you!`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="order" className="w-full bg-brand-dark py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-5xl md:text-6xl text-brand-cream mb-4">Place an Order</h2>
          <div className="w-12 h-px bg-brand-gold mx-auto mb-6" />
          <p className="font-serif text-brand-cream/60 text-xl italic max-w-xl mx-auto">
            Ready to pop? Order directly via WhatsApp and we'll confirm the details with you.
          </p>
        </motion.div>

        {/* Order card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="max-w-3xl mx-auto"
        >
          <div className="border border-brand-mid/50 rounded-sm overflow-hidden bg-[#1e160e]">
            <div className="flex flex-col md:flex-row">
              {/* Product image */}
              <div className="md:w-2/5 h-64 md:h-auto relative overflow-hidden flex-shrink-0">
                <img
                  src={PRODUCT.image}
                  alt={PRODUCT.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#1e160e] via-[#1e160e]/20 to-transparent" />
              </div>

              {/* Order panel */}
              <div className="flex-1 p-8 md:p-10 flex flex-col justify-between gap-8">
                {/* Product info */}
                <div>
                  <div className="inline-block bg-brand-gold text-brand-dark px-5 py-2 font-sans tracking-widest text-xs font-bold mb-4">
                    SALTED CARAMEL
                  </div>
                  <p className="font-serif text-brand-cream/70 text-lg leading-relaxed mb-4">
                    {PRODUCT.tagline}
                  </p>
                  <p className="font-sans text-brand-cream/40 tracking-widest text-xs uppercase">
                    {PRODUCT.price}
                  </p>
                </div>

                {/* Quantity + button */}
                <div className="flex flex-col gap-5">
                  {/* Quantity selector */}
                  <div className="flex items-center gap-0">
                    <span className="font-sans text-brand-cream/50 tracking-widest text-xs uppercase mr-4">
                      Qty
                    </span>
                    <button
                      onClick={decrement}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      className="w-10 h-10 border border-brand-mid/60 text-brand-cream/70 hover:border-brand-gold hover:text-brand-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                    >
                      <Minus size={14} />
                    </button>
                    <div className="w-14 h-10 border-t border-b border-brand-mid/60 flex items-center justify-center">
                      <span className="font-sans text-brand-cream font-medium text-lg">
                        {quantity}
                      </span>
                    </div>
                    <button
                      onClick={increment}
                      disabled={quantity >= 10}
                      aria-label="Increase quantity"
                      className="w-10 h-10 border border-brand-mid/60 text-brand-cream/70 hover:border-brand-gold hover:text-brand-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* WhatsApp button */}
                  <button
                    onClick={handleOrder}
                    className="w-full bg-brand-gold hover:bg-brand-off-gold text-brand-dark font-sans font-semibold tracking-widest text-sm uppercase py-4 px-6 transition-colors duration-300 flex items-center justify-center gap-3"
                  >
                    <MessageCircle size={18} />
                    Order via WhatsApp
                  </button>

                  <p className="font-sans text-brand-cream/30 text-xs text-center tracking-wide">
                    We'll confirm price &amp; delivery on WhatsApp before processing your order.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
