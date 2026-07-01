import { useRef } from "react";
import { motion } from "framer-motion";
import { Building2, Zap, HeartHandshake, Utensils } from "lucide-react";
import { transitionEase, transitionSpring } from "@/lib/motion";

export default function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={containerRef} 
      className="w-full max-w-lg aspect-square relative flex items-center justify-center select-none"
    >
      {/* Premium Backlight Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Main Animated Ecosystem Vector */}
      <div className="w-full h-full relative p-6 animate-float">
        <svg 
          viewBox="0 0 400 400" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10"
        >
          {/* Connection Lines (Paths) */}
          {/* PG Kitchen -> AI Core */}
          <path 
            d="M 100 200 Q 200 130 200 200" 
            stroke="rgba(16, 185, 129, 0.25)" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
          <motion.path 
            d="M 100 200 Q 200 130 200 200" 
            stroke="url(#trail-primary)" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            strokeDasharray="40 160"
            animate={{
              strokeDashoffset: [200, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Resident Confirmed -> AI Core */}
          <path 
            d="M 200 100 Q 200 150 200 200" 
            stroke="rgba(16, 185, 129, 0.2)" 
            strokeWidth="2.5" 
            strokeLinecap="round"
          />
          <motion.path 
            d="M 200 100 Q 200 150 200 200" 
            stroke="url(#trail-primary)" 
            strokeWidth="3" 
            strokeLinecap="round"
            strokeDasharray="30 120"
            animate={{
              strokeDashoffset: [150, 0]
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* AI Core -> NGO Pickup */}
          <path 
            d="M 200 200 Q 200 270 300 200" 
            stroke="rgba(16, 185, 129, 0.25)" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
          <motion.path 
            d="M 200 200 Q 200 270 300 200" 
            stroke="url(#trail-accent)" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            strokeDasharray="40 160"
            animate={{
              strokeDashoffset: [200, 0]
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* SVG Defs for Premium Gradients */}
          <defs>
            <linearGradient id="trail-primary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0)" />
              <stop offset="50%" stopColor="rgba(16, 185, 129, 1)" />
              <stop offset="100%" stopColor="rgba(52, 211, 153, 0)" />
            </linearGradient>
            <linearGradient id="trail-accent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(52, 211, 153, 0)" />
              <stop offset="50%" stopColor="rgba(16, 185, 129, 1)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
            </linearGradient>
            
            <radialGradient id="glow-center" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
              <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
            </radialGradient>
          </defs>

          {/* Central Glow Field */}
          <circle cx="200" cy="200" r="80" fill="url(#glow-center)" className="animate-pulse" />
        </svg>

        {/* UI Overlay Nodes (Lucide + Tailwind glass surfaces) */}
        
        {/* Node 1: PG Owner Kitchen (Left) */}
        <div className="absolute left-[5%] top-[40%] -translate-y-1/2 flex flex-col items-center group">
          <div className="w-14 h-14 rounded-2xl bg-zinc-950/80 border border-white/5 shadow-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-primary/40">
            <Building2 size={22} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-[9px] uppercase tracking-widest font-black text-muted-foreground mt-2 group-hover:text-foreground transition-colors">PG Owner</span>
        </div>

        {/* Node 2: Residents Input (Top) */}
        <div className="absolute left-1/2 top-[5%] -translate-x-1/2 flex flex-col items-center group">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950/80 border border-white/5 shadow-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-primary/40">
            <Utensils size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-[9px] uppercase tracking-widest font-black text-muted-foreground mt-2 group-hover:text-foreground transition-colors">Residents</span>
        </div>

        {/* Node 3: NGO Network (Right) */}
        <div className="absolute right-[5%] top-[40%] -translate-y-1/2 flex flex-col items-center group">
          <div className="w-14 h-14 rounded-2xl bg-zinc-950/80 border border-white/5 shadow-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-primary/40">
            <HeartHandshake size={22} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-[9px] uppercase tracking-widest font-black text-muted-foreground mt-2 group-hover:text-foreground transition-colors">NGO Network</span>
        </div>

        {/* Central Core: MealSync AI Hub */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="relative">
            {/* Pulsing Backlight */}
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-primary to-emerald-600 border border-white/10 flex items-center justify-center shadow-[0_20px_50px_rgba(16,185,129,0.3)] relative z-10 transition-transform duration-500 hover:scale-105">
              <Zap size={32} className="text-primary-foreground animate-pulse" />
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-widest font-black text-primary mt-3 text-shadow shadow-primary/20">MealSync AI</span>
        </div>
      </div>
    </div>
  );
}
