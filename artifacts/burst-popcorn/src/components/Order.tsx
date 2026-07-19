import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const WHATSAPP_NUMBER = '2349025862461';

const FLAVORS = [
  { value: 'salted-caramel', label: 'Salted Caramel', available: true },
  { value: 'caramel-cheese', label: 'Caramel & Cheese Mix', available: false },
  { value: 'peanut-brittle', label: 'Peanut Brittle', available: false },
];

const PRODUCT_PRICE = 6500;
const DELIVERY_FEE = 4500;

const STATES = [
  { value: 'abuja', label: 'Abuja (FCT)', available: true },
  { value: 'lagos', label: 'Lagos', available: false },
  { value: 'portharcourt', label: 'Port Harcourt', available: false },
  { value: 'kano', label: 'Kano', available: false },
  { value: 'ibadan', label: 'Ibadan', available: false },
  { value: 'other', label: 'Other State', available: false },
];

export default function Order() {
  const [flavor, setFlavor] = useState('salted-caramel');
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState('abuja');
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const selectedState = STATES.find(s => s.value === state);
  const deliveryAvailable = selectedState?.available ?? false;
  const subtotal = PRODUCT_PRICE * quantity;
  const total = deliveryAvailable ? subtotal + DELIVERY_FEE : subtotal;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Please enter your name.';
    if (!form.phone.trim()) e.phone = 'Please enter your phone number.';
    if (!form.address.trim()) e.address = 'Please enter your delivery address.';
    if (!deliveryAvailable) e.state = 'Delivery is not yet available in your area.';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    const selectedFlavor = FLAVORS.find(f => f.value === flavor)?.label ?? flavor;
    const message =
      `New Order — Burst Popcorn Co.\n\n` +
      `Flavor: ${selectedFlavor}\n` +
      `Quantity: ${quantity} pack${quantity > 1 ? 's' : ''}\n` +
      `Subtotal: ₦${subtotal.toLocaleString()}\n` +
      `Delivery (Abuja): ₦${DELIVERY_FEE.toLocaleString()}\n` +
      `Total: ₦${total.toLocaleString()}\n\n` +
      `— Customer Details —\n` +
      `Name: ${form.name}\n` +
      `Phone: ${form.phone}\n` +
      `Address: ${form.address}`;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section id="order" className="w-full bg-brand-dark py-24 px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full border-2 border-brand-gold mx-auto mb-8 flex items-center justify-center">
            <span className="text-brand-gold text-2xl">✦</span>
          </div>
          <h2 className="font-serif text-4xl text-brand-cream mb-4">Order Received</h2>
          <p className="font-serif text-brand-cream/60 text-xl italic mb-8">
            Your details have been sent. We'll be in touch shortly to confirm your order.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="font-sans text-brand-gold tracking-widest text-xs uppercase border border-brand-gold/40 px-6 py-3 hover:border-brand-gold transition-colors"
          >
            Place Another Order
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="order" className="w-full bg-brand-dark py-10 md:py-24 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 md:mb-16"
        >
          <h2 className="font-serif text-3xl md:text-6xl text-brand-cream mb-3 md:mb-4">Place an Order</h2>
          <div className="w-12 h-px bg-brand-gold mx-auto mb-3 md:mb-6" />
          <p className="font-serif text-brand-cream/60 text-base md:text-xl italic max-w-xl mx-auto">
            Fill in your details and we'll confirm and deliver to your door.
          </p>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="max-w-2xl mx-auto"
        >
          <form
            onSubmit={handleSubmit}
            className="bg-[#1e160e] border border-brand-mid/40 p-5 md:p-12 flex flex-col gap-4 md:gap-7"
          >
            {/* Flavor */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans tracking-widest text-xs text-brand-cream/50 uppercase">Flavor</label>
              <div className="relative">
                <select
                  value={flavor}
                  onChange={e => setFlavor(e.target.value)}
                  className="w-full appearance-none bg-transparent border border-brand-mid/50 text-brand-cream font-sans text-sm px-3 py-2.5 pr-10 focus:outline-none focus:border-brand-gold transition-colors cursor-pointer"
                >
                  {FLAVORS.map(f => (
                    <option
                      key={f.value}
                      value={f.value}
                      disabled={!f.available}
                      className="bg-[#1e160e] text-brand-cream disabled:text-brand-cream/40"
                    >
                      {f.label}{!f.available ? ' — Coming Soon' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gold pointer-events-none" />
              </div>
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans tracking-widest text-xs text-brand-cream/50 uppercase">Quantity</label>
              <div className="flex items-center gap-0">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-9 h-9 border border-brand-mid/50 text-brand-cream/70 hover:border-brand-gold hover:text-brand-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-sans text-lg"
                >
                  −
                </button>
                <div className="w-12 h-9 border-t border-b border-brand-mid/50 flex items-center justify-center">
                  <span className="font-sans text-brand-cream font-medium">{quantity}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.min(20, q + 1))}
                  disabled={quantity >= 20}
                  className="w-9 h-9 border border-brand-mid/50 text-brand-cream/70 hover:border-brand-gold hover:text-brand-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-sans text-lg"
                >
                  +
                </button>
                <span className="ml-3 font-sans text-brand-cream/40 text-xs tracking-wider">
                  ₦{PRODUCT_PRICE.toLocaleString()} / pack
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-brand-mid/30" />

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans tracking-widest text-xs text-brand-cream/50 uppercase">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                className="bg-transparent border border-brand-mid/50 text-brand-cream font-sans text-sm px-3 py-2.5 placeholder:text-brand-cream/20 focus:outline-none focus:border-brand-gold transition-colors"
              />
              {errors.name && <span className="font-sans text-xs text-red-400">{errors.name}</span>}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans tracking-widest text-xs text-brand-cream/50 uppercase">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+234 800 000 0000"
                className="bg-transparent border border-brand-mid/50 text-brand-cream font-sans text-sm px-3 py-2.5 placeholder:text-brand-cream/20 focus:outline-none focus:border-brand-gold transition-colors"
              />
              {errors.phone && <span className="font-sans text-xs text-red-400">{errors.phone}</span>}
            </div>

            {/* State */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans tracking-widest text-xs text-brand-cream/50 uppercase">State</label>
              <div className="relative">
                <select
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full appearance-none bg-transparent border border-brand-mid/50 text-brand-cream font-sans text-sm px-3 py-2.5 pr-10 focus:outline-none focus:border-brand-gold transition-colors cursor-pointer"
                >
                  {STATES.map(s => (
                    <option key={s.value} value={s.value} className="bg-[#1e160e] text-brand-cream">
                      {s.label}{!s.available ? ' — Unavailable' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gold pointer-events-none" />
              </div>
              {!deliveryAvailable && state !== 'abuja' && (
                <span className="font-sans text-xs text-brand-gold/70">
                  Delivery is currently only available in Abuja. We're expanding soon.
                </span>
              )}
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans tracking-widest text-xs text-brand-cream/50 uppercase">Delivery Address</label>
              <textarea
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Street address, area, landmark…"
                rows={2}
                className="bg-transparent border border-brand-mid/50 text-brand-cream font-sans text-sm px-3 py-2.5 placeholder:text-brand-cream/20 focus:outline-none focus:border-brand-gold transition-colors resize-none"
              />
              {errors.address && <span className="font-sans text-xs text-red-400">{errors.address}</span>}
            </div>

            {/* Price summary */}
            <div className="border border-brand-mid/30 p-3 md:p-5 flex flex-col gap-2">
              <div className="flex justify-between font-sans text-xs text-brand-cream/50 tracking-wider uppercase">
                <span>{quantity} × Salted Caramel</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-sans text-xs text-brand-cream/50 tracking-wider uppercase">
                <span>Delivery (Abuja)</span>
                <span>{deliveryAvailable ? `₦${DELIVERY_FEE.toLocaleString()}` : '—'}</span>
              </div>
              <div className="border-t border-brand-mid/30 pt-2 mt-1 flex justify-between font-sans text-sm text-brand-gold tracking-wider uppercase font-semibold">
                <span>Total</span>
                <span>{deliveryAvailable ? `₦${total.toLocaleString()}` : '—'}</span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!deliveryAvailable}
              className="w-full bg-brand-gold hover:bg-[#c48a30] text-brand-dark font-sans font-semibold tracking-widest text-sm uppercase py-3 md:py-4 transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Place Order
            </button>

            {errors.state && (
              <p className="font-sans text-xs text-brand-gold/70 text-center -mt-3">{errors.state}</p>
            )}
          </form>
        </motion.div>
      </div>
    </section>
  );
}
