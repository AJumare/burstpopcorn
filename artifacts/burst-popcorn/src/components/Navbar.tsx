import React, { useState, useEffect } from 'react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
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
        {/* Logo */}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="flex items-center group"
        >
          <img
            src="/burst-logo.png"
            alt="Burst Popcorn Co."
            className={`transition-all duration-300 object-contain ${isScrolled ? 'w-9 h-9' : 'w-11 h-11'}`}
          />
        </a>

        {/* Desktop-only links */}
        <div className="hidden md:flex gap-10">
          {['FLAVORS', 'ORDER', 'OUR STORY', 'CONTACT'].map((item) => {
            const id = `#${item.toLowerCase().replace(/ /g, '-')}`;
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
      </div>
    </nav>
  );
}
