import React from 'react';
import { motion } from 'framer-motion';

export default function Flavors() {
  return (
    <section id="flavors" className="w-full bg-brand-dark py-20 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-5xl md:text-6xl text-brand-cream mb-4">The Collection</h2>
          <div className="w-12 h-px bg-brand-gold mx-auto"></div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Salted Caramel */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="group relative h-[500px] md:h-[600px] w-full rounded-sm overflow-hidden flex flex-col justify-end p-8 cursor-pointer"
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="/gen/salted-caramel.jpg" 
                alt="Salted Caramel Popcorn" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-70" />
            </div>
            
            <div className="relative z-10 text-center transform transition-transform duration-500 translate-y-4 group-hover:translate-y-0">
              <div className="inline-block bg-brand-gold text-brand-dark px-4 py-1.5 rounded-full font-sans tracking-widest text-xs font-bold mb-4">
                SALTED CARAMEL
              </div>
              <p className="font-serif text-brand-cream/80 text-xl md:text-2xl italic opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                Crafted in Small Batches · Rich Caramel Glaze
              </p>
            </div>
          </motion.div>

          {/* Caramel & Cheese */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="group relative h-[500px] md:h-[600px] w-full rounded-sm overflow-hidden flex flex-col justify-end p-8 cursor-pointer"
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="/gen/caramel-cheese.jpg" 
                alt="Caramel and Cheese Mix Popcorn" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-70" />
            </div>
            
            <div className="relative z-10 text-center transform transition-transform duration-500 translate-y-4 group-hover:translate-y-0">
              <div className="inline-block bg-brand-gold text-brand-dark px-4 py-1.5 rounded-full font-sans tracking-widest text-xs font-bold mb-4">
                CARAMEL & CHEESE MIX
              </div>
              <p className="font-serif text-brand-cream/80 text-xl md:text-2xl italic opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                Bold Flavor. Beautifully Crafted.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
