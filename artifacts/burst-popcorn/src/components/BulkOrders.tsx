import { MessageCircle, ArrowUpRight } from 'lucide-react';

const enquiry = [
  'Hi Burst Popcorn! I would like to enquire about a bulk order or event.',
  '',
  'Event / delivery date: ',
  'Number of packs: ',
  'Flavour(s): ',
  'Delivery location: ',
  'Other order details: ',
].join('\n');

export default function BulkOrders() {
  return (
    <section id="bulk-orders" aria-labelledby="bulk-orders-title" className="scroll-mt-24 bg-brand-dark px-6 py-6 md:px-12 md:py-8">
      <div className="max-w-7xl mx-auto border border-brand-gold/40 bg-brand-gold/5 p-5 md:p-7 grid gap-4 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <p className="font-sans text-brand-gold text-xs font-semibold uppercase tracking-[0.2em] mb-2">More to share</p>
          <h2 id="bulk-orders-title" className="font-serif text-brand-cream text-4xl md:text-5xl mb-2">Bulk Orders &amp; Events</h2>
          <p className="font-sans text-brand-cream/85 text-base leading-relaxed max-w-xl">
            Ordering more than 10 packs, or planning an event? Contact us on WhatsApp to arrange your order.
          </p>
        </div>
        <div className="md:border-l md:border-brand-gold/30 md:pl-6">
          <p className="font-sans text-brand-cream/85 text-sm leading-relaxed mb-3">
            Send us your event or delivery date, number of packs, preferred flavours, delivery location and any other order details.
          </p>
          <a
            href={`https://wa.me/2349025862461?text=${encodeURIComponent(enquiry)}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="bulk-order-whatsapp"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-brand-gold text-brand-dark px-5 py-3 font-sans text-sm font-semibold hover:bg-brand-light-gold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold"
          >
            <MessageCircle size={20} aria-hidden="true" />
            Enquire on WhatsApp
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
