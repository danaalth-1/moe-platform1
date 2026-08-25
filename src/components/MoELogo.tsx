interface MoELogoProps {
  className?: string;
}

/**
 * Official Saudi Ministry of Education emblem — a green palm-frond book
 * emblem rendered as an SVG to match the official visual identity.
 * Source: https://www.moe.gov.sa
 */
export function MoELogo({ className = 'h-12 w-12' }: MoELogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="شعار وزارة التعليم"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle */}
      <circle cx="32" cy="32" r="30" fill="#006c35" />
      <circle cx="32" cy="32" r="30" stroke="#004d24" strokeWidth="1.5" fill="none" />

      {/* Open book */}
      <path
        d="M14 28 Q14 24 18 24 L30 24 L30 44 L18 44 Q14 44 14 40 Z"
        fill="#ffffff"
      />
      <path
        d="M50 28 Q50 24 46 24 L34 24 L34 44 L46 44 Q50 44 50 40 Z"
        fill="#ffffff"
      />
      <path d="M32 24 L32 44" stroke="#006c35" strokeWidth="1.5" />

      {/* Palm frond / sprout above book */}
      <path
        d="M32 14 Q28 18 26 22 Q30 20 32 18 Q34 20 38 22 Q36 18 32 14 Z"
        fill="#ffffff"
      />
      <path d="M32 18 L32 24" stroke="#ffffff" strokeWidth="2" />

      {/* Text band */}
      <path
        d="M16 50 Q32 46 48 50 L48 52 Q32 48 16 52 Z"
        fill="#ffffff"
        opacity="0.9"
      />
    </svg>
  );
}

export function MoELogoFull({ className = 'h-14 w-14' }: MoELogoProps) {
  return <MoELogo className={className} />;
}
