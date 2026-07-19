import React from 'react';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <section id="our-story" className="w-full bg-brand-cream py-6 md:py-24 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">

        {/* ── Desktop: two columns side by side ── */}
        <div className="hidden md:flex gap-24 items-start">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="w-1/2 h-[800px] rounded-t-full rounded-b-sm overflow-hidden flex-shrink-0"
          >
            <img
              src="/brand-packaging.png"
              alt="Burst Popcorn Co. packaging"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="font-serif text-6xl text-brand-dark mb-6">Welcome to Burst</h2>
            <div className="text-brand-gold text-2xl mb-10">✦</div>
            <div className="font-serif text-brand-dark/80 text-2xl leading-relaxed space-y-6">
              <p>Ever craved popcorn that actually felt worth the indulgence?</p>
              <p>Not the ordinary kind.<br />Not the ones that are all sugar, all salt, or all hype.</p>
              <p>We wanted popcorn with rich caramel, real cheese, premium ingredients, and the kind of crunch that makes you reach for just one more handful.</p>
              <p>When we couldn't find it, we created it.</p>
              <p>That's how <span className="text-brand-gold font-medium italic">BURST</span> began.</p>
              <p>
                <span className="block text-brand-gold italic">Small batches.</span>
                <span className="block text-brand-gold italic">Remarkable flavour.</span>
                <span className="block text-brand-gold italic">Made to be shared.</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Mobile: image floated left, full story wraps around + below ── */}
        <div className="md:hidden">
          <h2 className="font-serif text-2xl text-brand-dark mb-2">Welcome to Burst</h2>
          <div className="text-brand-gold text-base mb-4">✦</div>

          <div className="font-serif text-brand-dark/80 text-sm leading-relaxed">
            {/* Float the image so text wraps beside and below it */}
            <div className="float-left mr-3 mb-2 w-28 h-40 rounded-t-full rounded-b-sm overflow-hidden flex-shrink-0">
              <img
                src="/brand-packaging.png"
                alt="Burst Popcorn Co. packaging"
                className="w-full h-full object-cover object-center"
              />
            </div>

            <p className="mb-2">Ever craved popcorn that actually felt worth the indulgence?</p>
            <p className="mb-2">Not the ordinary kind. Not all sugar, all salt, or all hype.</p>
            <p className="mb-2">We wanted popcorn with rich caramel, real cheese, premium ingredients, and that crunch that makes you reach for one more handful.</p>
            <p className="mb-2">When we couldn't find it, we created it.</p>
            <p className="mb-2">That's how <span className="text-brand-gold font-medium italic">BURST</span> began.</p>

            {/* Clear float so remaining text goes full-width below image */}
            <div className="clear-both" />

            <p className="mt-2 text-brand-gold italic">
              Small batches. Remarkable flavour. Made to be shared.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
