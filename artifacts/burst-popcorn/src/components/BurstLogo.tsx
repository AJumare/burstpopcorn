export function BurstLogo({ size = 48, className = '' }: { size?: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="60" cy="60" r="58" fill="#D59A3D" stroke="#2B1F15" strokeWidth="2" />
      
      <text x="60" y="68" fontFamily="Cormorant Garamond, serif" fontWeight="700" fontSize="62" fill="#2B1F15" textAnchor="middle" letterSpacing="-2">
        B
      </text>
      
      <circle cx="60" cy="46" r="6" fill="#D59A3D" />
      <circle cx="54" cy="51" r="4.5" fill="#D59A3D" />
      <circle cx="66" cy="51" r="5" fill="#D59A3D" />
      <circle cx="57" cy="56" r="3.5" fill="#D59A3D" />
      <circle cx="63" cy="55" r="3.5" fill="#D59A3D" />

      <path d="M 82 25 L 90 17 M 88 32 L 98 28 M 75 18 L 78 8" stroke="#2B1F15" strokeWidth="2.5" strokeLinecap="round" />

      <text x="61" y="94" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="11" fill="#2B1F15" textAnchor="middle" letterSpacing="4">BURST</text>
      <text x="60" y="106" fontFamily="DM Sans, sans-serif" fontWeight="500" fontSize="5.5" fill="#2B1F15" textAnchor="middle" letterSpacing="1">— POPCORN CO. —</text>
    </svg>
  );
}
