import React from 'react';

interface SchoolBrandLogoProps {
  logoUrl?: string;
  schoolName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const SchoolBrandLogo: React.FC<SchoolBrandLogoProps> = ({
  logoUrl,
  schoolName = 'Escuela Preparatoria Oficial N. 264',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36',
  };

  // If a custom image logo is provided and it's not default placeholder, render image
  const hasCustomImage = logoUrl && !logoUrl.includes('placeholder') && !logoUrl.includes('Screenshot');

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {hasCustomImage ? (
        <div className={`${sizeClasses[size]} rounded-2xl overflow-hidden border border-red-900/40 bg-zinc-950 shadow-xl flex items-center justify-center p-1`}>
          <img src={logoUrl} alt={schoolName} className="w-full h-full object-contain" />
        </div>
      ) : (
        /* Vector Emblem for EPO 264 / Institutional Mascot (Identical to reference screenshot) */
        <div className="flex flex-col items-center">
          <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
            {/* Ambient soft crimson glow behind logo */}
            <div className="absolute inset-0 bg-red-600/20 rounded-full blur-xl pointer-events-none" />

            <svg
              viewBox="0 0 200 200"
              className="w-full h-full drop-shadow-[0_4px_12px_rgba(220,38,38,0.35)]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <path
                  id="textArcPath"
                  d="M 28 100 A 72 72 0 0 1 172 100"
                  fill="none"
                />
                <radialGradient id="emblemGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#dc2626" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Background badge circle */}
              <circle cx="100" cy="100" r="94" fill="#08080a" stroke="#27272a" strokeWidth="2" />
              <circle cx="100" cy="100" r="88" fill="url(#emblemGlow)" />
              <circle cx="100" cy="100" r="82" fill="none" stroke="#991b1b" strokeWidth="1.5" strokeDasharray="3 3" />

              {/* Top Curved Text */}
              <text
                fill="#ffffff"
                fontSize="9"
                fontWeight="900"
                letterSpacing="1.8"
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              >
                <textPath href="#textArcPath" startOffset="50%" textAnchor="middle">
                  ESCUELA PREPARATORIA OFICIAL N. 264
                </textPath>
              </text>

              {/* Wolf / Mascot Stylized Head */}
              <g transform="translate(100, 102) scale(0.68) translate(-100, -100)">
                {/* Outer shadow / silhouette */}
                <path
                  d="M100 20 L135 60 L170 70 L155 105 L175 125 L145 140 L125 175 L100 160 L75 175 L55 140 L25 125 L45 105 L30 70 L65 60 Z"
                  fill="#7f1d1d"
                  opacity="0.4"
                />

                {/* Crimson Crest & Mane */}
                <path
                  d="M100 25 C115 45 130 55 150 68 C165 78 160 95 150 110 C162 120 148 138 135 148 C120 160 108 168 100 172 C92 168 80 160 65 148 C52 138 38 120 50 110 C40 95 35 78 50 68 C70 55 85 45 100 25 Z"
                  fill="#dc2626"
                />

                {/* Dark Inner Contour */}
                <path
                  d="M100 38 C112 55 122 65 138 74 C148 83 145 95 138 105 C145 114 135 128 126 136 C114 146 106 152 100 156 C94 152 86 146 74 136 C65 128 55 114 62 105 C55 95 52 83 62 74 C78 65 88 55 100 38 Z"
                  fill="#09090b"
                />

                {/* Sharp White Face & Muzzle Highlights */}
                <path
                  d="M100 52 L112 80 L132 88 L120 102 L128 116 L112 124 L100 146 L88 124 L72 116 L80 102 L68 88 L88 80 Z"
                  fill="#f4f4f5"
                />

                {/* Snout and Crimson Nose */}
                <polygon points="100,105 107,118 93,118" fill="#b91c1c" />
                <polygon points="100,118 104,132 96,132" fill="#09090b" />

                {/* Wolf Eyes */}
                <polygon points="86,92 94,96 87,100 82,96" fill="#dc2626" />
                <polygon points="114,92 118,96 113,100 106,96" fill="#dc2626" />
                <circle cx="89" cy="96" r="1.5" fill="#ffffff" />
                <circle cx="111" cy="96" r="1.5" fill="#ffffff" />

                {/* Sharp Ear Highlights */}
                <polygon points="82,48 94,68 86,70" fill="#ffffff" />
                <polygon points="118,48 114,70 106,68" fill="#ffffff" />
              </g>

              {/* Bottom Acronym */}
              <text
                x="100"
                y="186"
                fill="#ffffff"
                fontSize="11"
                fontWeight="900"
                letterSpacing="3"
                textAnchor="middle"
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              >
                E. P. O. 264
              </text>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
