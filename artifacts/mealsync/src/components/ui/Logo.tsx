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
    sm: { height: 48, text: "text-sm" },
    md: { height: 72, text: "text-lg" },
    lg: { height: 96, text: "text-xl" },
    xl: { height: 128, text: "text-2xl" },
  };

  const { height, text: textSize } = sizeMap[size];

  return (
    <div className={`flex items-center gap-4 select-none ${className}`}>
      <img 
        src="/logo.png" 
        alt="MealSync Logo" 
        className="object-contain drop-shadow-md shrink-0"
        style={{ height }}
      />
      {showText && !iconOnly && (
        <span className={`font-black tracking-tight text-[var(--text-primary)] ${textSize}`}>
          MealSync AI
        </span>
      )}
    </div>
  );
};
