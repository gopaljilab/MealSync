import { forwardRef, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "./button";
import { Input } from "./input";
import { LucideIcon } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { transitionSpring, transitionEase } from "@/lib/motion";

// 1. SectionContainer
export const SectionContainer = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { dense?: boolean }>(
  ({ className, dense = false, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn(
          "px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full",
          dense ? "py-12 md:py-16" : "py-24 md:py-32",
          className
        )}
        {...props}
      />
    );
  }
);
SectionContainer.displayName = "SectionContainer";

// 2. SectionHeading
export const SectionHeading = ({
  title,
  subtitle,
  centered = false,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  centered?: boolean;
  className?: string;
}) => (
  <div className={cn("mb-12 md:mb-16", centered && "text-center", className)}>
    <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 text-foreground">
      {title}
    </h2>
    {subtitle && (
      <p className={cn("text-lg text-muted-foreground font-medium", centered && "max-w-2xl mx-auto")}>
        {subtitle}
      </p>
    )}
  </div>
);

// 3. GlassCard
export const GlassCard = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-[var(--surface-primary)] border border-[var(--border-strong)] shadow-sm rounded-2xl p-6 md:p-8",
          className
        )}
        {...props}
      />
    );
  }
);
GlassCard.displayName = "GlassCard";

// 4. PremiumCard (Cursor-interactive spotlight border effect inspired by Stripe)
export const PremiumCard = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-primary)] p-6 md:p-8 transition-all duration-300 hover:shadow-lg overflow-hidden",
        className
      )}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              rgba(16, 185, 129, 0.04),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// 5. BentoGrid & BentoCard
export const BentoGrid = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6", className)}>
      {children}
    </div>
  );
};

export const BentoCard = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { colSpan?: number }>(
  ({ className, colSpan, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-[var(--surface-primary)] text-[var(--text-primary)] border border-[var(--border-strong)] rounded-2xl p-6 md:p-8 flex flex-col justify-between group hover:border-[var(--brand-accent)]/20 transition-all duration-300 shadow-sm hover:shadow-md",
          colSpan === 2 && "md:col-span-2",
          colSpan === 3 && "md:col-span-3",
          className
        )}
        {...props}
      />
    );
  }
);
BentoCard.displayName = "BentoCard";

// 6. GlowButton
export const GlowButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "relative overflow-hidden shadow-sm active:scale-[0.98] transition-all duration-200 font-bold",
          className
        )}
        {...props}
      />
    );
  }
);
GlowButton.displayName = "GlowButton";

// 7. StatusBadge (Static operational badge with pulsing dot)
export const StatusBadge = ({
  status = "Operational",
  className,
}: {
  status?: "Operational" | "Active" | "Optimized" | "Processing" | "Confirmed" | string;
  className?: string;
}) => {
  const isHealthy = ["Operational", "Active", "Optimized", "Confirmed"].includes(status);
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest select-none",
        isHealthy 
          ? "text-[var(--status-success)] border-[var(--status-success)]/20 bg-[var(--status-success)]/5"
          : "text-[var(--status-warning)] border-[var(--status-warning)]/20 bg-[var(--status-warning)]/5",
        className
      )}
    >
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          isHealthy ? "bg-[var(--status-success)] animate-pulse-ring" : "bg-[var(--status-warning)] animate-pulse-warning"
        )}
      />
      <span>{status}</span>
    </div>
  );
};

// 8. AnimatedCounter
export const AnimatedCounter = ({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    const duration = 1500; // 1.5s
    const totalMiliseconds = duration;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 20);
    
    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMiliseconds / incrementTime));
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className={cn("font-black tracking-tighter", className)}>
      {count.toLocaleString()}{suffix}
    </span>
  );
};

