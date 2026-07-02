import React from 'react';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <section id="our-story" className="w-full bg-brand-cream py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 lg:gap-24 items-center">
        
        {/* Image Column */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="w-full md:w-1/2 h-[600px] lg:h-[800px] rounded-t-full rounded-b-sm overflow-hidden relative"
        >
          <img 
            src="/brand-packaging.png" 
            alt="Burst Popcorn Co. packaging" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-brand-dark/0"></div>
        </motion.div>

        {/* Text Column */}
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="w-full md:w-1/2 flex flex-col"
        >
          <h2 className="font-serif text-5xl md:text-6xl text-brand-dark mb-6">Welcome to Burst</h2>
          <div className="text-brand-gold text-2xl mb-10">✦</div>
          
          <div className="font-serif text-brand-dark/80 text-xl md:text-2xl leading-relaxed space-y-6">
            <p>Ever craved popcorn that actually felt worth the indulgence?</p>
            
            <p>Not the ordinary kind.<br/>
            Not the ones that are all sugar, all salt, or all hype.</p>
            
            <p>We wanted popcorn with rich caramel, real cheese, premium ingredients, and the kind of crunch that makes you reach for just one more handful.</p>
            
            <p>When we couldn't find it, we created it.</p>
            
            <p>That's how <span className="text-brand-gold font-medium italic">BURST</span> began.</p>
            
            <p className="space-y-1 block">
              <span className="block text-brand-gold italic">Small batches.</span>
              <span className="block text-brand-gold italic">Remarkable flavour.</span>
              <span className="block text-brand-gold italic">Made to be shared.</span>
            </p>
            
            <p className="pt-4 text-brand-dark/70">This is only the beginning.</p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
