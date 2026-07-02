import React, { useState, useEffect } from 'react';
import { BurstLogo } from './BurstLogo';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-brand-dark/80 backdrop-blur-md py-3 shadow-lg' 
          : 'bg-brand-dark py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        {/* Logo Section */}
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-4 group"
        >
          <div className="transition-transform duration-500 group-hover:rotate-12">
            <BurstLogo size={isScrolled ? 40 : 48} />
          </div>
          <span className="font-sans font-semibold tracking-widest text-brand-gold text-sm md:text-base">
            BURST POPCORN CO.
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-10">
          {['FLAVORS', 'OUR STORY', 'CONTACT'].map((item) => {
            const id = `#${item.toLowerCase().replace(' ', '-')}`;
            return (
              <a
                key={item}
                href={id}
                onClick={(e) => scrollTo(e, id)}
                className="font-sans tracking-widest text-xs font-medium text-brand-gold hover:text-brand-cream transition-colors duration-300"
              >
                {item}
              </a>
            );
          })}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-brand-gold p-2 -mr-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div 
        className={`md:hidden absolute top-full left-0 w-full bg-brand-dark/95 backdrop-blur-md overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-64 border-b border-brand-mid/30' : 'max-h-0'
        }`}
      >
        <div className="px-6 py-4 flex flex-col gap-6">
          {['FLAVORS', 'OUR STORY', 'CONTACT'].map((item) => {
            const id = `#${item.toLowerCase().replace(' ', '-')}`;
            return (
              <a
                key={item}
                href={id}
                onClick={(e) => scrollTo(e, id)}
                className="font-sans tracking-widest text-sm font-medium text-brand-gold hover:text-brand-cream transition-colors"
              >
                {item}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
