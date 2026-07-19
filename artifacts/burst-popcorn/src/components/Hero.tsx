import React from 'react';
import { motion } from 'framer-motion';

export default function Hero() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <section className="relative h-[100dvh] w-full flex items-center justify-center overflow-hidden">
      {/* Background Image & Overlays */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/hero-brand.png" 
          alt="Burst Popcorn Co. packaging" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/80 via-brand-dark/55 to-brand-dark/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-6 md:px-12 pt-20">
        <motion.div 
          className="max-w-3xl"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item} className="inline-flex items-center gap-3 mb-6">
            <span className="font-sans tracking-widest text-brand-gold text-xs sm:text-sm font-semibold uppercase">
              Gourmet · Small Batch · Nigeria
            </span>
          </motion.div>
          
          <motion.h1 
            variants={item}
            className="font-serif text-brand-cream text-6xl sm:text-7xl md:text-8xl leading-[1.1] mb-8"
          >
            Something<br />
            <span className="text-brand-gold italic font-medium pr-2">Remarkable</span><br />
            Is Popping
          </motion.h1>

          <motion.div variants={item} className="h-px w-16 md:w-24 bg-brand-gold mb-8" />

          <motion.p 
            variants={item}
            className="font-sans tracking-widest text-brand-cream/80 text-sm sm:text-base uppercase mb-10"
          >
            Gourmet Popcorn. Remarkable Flavor.
          </motion.p>

        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="w-px h-16 bg-brand-mid/50 relative overflow-hidden">
          <motion.div 
            className="w-full h-full bg-brand-gold absolute top-0 left-0"
            initial={{ y: '-100%' }}
            animate={{ y: '100%' }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.5, 
              ease: "easeInOut" 
            }}
          />
        </div>
      </motion.div>
    </section>
  );
}
