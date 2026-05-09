import { motion } from "framer-motion";
import { Search, Inbox, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: "search" | "inbox" | "alert" | "loading";
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const icons = {
  search: Search,
  inbox: Inbox,
  alert: AlertCircle,
  loading: Loader2,
};

export function EmptyState({
  title,
  description,
  icon = "inbox",
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center p-12 text-center rounded-[2rem] border-2 border-dashed border-white/10 bg-white/5 backdrop-blur-sm ${className}`}
    >
      <div className={`w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 ${icon === 'loading' ? 'animate-pulse' : ''}`}>
        <Icon 
          size={40} 
          className={`text-primary ${icon === 'loading' ? 'animate-spin' : ''}`} 
        />
      </div>
      <h3 className="text-2xl font-black mb-2 tracking-tight">{title}</h3>
      <p className="text-muted-foreground font-medium max-w-xs mx-auto mb-8">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button 
          onClick={onAction} 
          className="rounded-xl h-12 px-8 font-bold glow-primary"
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
