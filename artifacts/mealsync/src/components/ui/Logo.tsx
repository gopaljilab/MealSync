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
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };

  const height = sizeMap[size];

  return (
    <div className={`flex items-center select-none ${className}`}>
      <img 
        src="/logo.png" 
        alt="MealSync Logo" 
        className="object-contain drop-shadow-md"
        style={{ height }}
      />
    </div>
  );
};
