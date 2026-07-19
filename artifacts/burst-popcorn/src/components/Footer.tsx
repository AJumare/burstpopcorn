import React from 'react';

export default function Footer() {
  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer id="contact" className="bg-[#1a120c] border-t border-brand-gold/30 pt-20 pb-10 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-20">
          
          {/* Column 1: Brand */}
          <div className="flex flex-col items-start gap-6">
            <img src="/burst-logo.png" alt="Burst Popcorn Co." className="w-16 h-16 object-contain" />
            <div>
              <h3 className="font-serif text-brand-gold text-3xl font-medium mb-2">Burst Popcorn Co.</h3>
              <p className="font-serif text-brand-cream/70 text-xl italic">Something Remarkable Is Popping.</p>
            </div>
          </div>

          {/* Column 2: Explore */}
          <div className="flex flex-col gap-6 md:px-8">
            <h4 className="font-sans text-brand-cream tracking-[0.2em] text-xs font-semibold uppercase">Explore</h4>
            <div className="flex flex-col gap-4">
              <a href="#flavors" onClick={(e) => scrollTo(e, '#flavors')} className="font-serif text-brand-gold text-xl hover:text-brand-cream transition-colors w-fit">
                The Collection
              </a>
              <a href="#order" onClick={(e) => scrollTo(e, '#order')} className="font-serif text-brand-gold text-xl hover:text-brand-cream transition-colors w-fit">
                Order Now
              </a>
              <a href="#our-story" onClick={(e) => scrollTo(e, '#our-story')} className="font-serif text-brand-gold text-xl hover:text-brand-cream transition-colors w-fit">
                Our Story
              </a>
            </div>
          </div>

          {/* Column 3: Contact */}
          <div className="flex flex-col gap-6">
            <h4 className="font-sans text-brand-cream tracking-[0.2em] text-xs font-semibold uppercase">Contact</h4>
            <div className="flex flex-col gap-4 font-serif text-brand-gold text-xl">
              <a href="mailto:hello@burstpopcorn.com" className="hover:text-brand-cream transition-colors w-fit">
                hello@burstpopcorn.com
              </a>
              <a href="#" className="hover:text-brand-cream transition-colors w-fit">
                Instagram @burstpopcornco
              </a>
              <p className="text-brand-cream/70 italic mt-2">Made in Nigeria.</p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-brand-mid/30">
          <p className="font-sans text-brand-cream/50 text-xs tracking-wider">
            &copy; {new Date().getFullYear()} BURST POPCORN CO. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6 font-sans text-brand-cream/50 text-xs tracking-wider">
            <span className="cursor-pointer hover:text-brand-gold transition-colors">PRIVACY</span>
            <span className="cursor-pointer hover:text-brand-gold transition-colors">TERMS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
