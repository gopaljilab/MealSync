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
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[var(--surface-primary)] border border-[var(--border-strong)] rounded-2xl animate-fade-in shadow-sm min-h-[300px]">
      <div className="w-16 h-16 bg-[var(--surface-secondary)] rounded-2xl flex items-center justify-center mb-4 text-[var(--text-muted)]">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-black mb-2 text-[var(--text-primary)]">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} className="rounded-xl bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 text-white shadow-sm transition-colors font-bold">
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

export function NoMealPlansEmptyState({ onPlanAction }: { onPlanAction?: () => void }) {
  return <EmptyState 
    icon={FileX2} 
    title="No Active Meal Plans" 
    description="No active meal plans for tomorrow. Start planning meals to optimize kitchen prep and reduce food waste." 
    actionText="Plan Next Meal"
    onAction={onPlanAction}
  />;
}


// --- Loading Skeleton Components ---

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`animate-pulse bg-[var(--surface-secondary)] rounded-md ${className}`} style={style} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-[var(--surface-primary)] border border-[var(--border-strong)] p-6 rounded-2xl space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="flex justify-end gap-2 mt-4">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-[var(--surface-primary)] border border-[var(--border-strong)] p-6 rounded-2xl space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <div className="flex items-end gap-2 h-40 pt-4">
        {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
          <Skeleton key={i} className="w-full rounded-t-sm" style={{ height: `${h}%` }} />
        ))}
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
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[var(--status-danger-bg)] border border-[var(--status-danger)]/20 rounded-2xl animate-fade-in">
      <div className="w-16 h-16 bg-[var(--surface-primary)] rounded-2xl flex items-center justify-center mb-4 text-[var(--status-danger-text)] shadow-sm">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-black text-[var(--status-danger-text)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--status-danger-text)]/80 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="rounded-xl border-[var(--status-danger)]/30 text-[var(--status-danger-text)] hover:bg-[var(--surface-primary)] transition-colors font-bold">
          Try Again
        </Button>
      )}
    </div>
  );
}
