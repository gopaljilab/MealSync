import { useState, useEffect, useCallback } from "react";
import {
  useListNgoRequests, getListNgoRequestsQueryKey,
  useAcceptNgoRequest, useRejectNgoRequest,
  useGetNgoHistory, getGetNgoHistoryQueryKey,
} from "@workspace/api-client-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, differenceInMinutes } from "date-fns";
import { useCountUp } from "@/hooks/useCountUp";
import { GoogleLocationMap } from "@/components/maps/GoogleLocationMap";
import {
  SectionContainer,
  SectionHeading,
  GlassCard,
  PremiumCard,
  GlowButton,
  StatusBadge,
  DashboardCard,
  EmptyState,
  PageShell,
  ContentSection,
  PremiumSkeleton,
} from "@/components/ui/premium";
import {
  Truck,
  Map,
  MapPin,
  Compass,
  ArrowRight,
  Shield,
  Activity,
  Check,
} from "lucide-react";

interface NgoImpact { totalMealsCollected: number; totalPickups: number; weekMeals: number; weekPickups: number; pendingRequests: number; co2Prevented: number }

function getFoodType(menu: string | undefined) {
  if (!menu) return "Mixed";
  const l = menu.toLowerCase();
  if (l.includes("rice") || l.includes("biryani") || l.includes("roti") || l.includes("naan")) return "Dry";
  if (l.includes("dal") || l.includes("curry") || l.includes("masala") || l.includes("chole") || l.includes("rajma")) return "Gravy";
  return "Mixed";
}

function getPrepTime(menu: string | undefined) {
  if (!menu) return "~30 min";
  const l = menu.toLowerCase();
  if (l.includes("biryani")) return "~60 min";
  if (l.includes("paneer") || l.includes("butter masala")) return "~45 min";
  return "~30 min";
}

