import React from 'react';
import { motion } from 'framer-motion';

export default function Flavors() {
  return (
    <section id="flavors" className="w-full bg-brand-dark py-10 md:py-20 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 md:mb-16"
        >
          <h2 className="font-serif text-5xl md:text-6xl text-brand-cream mb-4">The Collection</h2>
          <div className="w-12 h-px bg-brand-gold mx-auto"></div>
        </motion.div>

        <div className="grid grid-cols-3 gap-3 md:gap-12">
          {/* Salted Caramel */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="group relative h-[220px] md:h-[600px] w-full rounded-sm overflow-hidden flex flex-col justify-end p-3 md:p-8 cursor-pointer"
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="/gen/salted-caramel_2.jpg" 
                alt="Salted Caramel Popcorn" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/30 to-transparent opacity-75 transition-opacity duration-500 group-hover:opacity-90" />
            </div>

            {/* Hover description — desktop only */}
            <div className="absolute inset-0 z-10 hidden md:flex flex-col justify-center items-center px-8 translate-y-8 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 pointer-events-none">
              <h3 className="font-serif text-brand-gold text-2xl mb-4">Salted Caramel</h3>
              <p className="font-serif text-brand-cream/85 text-sm leading-relaxed text-center">
                Rich, buttery caramel with a bold hit of salt in every bite. We don't hold back on the butter. Real Dairy Day butter and slow-cooked caramel, finished with a sprinkle of salt right when it's warm, so it clings to every piece. Sweet, salty, and completely addictive.
              </p>
            </div>
            
            <div className="relative z-20 text-center">
              <div className="inline-block bg-brand-gold text-brand-dark px-2 md:px-5 py-1 md:py-2 font-sans tracking-widest text-[9px] md:text-xs font-bold mb-2">
                SALTED CARAMEL
              </div>
              <div className="block">
                <span className="inline-block border border-brand-gold/60 text-brand-gold font-sans tracking-widest text-[8px] md:text-[10px] px-2 py-0.5 uppercase">
                  Available
                </span>
              </div>
            </div>
          </motion.div>

          {/* Caramel & Cheese */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="group relative h-[220px] md:h-[600px] w-full rounded-sm overflow-hidden flex flex-col justify-end p-3 md:p-8 cursor-pointer"
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="/gen/caramel-cheese_2.jpg" 
                alt="Caramel and Cheese Mix Popcorn" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/30 to-transparent opacity-75 transition-opacity duration-500 group-hover:opacity-55" />
            </div>
            
            <div className="relative z-10 text-center">
              <p className="font-serif text-brand-cream/70 text-lg italic mb-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100 hidden md:block">
                Bold Flavor. Beautifully Crafted.
              </p>
              <div className="inline-block bg-brand-mid text-brand-cream px-2 md:px-5 py-1 md:py-2 font-sans tracking-widest text-[9px] md:text-xs font-bold mb-2">
                CARAMEL & CHEESE
              </div>
              <div className="block">
                <span className="inline-block border border-brand-cream/40 text-brand-cream/70 font-sans tracking-widest text-[8px] md:text-[10px] px-2 py-0.5 uppercase">
                  Coming Soon
                </span>
              </div>
            </div>
          </motion.div>

          {/* Peanut Brittle Caramel */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="group relative h-[220px] md:h-[600px] w-full rounded-sm overflow-hidden flex flex-col justify-end p-3 md:p-8 cursor-pointer"
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="/gen/peanut-brittle-caramel.jpg" 
                alt="Peanut Brittle Caramel Popcorn" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/30 to-transparent opacity-75 transition-opacity duration-500 group-hover:opacity-55" />
            </div>
            
            <div className="relative z-10 text-center">
              <p className="font-serif text-brand-cream/70 text-lg italic mb-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100 hidden md:block">
                Crunchy. Buttery. Irresistible.
              </p>
              <div className="inline-block bg-brand-gold text-brand-dark px-2 md:px-5 py-1 md:py-2 font-sans tracking-widest text-[9px] md:text-xs font-bold mb-2">
                PEANUT BRITTLE
              </div>
              <div className="block">
                <span className="inline-block border border-brand-gold/60 text-brand-gold font-sans tracking-widest text-[8px] md:text-[10px] px-2 py-0.5 uppercase">
                  Available
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