// 9. DashboardCard (Sleek SaaS Metric Card)
export const DashboardCard = ({
  title,
  value,
  delta,
  deltaType = "neutral",
  subtext,
  icon: Icon,
  className,
}: {
  title: string;
  value: React.ReactNode;
  delta?: string | number;
  deltaType?: "success" | "warning" | "neutral";
  subtext?: string;
  icon?: LucideIcon;
  className?: string;
}) => {
  return (
    <GlassCard className={cn("relative overflow-hidden group hover:border-[var(--brand-accent)]/20 transition-colors p-5 md:p-6", className)}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{title}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--brand-accent)] transition-colors">
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-primary)]">{value}</h3>
        {delta && (
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              deltaType === "success" && "bg-[var(--status-success)]/10 text-[var(--status-success)]",
              deltaType === "warning" && "bg-[var(--status-warning)]/10 text-[var(--status-warning)]",
              deltaType === "neutral" && "bg-[var(--surface-secondary)] text-[var(--text-secondary)]"
            )}
          >
            {delta}
          </span>
        )}
      </div>
      {subtext && <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium">{subtext}</p>}
    </GlassCard>
  );
};

// 10. PremiumInput
export const PremiumInput = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        className={cn(
          "h-10 rounded-xl bg-[var(--surface-primary)] border border-[var(--border-strong)] focus-visible:ring-[var(--brand-accent)]/20 focus-visible:border-[var(--brand-accent)] transition-all duration-200 placeholder:text-[var(--text-muted)] text-sm font-medium",
          className
        )}
        {...props}
      />
    );
  }
);
PremiumInput.displayName = "PremiumInput";

// 11. FloatingLabelInput
export const FloatingLabelInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { label: string }
>(({ className, label, value, onChange, ...props }, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  useEffect(() => {
    setHasValue(!!value);
  }, [value]);

  return (
    <div className="relative w-full">
      <input
        ref={ref}
        value={value}
        onChange={(e) => {
          setHasValue(!!e.target.value);
          if (onChange) onChange(e);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "w-full h-12 pt-5 pb-1 px-4 rounded-xl bg-[var(--surface-primary)] border border-[var(--border-strong)] focus:outline-none focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)] transition-all duration-200 text-sm font-medium text-[var(--text-primary)]",
          className
        )}
        {...props}
      />
      <label
        className={cn(
          "absolute left-4 pointer-events-none transition-all duration-200 font-bold text-[var(--text-muted)]",
          (isFocused || hasValue)
            ? "top-1 text-[9px] uppercase tracking-widest text-[var(--brand-accent)]"
            : "top-3.5 text-sm"
        )}
      >
        {label}
      </label>
    </div>
  );
});
FloatingLabelInput.displayName = "FloatingLabelInput";

// 12. PremiumSkeleton (Shimmer loading state)
export const PremiumSkeleton = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-strong)] overflow-hidden relative min-h-[40px]",
        className
      )}
    >
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  );
};

// 13. EmptyState
export const EmptyState = ({
  title,
  description,
  icon: Icon,
  actionText,
  onActionClick,
  className,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onActionClick?: () => void;
  className?: string;
}) => {
  return (
    <GlassCard className={cn("flex flex-col items-center justify-center text-center p-8 min-h-[300px]", className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-white/5 dark:bg-zinc-900 border border-black/5 dark:border-white/5 flex items-center justify-center text-muted-foreground mb-4">
          <Icon size={24} />
        </div>
      )}
      <h4 className="text-lg font-black tracking-tight text-foreground mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground font-medium max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onActionClick && (
        <GlowButton onClick={onActionClick} size="sm" className="rounded-xl glow-primary">
          {actionText}
        </GlowButton>
      )}
    </GlassCard>
  );
};

// 14. PageShell
export const PageShell = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-6 md:space-y-8 animate-fade-in", className)} {...props}>
      {children}
    </div>
  )
);
PageShell.displayName = "PageShell";

// 15. ContentSection
export const ContentSection = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { title?: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode }>(
  ({ className, title, description, action, children, ...props }, ref) => (
    <section ref={ref} className={cn("space-y-4 md:space-y-6", className)} {...props}>
      {(title || description || action) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div>
            {title && <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight">{title}</h2>}
            {description && <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
);
ContentSection.displayName = "ContentSection";

// 16. DashboardGrid
export const DashboardGrid = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6", className)} {...props}>
      {children}
    </div>
  )
);
DashboardGrid.displayName = "DashboardGrid";

// 17. MetricsRow
export const MetricsRow = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6", className)} {...props}>
      {children}
    </div>
  )
);
MetricsRow.displayName = "MetricsRow";

// 18. SidebarSection
export const SidebarSection = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1 mb-6", className)}>
    <h4 className="px-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">{title}</h4>
    {children}
  </div>
);

