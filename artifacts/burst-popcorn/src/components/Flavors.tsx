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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12">

          {/* Salted Caramel */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="group relative h-[420px] md:h-[600px] w-full rounded-sm overflow-hidden flex flex-col justify-end p-6 md:p-8 cursor-pointer"
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="/gen/salted-caramel_2.jpg" 
                alt="Salted Caramel Popcorn" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              {/* Always-dark overlay on mobile, darkens further on desktop hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/70 to-brand-dark/40 opacity-90 md:opacity-80 transition-opacity duration-500 md:group-hover:opacity-100" />
            </div>

            {/* Description: always visible on mobile, slides in on desktop hover */}
            <div className="absolute inset-0 z-10 flex flex-col justify-center items-center px-6 md:px-8
                            md:translate-y-8 md:opacity-0 md:transition-all md:duration-500
                            md:group-hover:translate-y-0 md:group-hover:opacity-100
                            pointer-events-none">
              <h3 className="font-serif text-brand-gold text-2xl md:text-3xl mb-3 md:mb-5 drop-shadow-lg">Salted Caramel</h3>
              <p className="font-serif text-white text-sm md:text-base leading-relaxed text-center drop-shadow-lg font-medium">
                Rich, buttery caramel with a bold hit of salt in every bite. We don't hold back on the butter. Real Dairy Day butter and slow-cooked caramel, finished with a sprinkle of salt right when it's warm, so it clings to every piece. Sweet, salty, and completely addictive.
              </p>
            </div>

            <div className="relative z-20 text-center">
              <div className="inline-block bg-brand-gold text-brand-dark px-4 md:px-5 py-1 md:py-2 font-sans tracking-widest text-[10px] md:text-xs font-bold mb-2">
                SALTED CARAMEL
              </div>
              <div className="block">
                <span className="inline-block border border-brand-gold/60 text-brand-gold font-sans tracking-widest text-[9px] md:text-[10px] px-2 py-0.5 uppercase">
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
            className="group relative h-[420px] md:h-[600px] w-full rounded-sm overflow-hidden flex flex-col justify-end p-6 md:p-8 cursor-pointer"
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
              <div className="inline-block bg-brand-mid text-brand-cream px-4 md:px-5 py-1 md:py-2 font-sans tracking-widest text-[10px] md:text-xs font-bold mb-2">
                CARAMEL & CHEESE
              </div>
              <div className="block">
                <span className="inline-block border border-brand-cream/40 text-brand-cream/70 font-sans tracking-widest text-[9px] md:text-[10px] px-2 py-0.5 uppercase">
                  Coming Soon
                </span>
              </div>
            </div>
          </motion.div>

          {/* Peanut Brittle */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="group relative h-[420px] md:h-[600px] w-full rounded-sm overflow-hidden flex flex-col justify-end p-6 md:p-8 cursor-pointer"
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
              <div className="inline-block bg-brand-gold text-brand-dark px-4 md:px-5 py-1 md:py-2 font-sans tracking-widest text-[10px] md:text-xs font-bold mb-2">
                PEANUT BRITTLE
              </div>
              <div className="block">
                <span className="inline-block border border-brand-gold/60 text-brand-gold font-sans tracking-widest text-[9px] md:text-[10px] px-2 py-0.5 uppercase">
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
