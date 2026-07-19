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

  const links = ['FLAVORS', 'ORDER', 'OUR STORY', 'CONTACT'];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-brand-dark/80 backdrop-blur-md py-2 shadow-lg'
          : 'bg-brand-dark py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-12 flex justify-between items-center gap-3">
        {/* Logo */}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="flex items-center flex-shrink-0"
        >
          <img
            src="/burst-logo.png"
            alt="Burst Popcorn Co."
            className={`transition-all duration-300 object-contain ${isScrolled ? 'w-8 h-8' : 'w-10 h-10'}`}
          />
        </a>

        {/* Nav links — visible on all screen sizes */}
        <div className="flex gap-3 md:gap-10 flex-wrap justify-end">
          {links.map((item) => {
            const id = `#${item.toLowerCase().replace(/ /g, '-')}`;
            return (
              <a
                key={item}
                href={id}
                onClick={(e) => scrollTo(e, id)}
                className="font-sans tracking-widest text-[10px] md:text-xs font-medium text-brand-gold hover:text-brand-cream transition-colors duration-300 whitespace-nowrap"
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
