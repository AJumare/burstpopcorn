import React from 'react';
import { motion } from 'framer-motion';

export default function Marquee() {
  const phrases = [
    "Small Batch Made in Nigeria",
    "Premium Ingredients Bold Flavor",
    "Made to Share Made to Love",
    "Fresh Popped with Care"
  ];

  return (
    <div className="w-full bg-brand-gold py-6 overflow-hidden relative flex items-center">
      <motion.div 
        className="flex whitespace-nowrap items-center"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ 
          repeat: Infinity, 
          ease: "linear", 
          duration: 20 
        }}
      >
        {/* Double the array for seamless looping */}
        {[...phrases, ...phrases, ...phrases, ...phrases].map((phrase, index) => (
          <React.Fragment key={index}>
            <span className="font-sans text-brand-dark tracking-[0.2em] text-xs sm:text-sm md:text-base font-semibold px-8">
              {phrase.toUpperCase()}
            </span>
            <span className="text-brand-dark/40">✦</span>
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}
