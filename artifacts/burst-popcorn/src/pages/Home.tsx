import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Flavors from '@/components/Flavors';
import Marquee from '@/components/Marquee';
import Order from '@/components/Order';
import About from '@/components/About';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col selection:bg-brand-gold selection:text-brand-dark">
      <Navbar />
      
      <main className="flex-1 w-full">
        <Hero />
        <Marquee />
        <Flavors />
        <Order />
        <Marquee />
        <About />
      </main>

      <Footer />
    </div>
  );
}
