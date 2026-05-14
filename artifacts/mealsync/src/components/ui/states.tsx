import { AlertCircle, Loader2, FileX2, WifiOff, PackageX } from "lucide-react";
import { Button } from "./button";

// --- Empty State Components ---

interface EmptyStateProps {
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon: Icon = PackageX, 
  title, 
  description, 
  actionText, 
  onAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center glass-premium rounded-3xl border-dashed border-2 border-white/10 animate-fade-in">
      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 text-muted-foreground">
        <Icon size={32} />
      </div>
      <h3 className="text-xl font-black mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="outline" className="rounded-xl border-white/20 hover:bg-white/10 transition-colors font-bold">
          {actionText}
        </Button>
      )}
    </div>
  );
}

export function NoSurplusEmptyState() {
  return <EmptyState icon={FileX2} title="No Surplus Detected" description="All meals are accounted for today. Great job optimizing your kitchen!" />;
}

export function NoPickupsEmptyState() {
  return <EmptyState icon={PackageX} title="No Pending Pickups" description="There are no surplus food pickups available in your area right now." />;
}


// --- Loading Skeleton Components ---

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/10 rounded-md ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-premium p-6 rounded-3xl space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// --- Error State Components ---

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  isNetworkError?: boolean;
}

export function ErrorState({ title = "Something went wrong", message, onRetry, isNetworkError }: ErrorStateProps) {
  const Icon = isNetworkError ? WifiOff : AlertCircle;
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-destructive/10 border border-destructive/20 rounded-3xl animate-fade-in">
      <div className="w-16 h-16 bg-destructive/20 rounded-2xl flex items-center justify-center mb-4 text-destructive">
        <Icon size={32} />
      </div>
      <h3 className="text-xl font-black text-destructive mb-2">{title}</h3>
      <p className="text-sm text-destructive/80 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/20 transition-colors font-bold">
          Try Again
        </Button>
      )}
    </div>
  );
}