function getUrgency(pickupTime: string) {
  const mins = differenceInMinutes(new Date(pickupTime), new Date());
  if (mins > 60) return { level: "fresh" as const, label: "Fresh", border: "border-l-primary", dot: "bg-primary", badge: "bg-emerald-500/10 text-primary border-primary/20" };
  if (mins > 20) return { level: "moderate" as const, label: "Moderate", border: "border-l-amber-500", dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
  return { level: "urgent" as const, label: "Urgent", border: "border-l-red-500", dot: "bg-red-500 animate-pulse-ring", badge: "bg-red-500/10 text-red-400 border-red-500/20" };
}

function PickupTimer({ pickupTime }: { pickupTime: string }) {
  const [, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  const mins = differenceInMinutes(new Date(pickupTime), new Date());
  if (mins < 0) return <span className="text-red-500 text-xs font-bold uppercase tracking-wider">Overdue</span>;
  return <span className="text-xs font-bold text-foreground">{mins > 60 ? `in ${Math.floor(mins / 60)}h ${mins % 60}m` : `in ${mins}m`}</span>;
}

/* ─── Status Timeline ───────────────────────────────────────── */
const TIMELINE_STEPS = ["Requested", "Accepted", "En Route", "Collected"];
const STATUS_IDX: Record<string, number> = { pending: 0, accepted: 1, "en-route": 2, completed: 3 };

function StatusTimeline({ status }: { status: string }) {
  const current = STATUS_IDX[status] ?? 0;
  return (
    <div className="flex items-start mt-5 pt-4 border-t border-[var(--border-subtle)]">
      {TIMELINE_STEPS.map((step, i) => (
        <div key={step} className="flex items-center flex-1 min-w-0">
          <div className="flex flex-col items-center">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${i <= current ? "bg-[var(--brand-accent)] text-white shadow-sm" : "bg-[var(--surface-secondary)] text-[var(--text-muted)] border border-[var(--border-strong)]"}`}>
              {i < current ? "✓" : i + 1}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 text-center leading-none ${i <= current ? "text-[var(--brand-accent)]" : "text-[var(--text-muted)]"}`}>{step}</span>
          </div>
          {i < TIMELINE_STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mb-5 mx-1 transition-all ${i < current ? "bg-[var(--brand-accent)]" : "bg-[var(--surface-secondary)]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Activity Feed ─────────────────────────────────────────── */
function ActivityFeed({ history }: { history: any[] }) {
  const recent = [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

  function getActivity(item: any) {
    if (item.status === "completed") return { emoji: "✅", text: "Pickup completed", color: "text-[var(--status-success)] bg-[var(--status-success-bg)] border-[var(--status-success)]/10" };
    if (item.status === "accepted") return { emoji: "🤝", text: "Pickup accepted", color: "text-[var(--status-info)] bg-[var(--status-info-bg)] border-[var(--status-info)]/10" };
    if (item.status === "rejected") return { emoji: "❌", text: "Request declined", color: "text-[var(--status-danger)] bg-[var(--status-danger-bg)] border-[var(--status-danger)]/10" };
    return { emoji: "📋", text: "New request created", color: "text-[var(--status-warning)] bg-[var(--status-warning-bg)] border-[var(--status-warning)]/10" };
  }

  if (recent.length === 0) {
    return (
      <div className="text-center py-10 text-[var(--text-muted)] border border-dashed border-[var(--border-strong)] rounded-2xl bg-[var(--surface-secondary)]">
        <div className="text-4xl mb-3">📡</div>
        <p className="font-semibold text-xs uppercase tracking-wider">No activity log found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recent.map((item, i) => {
        const act = getActivity(item);
        return (
          <div key={item.id} className={`flex items-start gap-3 p-3.5 rounded-xl border ${act.color} animate-slide-up`} style={{ animationDelay: `${i * 60}ms` }}>
            <span className="text-base shrink-0 mt-0.5">{act.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-[var(--text-primary)] leading-snug">{act.text}</p>
              <p className="text-[10px] text-[var(--text-secondary)] font-semibold mt-0.5">{item.pgName} · {item.availableMeals} meals{item.mealMenu ? ` · ${item.mealMenu}` : ""}</p>
            </div>
            <span className="text-[9px] font-bold text-[var(--text-muted)] shrink-0 whitespace-nowrap self-start">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── QR Modal ──────────────────────────────────────────────── */
function QrPickupModal({ onCollect, onClose }: { onCollect: () => void; onClose: () => void }) {
  const [scanned, setScanned] = useState(false);
  const handleScan = () => { setScanned(true); setTimeout(() => { onCollect(); onClose(); }, 1200); };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-[var(--surface-primary)] border border-[var(--border-strong)] rounded-2xl p-6 w-80 shadow-xl animate-bounce-in" onClick={e => e.stopPropagation()}>
        <h3 className="font-black text-base text-center mb-1 text-[var(--text-primary)] uppercase tracking-wider flex items-center justify-center gap-1.5">
          <Shield size={16} className="text-[var(--brand-accent)]" />
          <span>QR Verification</span>
        </h3>
        <p className="text-xs text-[var(--text-secondary)] text-center mb-5 font-semibold">Present this matrix code to the PG kitchen operator</p>
        <div className="aspect-square bg-[var(--surface-secondary)] rounded-2xl flex items-center justify-center mb-5 border border-[var(--border-strong)] overflow-hidden">
          {scanned ? (
            <div className="text-center animate-bounce-in">
              <div className="text-5xl">✅</div>
              <p className="text-xs font-black text-[var(--brand-accent)] mt-3 uppercase tracking-wider">Verification Complete</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 grid-rows-7 gap-1 p-5 bg-[var(--surface-primary)] rounded-xl border border-[var(--border-subtle)]">
              {Array.from({ length: 49 }, (_, i) => (
                <div key={i} className={`h-4.5 w-4.5 rounded-sm ${(i % 3 === 0 || i % 7 === 1 || i % 11 === 2) ? "bg-[var(--brand-accent)]" : "bg-transparent"}`} />
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <GlowButton variant="outline" className="flex-1 rounded-xl h-10 border-[var(--border-strong)] font-bold text-xs bg-[var(--surface-secondary)]" onClick={onClose}>Cancel</GlowButton>
          <GlowButton className="flex-1 rounded-xl h-10 font-bold text-xs bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent)]/90" onClick={handleScan} disabled={scanned}>{scanned ? "Verifying..." : "Simulate Scan"}</GlowButton>
        </div>
      </div>
    </div>
  );
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const count = useCountUp(value);
  return <span>{count}{suffix}</span>;
}

function sortByTime(reqs: any[]) { return [...reqs].sort((a, b) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime()); }

export default function NgoDashboard() {
  const queryClient = useQueryClient();
  const { data: requests, isLoading: reqLoading } = useListNgoRequests({ query: { queryKey: getListNgoRequestsQueryKey() } });
  const { data: history, isLoading: histLoading } = useGetNgoHistory({ query: { queryKey: getGetNgoHistoryQueryKey() } });
  const acceptReq = useAcceptNgoRequest();
  const rejectReq = useRejectNgoRequest();

  const [impact, setImpact] = useState<NgoImpact | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);
  const [qrModal, setQrModal] = useState<{ id: number } | null>(null);
  const [mapView, setMapView] = useState(false);

  const refreshImpact = useCallback(() => {
    fetch("/api/intelligence/ngo-impact", { credentials: "include" }).then(r => r.ok ? r.json() : null).then(d => d && setImpact(d)).catch(() => { });
  }, []);

  useEffect(() => { refreshImpact(); }, [refreshImpact]);

  const handleAccept = async (id: number) => {
    try { await acceptReq.mutateAsync({ id }); toast.success("✅ Pickup accepted!"); queryClient.invalidateQueries({ queryKey: getListNgoRequestsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetNgoHistoryQueryKey() }); refreshImpact(); }
    catch { toast.error("Failed to accept request"); }
  };

  const handleReject = async (id: number) => {
    try { await rejectReq.mutateAsync({ id }); toast.success("Request declined"); queryClient.invalidateQueries({ queryKey: getListNgoRequestsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetNgoHistoryQueryKey() }); }
    catch { toast.error("Failed to reject"); }
  };

  const handleComplete = async (id: number) => {
    setCompleting(id);
    try { await fetch(`/api/ngo/requests/${id}/complete`, { method: "POST", credentials: "include" }); toast.success("🎉 Pickup completed!"); queryClient.invalidateQueries({ queryKey: getListNgoRequestsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetNgoHistoryQueryKey() }); refreshImpact(); }
    catch { toast.error("Failed to confirm."); }
    finally { setCompleting(null); }
  };

  const sorted = requests ? sortByTime(requests) : null;
  const accepted = history?.filter(r => r.status === "accepted") ?? [];

  return (
    <PageShell>
      {/* Header */}
      <ContentSection
        title="NGO Logistics"
        description="Connect with PGs and coordinate active food pickups."
        action={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--brand-accent)] animate-pulse-ring" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-accent)] hidden sm:inline-block">Redistribution Hub</span>
            </div>
            <GlowButton variant={mapView ? "default" : "outline"} className="gap-2 rounded-xl h-10 border-[var(--border-strong)] font-bold text-xs uppercase tracking-wider bg-[var(--surface-primary)]" onClick={() => setMapView(v => !v)}>
              <span>{mapView ? "📋 List Grid" : "🗺️ Map View"}</span>
            </GlowButton>
          </div>
        }
      />

      {/* Interactive Google Maps view */}
      {mapView && sorted && sorted.length > 0 && (
        <GlassCard className="overflow-hidden p-0 border-[var(--border-strong)]" data-testid="card-map-view">
          <GoogleLocationMap />
        </GlassCard>
      )}

      {/* Impact Metrics Bento */}
      {impact && (
        <GlassCard data-testid="card-ngo-impact">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-accent)]">Performance Matrix</span>
              <h3 className="text-base font-black tracking-tight text-[var(--text-primary)] mt-1">Ecosystem Impact</h3>
            </div>
            <StatusBadge status="Confirmed" className="h-6" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { value: impact.totalMealsCollected, label: "Total Collected", color: "text-[var(--brand-accent)] bg-[var(--brand-accent)]/5 border-[var(--brand-accent)]/10" },
              { value: impact.totalPickups, label: "Total Pickups", color: "text-[var(--text-primary)] bg-[var(--surface-secondary)] border-[var(--border-strong)]" },
              { value: impact.weekMeals, label: "Meals This Week", color: "text-[var(--text-primary)] bg-[var(--surface-secondary)] border-[var(--border-strong)]" },
              { value: impact.weekPickups, label: "Pickups This Week", color: "text-[var(--text-primary)] bg-[var(--surface-secondary)] border-[var(--border-strong)]" },
              { value: impact.co2Prevented, label: "CO₂ Avoided (kg)", color: "text-[var(--brand-accent)] bg-[var(--brand-accent)]/5 border-[var(--brand-accent)]/10" },
              { value: impact.pendingRequests, label: "Pending Tasks", color: "text-[var(--text-primary)] bg-[var(--surface-secondary)] border-[var(--border-strong)]" },
            ].map(({ value, label, color }, i) => (
              <div key={i} className={`rounded-2xl p-4 text-center border ${color}`}>
                <p className="text-xl font-black tracking-tighter"><AnimatedNumber value={value} /></p>
                <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-wider leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Route Suggestion Banner */}
      {sorted && sorted.length > 1 && (
        <GlassCard className="bg-[var(--surface-secondary)] border-[var(--border-strong)] p-5" data-testid="card-route-suggestion">
          <div className="mb-4 flex items-center gap-2">
            <Compass size={16} className="text-[var(--brand-accent)]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)]">Logistical Optimization</h3>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border border-[var(--brand-accent)]/20 px-2 py-0.5 rounded-full ml-auto">Optimal Route</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {sorted.map((req, i) => (
              <div key={req.id} className="flex items-center gap-3">
                <div className="text-[10px] font-bold px-3 py-1.5 bg-[var(--surface-primary)] border border-[var(--border-strong)] rounded-full flex items-center gap-1.5 transition-colors hover:border-[var(--brand-accent)]/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-accent)]" />
                  <span className="text-[var(--text-primary)]">{req.pgName}</span>
                  <span className="text-[var(--text-muted)]">({req.availableMeals})</span>
                </div>
                {i < sorted.length - 1 && <ArrowRight size={14} className="text-[var(--text-muted)]" />}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Balanced Two-Column Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Logistics Requests (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-black tracking-tight text-[var(--text-primary)] uppercase tracking-wider">Available Pickups</h2>
            {reqLoading ? (
              <div className="space-y-4">
                <PremiumSkeleton className="h-52 w-full" />
                <PremiumSkeleton className="h-52 w-full" />
              </div>
            ) : !sorted || sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-14 text-center border border-dashed border-[var(--border-strong)] rounded-2xl text-[var(--text-muted)] bg-[var(--surface-secondary)]">
                <div className="text-4xl mb-4">📭</div>
                <p className="font-bold text-sm text-[var(--text-primary)] uppercase tracking-wider">Matrix Empty</p>
                <p className="text-xs text-[var(--text-muted)] font-semibold mt-1">PG operators will sync requests as surplus develops.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sorted.map((req, idx) => {
                  const urgency = getUrgency(req.pickupTime);
                  return (
                    <GlassCard key={req.id} className={`overflow-hidden border border-[var(--border-strong)] border-l-4 p-0 ${urgency.border} ${urgency.level === "urgent" ? "shadow-md" : ""} animate-slide-up`} style={{ animationDelay: `${idx * 80}ms` }} data-testid={`card-ngo-request-${req.id}`}>
                      <div className="p-5 border-b border-[var(--border-subtle)] bg-[var(--surface-primary)] flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`h-2.5 w-2.5 rounded-full ${urgency.dot}`} />
                            <h3 className="font-black text-base text-[var(--text-primary)] tracking-tight">{req.pgName}</h3>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] font-semibold flex items-center gap-1">
                            <MapPin size={12} />
                            <span>{req.pgLocation}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${urgency.badge}`}>{urgency.label}</span>
                          <span className="text-[10px] font-black text-[var(--text-primary)]">{req.availableMeals} meals</span>
                        </div>
                      </div>
                      <div className="p-5 grid grid-cols-2 gap-x-4 gap-y-3 text-xs border-b border-[var(--border-subtle)] font-semibold bg-[var(--surface-primary)]">
                        <div><p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-1">Menu Matrix</p><p className="text-[var(--text-primary)]">{req.mealMenu ?? "Mixed Surplus Items"}</p></div>
                        <div><p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-1">Pickup Log</p>
                          <div className="flex items-center gap-1.5 text-[var(--text-primary)]"><span>{format(new Date(req.pickupTime), "h:mm a")}</span><span className="text-[var(--text-muted)]">·</span><PickupTimer pickupTime={req.pickupTime} /></div>
                        </div>
                        <div><p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-1">Surplus Classification</p><span className="inline-flex text-[9px] font-black uppercase tracking-wider bg-[var(--surface-secondary)] border border-[var(--border-strong)] px-2 py-0.5 rounded-full text-[var(--text-primary)] mt-0.5">{getFoodType(req.mealMenu)}</span></div>
                        <div><p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-1">Prep Timeframe</p><p className="text-[var(--text-primary)] mt-0.5">{getPrepTime(req.mealMenu)}</p></div>
                      </div>
                      <div className="p-4 bg-[var(--surface-secondary)] flex gap-3">
                        <GlowButton className="flex-1 rounded-xl h-10 text-xs font-black uppercase tracking-wider bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent)]/90" onClick={() => handleAccept(req.id)} disabled={acceptReq.isPending} data-testid={`button-accept-${req.id}`}>Accept Pickup</GlowButton>
                        <GlowButton variant="outline" className="rounded-xl h-10 text-xs font-black uppercase tracking-wider border-[var(--border-strong)] bg-[var(--surface-primary)]" onClick={() => toast.info("Navigating to " + req.pgLocation)}>Navigate</GlowButton>
                        <GlowButton variant="outline" className="text-[var(--status-danger)] border-[var(--border-strong)] hover:border-[var(--status-danger)]/20 hover:bg-[var(--status-danger-bg)] bg-[var(--surface-primary)] rounded-xl h-10 w-10 flex items-center justify-center shrink-0" onClick={() => handleReject(req.id)} disabled={rejectReq.isPending} data-testid={`button-reject-${req.id}`}>✕</GlowButton>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timelines & History Logs (Span 1) */}
        <div className="space-y-6">
          {/* Awaiting Confirmation timeline tracker */}
          {accepted.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black tracking-tight text-[var(--text-primary)] uppercase tracking-wider">Awaiting Verification</h2>
              {accepted.map(item => (
                <GlassCard key={item.id} className="border border-[var(--border-strong)] border-l-4 border-l-[var(--status-warning)] p-5 shadow-sm animate-slide-up" data-testid={`card-accepted-${item.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-[var(--text-primary)]">{item.pgName}</h4>
                      <p className="text-[10px] text-[var(--text-secondary)] font-semibold mt-0.5">{item.availableMeals} meals · {item.mealMenu ?? "Mixed Surplus"}</p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border border-[var(--status-warning)]/20 px-2 py-0.5 rounded-full">Accepted</span>
                  </div>
                  <StatusTimeline status={item.status} />
                  <div className="flex gap-2.5 mt-4 pt-3 border-t border-[var(--border-subtle)]">
                    <GlowButton size="sm" variant="outline" className="flex-1 rounded-xl text-xs h-9 border-[var(--border-strong)] font-bold bg-[var(--surface-primary)]" onClick={() => setQrModal({ id: item.id })}>QR Matrix</GlowButton>
                    <GlowButton size="sm" className="flex-1 rounded-xl text-xs h-9 bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent)]/90 font-black uppercase tracking-wider" onClick={() => handleComplete(item.id)} disabled={completing === item.id} data-testid={`button-complete-${item.id}`}>
                      {completing === item.id ? "Confirming..." : "Verify"}
                    </GlowButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {/* Activity Feed Log */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black tracking-tight text-[var(--text-primary)] uppercase tracking-wider">Activity Feed</h2>
              <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[var(--brand-accent)] bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/20 px-2.5 py-1 rounded-full animate-pulse select-none">
                <span className="h-1 w-1 rounded-full bg-[var(--brand-accent)]" />
                Synced
              </div>
            </div>
            <GlassCard className="p-4 shadow-sm">
              {histLoading ? (
                <div className="space-y-3">
                  <PremiumSkeleton className="h-14 w-full" />
                  <PremiumSkeleton className="h-14 w-full" />
                </div>
              ) : (
                <ActivityFeed history={history ?? []} />
              )}
            </GlassCard>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {qrModal && <QrPickupModal onCollect={() => handleComplete(qrModal.id)} onClose={() => setQrModal(null)} />}
    </PageShell>
  );
}
