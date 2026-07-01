import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  iconOnly?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  size = "md",
  showText = true,
  iconOnly = false,
}) => {
  const sizeMap = {
    sm: { icon: 32, text: "text-lg" },
    md: { icon: 40, text: "text-2xl" },
    lg: { icon: 56, text: "text-3xl" },
    xl: { icon: 80, text: "text-4xl" },
  };

  const { icon: iconSize, text: textSize } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Precision Vector Representation of Reference Logo */}
      <div className="relative flex items-center justify-center shrink-0" style={{ width: iconSize, height: iconSize }}>
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4caf50" />
              <stop offset="100%" stopColor="#1b5e20" />
            </linearGradient>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#81c784" />
              <stop offset="50%" stopColor="#388e3c" />
              <stop offset="100%" stopColor="#1b5e20" />
            </linearGradient>
          </defs>

          {/* Background Inner Plate Circle */}
          <circle cx="100" cy="100" r="62" fill="#e8f5e9" fillOpacity="0.8" stroke="#a5d6a7" strokeWidth="3" />
          <circle cx="100" cy="100" r="52" stroke="#c8e6c9" strokeWidth="2" strokeDasharray="4 2" />

          {/* Outer Curved Ring Arc */}
          <path d="M 45 125 A 68 68 0 1 1 172 100" fill="none" stroke="url(#ringGradient)" strokeWidth="8" strokeLinecap="round" />

          {/* Integrated Fork Icon on Left Ring */}
          <g fill="url(#ringGradient)">
            {/* Fork Handle */}
            <path d="M 38 120 C 35 135 38 155 42 165 C 43 167 46 167 46 164 C 43 154 41 138 43 124 Z" />
            {/* Fork Head & Prongs */}
            <path d="M 32 92 L 32 108 C 32 114 36 118 42 118 C 48 118 52 114 52 108 L 52 92 C 52 90 50 90 50 92 L 50 106 C 50 110 48 112 46 112 C 44 112 44 110 44 106 L 44 92 C 44 90 42 90 42 92 L 42 106 C 42 110 40 112 38 112 C 36 112 36 110 36 106 L 36 92 C 36 90 32 90 32 92 Z" />
          </g>

          {/* Botanical Leaves at Bottom Right */}
          <g transform="translate(10, 5)">
            {/* Large Leaf */}
            <path d="M 100 165 C 150 165 175 130 170 85 C 130 110 100 135 100 165 Z" fill="url(#leafGradient)" />
            <path d="M 105 160 C 130 138 155 115 168 92" fill="none" stroke="#e8f5e9" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

            {/* Small Leaf */}
            <path d="M 95 155 C 120 150 135 130 125 105 C 100 120 90 140 95 155 Z" fill="#66bb6a" />
            <path d="M 97 152 C 110 138 122 122 124 110" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          </g>

          {/* Central Bold Green 'M' Logo */}
          <path d="M 72 132 V 68 L 100 100 L 128 68 V 132" fill="none" stroke="#2e7d32" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Brand Text Header & Subtitle */}
      {showText && !iconOnly && (
        <div className="flex flex-col">
          <div className={`font-black tracking-tight flex items-center leading-none ${textSize}`}>
            <span className="text-[#1b5e20] dark:text-[#66bb6a]">Meal</span>
            <span className="text-[#4caf50] dark:text-[#81c784]">Sync</span>
          </div>
          {size !== "sm" && (
            <span className="text-[9px] font-bold tracking-[0.2em] text-[#2e7d32] dark:text-[#a5d6a7] uppercase mt-1 leading-none">
              Connecting Surplus to Need
            </span>
          )}
        </div>
      )}
    </div>
  );
};
